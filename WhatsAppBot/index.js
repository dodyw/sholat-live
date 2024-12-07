const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');
const adhan = require('adhan');
const moment = require('moment-timezone');
const { MongoClient } = require('mongodb');

// MongoDB connection
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('sholat-live');
    cachedDb = db;
    return db;
}

// Function to get city coordinates from database
async function getCityCoordinates(cityName) {
    const db = await connectToDatabase();
    const locations = db.collection('locations');
    return await locations.findOne({ 
        $or: [
            { name: cityName.toLowerCase() },
            { aliases: cityName.toLowerCase() }
        ]
    });
}

// Function to save message to database
async function saveMessage(message) {
    const db = await connectToDatabase();
    const messages = db.collection('messages');
    await messages.insertOne({
        from: message.from,
        text: message.text.body,
        timestamp: new Date(),
        messageId: message.id
    });
}

// Function to extract city name from message
function extractCityFromMessage(message) {
    // Convert message to lowercase for easier matching
    const msg = message.toLowerCase().trim();
    
    // Common patterns for prayer time requests
    const patterns = [
        // Basic patterns
        /jadwal\s+(?:sholat|shalat|solat)?\s+(?:di\s+)?([a-zA-Z\s]+)/i,     // "jadwal sholat di jakarta"
        /waktu\s+(?:sholat|shalat|solat)?\s+(?:di\s+)?([a-zA-Z\s]+)/i,      // "waktu sholat di jakarta"
        /(?:sholat|shalat|solat)\s+(?:di\s+)?([a-zA-Z\s]+)/i,               // "sholat jakarta"
        
        // Question patterns
        /kapan\s+(?:waktu\s+)?(?:sholat|shalat|solat)\s+(?:di\s+)?([a-zA-Z\s]+)/i,  // "kapan sholat di jakarta"
        /jam\s+(?:berapa\s+)?(?:sholat|shalat|solat)\s+(?:di\s+)?([a-zA-Z\s]+)/i,   // "jam berapa sholat di jakarta"
        
        // Location-first patterns
        /(?:di\s+)?([a-zA-Z\s]+)\s+(?:jadwal|waktu)?\s*(?:sholat|shalat|solat)/i,   // "jakarta jadwal sholat"
        
        // Specific prayer names
        /(?:waktu\s+)?(?:subuh|dzuhur|ashar|maghrib|isya)\s+(?:di\s+)?([a-zA-Z\s]+)/i,  // "subuh di jakarta"
        
        // Informal patterns
        /(?:mau\s+)?(?:tau|tahu|lihat|cek)\s+(?:jadwal|waktu)?\s*(?:sholat|shalat|solat)\s+(?:di\s+)?([a-zA-Z\s]+)/i,  // "mau tau sholat jakarta"
        /(?:tolong\s+)?(?:kasih|beri|tunjukkan)\s+(?:tau|tahu)?\s+(?:jadwal|waktu)?\s*(?:sholat|shalat|solat)\s+(?:di\s+)?([a-zA-Z\s]+)/i,  // "tolong kasih tau sholat jakarta"
        
        // Time-specific patterns
        /(?:jadwal|waktu)?\s*(?:sholat|shalat|solat)\s+(?:hari\s+)?(?:ini|besok|sekarang)\s+(?:di\s+)?([a-zA-Z\s]+)/i,  // "sholat hari ini di jakarta"
        
        // Direct city mention
        /^([a-zA-Z\s]+)$/i  // Just city name - should be checked last
    ];

    // Try each pattern
    for (const pattern of patterns) {
        const match = msg.match(pattern);
        if (match && match[1]) {
            // Clean up the city name
            let cityName = match[1].trim()
                // Remove common words that might be captured
                .replace(/\b(?:kota|daerah|wilayah|area)\b/gi, '')
                .replace(/\b(?:sekarang|besok|ini)\b/gi, '')
                .trim()
                // Convert spaces to camelCase
                .replace(/\s+(.)/g, (_, letter) => letter.toUpperCase())
                // Remove any remaining spaces
                .replace(/\s/g, '');
            
            return cityName.toLowerCase();
        }
    }
    
    return null;
}

// Function to extract city addition request
function extractCityAddRequest(message) {
    const msg = message.toLowerCase().trim();
    
    const patterns = [
        /(?:tolong\s+)?(?:tambah(?:kan)?|add)\s+(?:kota|city)?\s+([a-zA-Z\s]+)/i,  // "tambah kota bangkok"
        /(?:tolong\s+)?(?:daftar(?:kan)?|register)\s+(?:kota|city)?\s+([a-zA-Z\s]+)/i,  // "daftarkan kota bangkok"
        /(?:kota|city)\s+([a-zA-Z\s]+)\s+(?:belum|tidak|ga|gak)\s+(?:ada|terdaftar)/i,  // "kota bangkok belum ada"
    ];

    for (const pattern of patterns) {
        const match = msg.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return null;
}

// Function to get timezone from coordinates
async function getTimezone(lat, lon) {
    try {
        const response = await axios.get(`http://api.timezonedb.com/v2.1/get-time-zone`, {
            params: {
                key: process.env.TIMEZONE_DB_KEY,
                format: 'json',
                by: 'position',
                lat: lat,
                lng: lon
            }
        });

        if (response.data && response.data.status === 'OK') {
            return response.data.zoneName; // Returns format like 'Asia/Tokyo'
        }
        return null;
    } catch (error) {
        console.error('Error getting timezone:', error);
        return null;
    }
}

// Function to verify and get city coordinates using OpenStreetMap Nominatim
async function verifyCityAndGetCoordinates(cityName) {
    try {
        // Use Nominatim API to search for the city
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q: cityName,
                format: 'json',
                limit: 1,
                addressdetails: 1,
                featuretype: 'city'
            },
            headers: {
                'User-Agent': 'SholatLive/1.0'
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            const address = result.address;
            
            // Accept more location types for major cities
            if (address.city || address.town || address.county || address.municipality || 
                address.state || address.province || address.region) {
                
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                const timezone = await getTimezone(lat, lon);

                return {
                    name: cityName.toLowerCase(),
                    displayName: address.city || address.town || address.state || result.name,
                    latitude: lat,
                    longitude: lon,
                    timezone: timezone || 'Asia/Jakarta', // Fallback to Jakarta if timezone lookup fails
                    aliases: [cityName.toLowerCase()],
                    type: address.city ? 'city' : 
                          address.town ? 'town' : 
                          address.state ? 'state' :
                          address.province ? 'province' :
                          'region'
                };
            }

            // Fallback for major cities that might be categorized differently
            const knownCities = {
                'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo', timezone: 'Asia/Tokyo' },
                'beijing': { lat: 39.9042, lon: 116.4074, name: 'Beijing', timezone: 'Asia/Shanghai' },
                'hongkong': { lat: 22.3193, lon: 114.1694, name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
                'singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore', timezone: 'Asia/Singapore' },
                'seoul': { lat: 37.5665, lon: 126.9780, name: 'Seoul', timezone: 'Asia/Seoul' },
                'bangkok': { lat: 13.7563, lon: 100.5018, name: 'Bangkok', timezone: 'Asia/Bangkok' },
                'kualalumpur': { lat: 3.1390, lon: 101.6869, name: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur' }
            };

            const normalizedCity = cityName.toLowerCase().replace(/\s+/g, '');
            if (knownCities[normalizedCity]) {
                const city = knownCities[normalizedCity];
                return {
                    name: normalizedCity,
                    displayName: city.name,
                    latitude: city.lat,
                    longitude: city.lon,
                    timezone: city.timezone,
                    aliases: [normalizedCity],
                    type: 'city'
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Error verifying city:', error);
        return null;
    }
}

// Function to add new city to database
async function addNewCity(cityData) {
    try {
        const db = await connectToDatabase();
        const locations = db.collection('locations');
        
        // Check if city already exists
        const existingCity = await locations.findOne({ 
            $or: [
                { name: cityData.name },
                { aliases: cityData.name }
            ]
        });
        
        if (existingCity) {
            return existingCity;
        }
        
        // Insert new city
        await locations.insertOne(cityData);
        return cityData;
    } catch (error) {
        console.error('Error adding city:', error);
        return null;
    }
}

// Function to format prayer times
function formatPrayerTimes(prayerTimes, cityName, timezone) {
    const format = (date) => {
        return moment(date).tz(timezone).format('HH:mm');
    };

    return `Jadwal Sholat ${cityName} hari ini:

🌅 Subuh: ${format(prayerTimes.fajr)}
🌞 Terbit: ${format(prayerTimes.sunrise)}
☀️ Dzuhur: ${format(prayerTimes.dhuhr)}
🌅 Ashar: ${format(prayerTimes.asr)}
🌄 Maghrib: ${format(prayerTimes.maghrib)}
🌙 Isya: ${format(prayerTimes.isha)}

Waktu dalam zona waktu: ${timezone}`;
}

// Function to get prayer times
async function getPrayerTimes(cityName) {
    let coordinates = await getCityCoordinates(cityName);
    
    // If city not found in database, try to add it
    if (!coordinates) {
        const cityData = await verifyCityAndGetCoordinates(cityName);
        if (cityData) {
            coordinates = await addNewCity(cityData);
        }
    }

    if (!coordinates) {
        return null;
    }

    const date = new Date();
    const coordinates_calc = new adhan.Coordinates(coordinates.latitude, coordinates.longitude);
    const params = adhan.CalculationMethod.MoonsightingCommittee();
    params.madhab = adhan.Madhab.Shafi;
    const prayerTimes = new adhan.PrayerTimes(coordinates_calc, date, params);
    
    return {
        cityName: coordinates.displayName || cityName,
        times: prayerTimes,
        timezone: coordinates.timezone || 'Asia/Jakarta'
    };
}

// Function to send WhatsApp message
async function sendWhatsAppMessage(to, message) {
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !phoneNumberId) {
        throw new Error('Missing WhatsApp configuration. Please check WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables.');
    }

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
        const response = await axios({
            method: 'POST',
            url: url,
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: { 
                    preview_url: false,
                    body: message 
                }
            }
        });

        return response.data;
    } catch (error) {
        throw error;
    }
}

module.exports = async function (context, req) {
    context.log('🔄 WhatsApp webhook triggered');

    // Handle WhatsApp verification
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            context.res = { status: 200, body: parseInt(challenge) };
            return;
        }
        context.res = { status: 403, body: 'Forbidden' };
        return;
    }

    try {
        const body = req.body;
        
        if (!body || !body.object || !body.entry || !body.entry[0]) {
            context.res = { status: 400, body: 'Invalid request body' };
            return;
        }

        if (body.object === 'whatsapp_business_account') {
            const changes = body.entry[0].changes[0];
            if (changes && changes.value && changes.value.messages && changes.value.messages[0]) {
                const message = changes.value.messages[0];
                const from = message.from;
                const messageBody = message.text.body;

                // Save message to database
                await saveMessage(message);

                // Check if it's a city addition request
                const cityAddRequest = extractCityAddRequest(messageBody);
                if (cityAddRequest) {
                    // Verify and get coordinates
                    const cityData = await verifyCityAndGetCoordinates(cityAddRequest);
                    
                    if (!cityData) {
                        await sendWhatsAppMessage(
                            from,
                            `❌ Maaf, "${cityAddRequest}" tidak dapat diverifikasi sebagai kota/kabupaten yang valid. Pastikan nama kota sudah benar.`
                        );
                        return;
                    }
                    
                    // Add city to database
                    const result = await addNewCity(cityData);
                    await sendWhatsAppMessage(from, `✅ Kota ${result.displayName} berhasil ditambahkan!\n\nSekarang Anda bisa mengecek jadwal sholat untuk kota ini dengan mengetik:\n"jadwal sholat ${result.name}"`);
                    return;
                }

                // Extract city using our function
                const extractedCity = extractCityFromMessage(messageBody);
                let responseMessage;

                if (!extractedCity) {
                    responseMessage = 'Assalamualaikum 🙏\nMohon maaf, saya tidak bisa mengenali kota yang Anda maksud. Silakan tulis dengan format:\n"Jadwal sholat [nama kota]"\nContoh:\n- Jadwal sholat Jakarta\n- Jadwal sholat di Surabaya\n- Waktu sholat Bandung';
                } else {
                    const prayerTimes = await getPrayerTimes(extractedCity);
                    if (!prayerTimes) {
                        responseMessage = `Mohon maaf, "${extractedCity}" bukan merupakan nama kota yang valid. Silakan periksa kembali nama kota yang Anda masukkan.`;
                    } else {
                        responseMessage = formatPrayerTimes(prayerTimes.times, prayerTimes.cityName, prayerTimes.timezone);
                    }
                }

                await sendWhatsAppMessage(from, responseMessage);
                context.res = { status: 200, body: 'Message processed successfully' };
                return;
            }
        }
        
        context.res = { status: 200, body: 'No messages to process' };
        
    } catch (error) {
        context.log.error('Error processing message:', error);
        context.res = { status: 500, body: 'Internal server error' };
    }
};
