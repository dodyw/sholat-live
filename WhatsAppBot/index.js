const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');
const adhan = require('adhan');
const moment = require('moment-timezone');

// City coordinates mapping for 50 major Indonesian cities
const CITY_COORDINATES = {
    surabaya: { latitude: -7.2575, longitude: 112.7521 },
    jakarta: { latitude: -6.2088, longitude: 106.8456 },
    medan: { latitude: 3.5952, longitude: 98.6722 },
    bandung: { latitude: -6.9175, longitude: 107.6191 },
    semarang: { latitude: -7.0051, longitude: 110.4381 },
    yogyakarta: { latitude: -7.7971, longitude: 110.3688 },
    malang: { latitude: -7.9797, longitude: 112.6304 },
    denpasar: { latitude: -8.6500, longitude: 115.2167 },
    palembang: { latitude: -2.9761, longitude: 104.7754 },
    makassar: { latitude: -5.1477, longitude: 119.4327 },
    tangerang: { latitude: -6.1784, longitude: 106.6319 },
    depok: { latitude: -6.4025, longitude: 106.7942 },
    bekasi: { latitude: -6.2349, longitude: 106.9896 },
    bogor: { latitude: -6.5971, longitude: 106.8060 },
    batam: { latitude: 1.1301, longitude: 104.0529 },
    pekanbaru: { latitude: 0.5103, longitude: 101.4478 },
    padang: { latitude: -0.9471, longitude: 100.4172 },
    manado: { latitude: 1.4748, longitude: 124.8421 },
    samarinda: { latitude: -0.4948, longitude: 117.1436 },
    banjarmasin: { latitude: -3.3186, longitude: 114.5944 },
    tasikmalaya: { latitude: -7.3274, longitude: 108.2207 },
    serang: { latitude: -6.1104, longitude: 106.1640 },
    cirebon: { latitude: -6.7320, longitude: 108.5523 },
    sukabumi: { latitude: -6.9277, longitude: 106.9300 },
    jambi: { latitude: -1.6101, longitude: 103.6131 },
    bengkulu: { latitude: -3.7928, longitude: 102.2608 },
    pekalongan: { latitude: -6.8898, longitude: 109.6746 },
    magelang: { latitude: -7.4797, longitude: 110.2177 },
    tegal: { latitude: -6.8797, longitude: 109.1256 },
    mataram: { latitude: -8.5833, longitude: 116.1167 },
    kupang: { latitude: -10.1772, longitude: 123.6070 },
    ambon: { latitude: -3.6954, longitude: 128.1814 },
    jayapura: { latitude: -2.5916, longitude: 140.6690 },
    pontianak: { latitude: -0.0263, longitude: 109.3425 },
    balikpapan: { latitude: -1.2379, longitude: 116.8529 },
    palangkaraya: { latitude: -2.2161, longitude: 113.9135 },
    bandaAceh: { latitude: 5.5483, longitude: 95.3238 },
    kendari: { latitude: -3.9985, longitude: 122.5127 },
    palu: { latitude: -0.9003, longitude: 119.8779 },
    gorontalo: { latitude: 0.5375, longitude: 123.0568 },
    mamuju: { latitude: -2.6748, longitude: 118.8885 },
    ternate: { latitude: 0.7963, longitude: 127.3862 },
    tanjungPinang: { latitude: 0.9179, longitude: 104.4665 },
    pangkalPinang: { latitude: -2.1316, longitude: 106.1169 },
    cilegon: { latitude: -6.0174, longitude: 106.0541 },
    kediri: { latitude: -7.8168, longitude: 112.0184 },
    pematangSiantar: { latitude: 2.9570, longitude: 99.0681 },
    bandarLampung: { latitude: -5.3971, longitude: 105.2668 },
    solo: { latitude: -7.5755, longitude: 110.8243 },
    purwokerto: { latitude: -7.4206, longitude: 109.2372 },
    banjarbaru: { latitude: -3.4572, longitude: 114.8313 },
    sorong: { latitude: -0.8767, longitude: 131.2558 }
};

module.exports = async function (context, req) {
    context.log('🔄 WhatsApp webhook triggered');

    // Handle WhatsApp verification
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        context.log(`🔒 Webhook verification request - Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);
        context.log(`🔑 Expected token: ${process.env.WHATSAPP_VERIFY_TOKEN}`);

        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            context.log('👍 Webhook verified successfully');
            context.res = {
                status: 200,
                body: parseInt(challenge)
            };
            return;
        }
        context.log('🚫 Webhook verification failed');
        context.res = {
            status: 403,
            body: 'Forbidden'
        };
        return;
    }

    try {
        // Handle incoming messages
        const body = req.body;
        context.log('🔄 Webhook request body:', JSON.stringify(body, null, 2));
        
        if (!body || !body.object || !body.entry || !body.entry[0]) {
            context.log.warn('❌ Invalid webhook body structure');
            context.res = {
                status: 400,
                body: 'Invalid request body'
            };
            return;
        }

        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry[0];
            if (!entry.changes || !entry.changes[0] || !entry.changes[0].value) {
                context.log.warn('❌ Invalid entry structure');
                context.res = {
                    status: 400,
                    body: 'Invalid entry structure'
                };
                return;
            }

            const value = entry.changes[0].value;
            
            if (value.messages && value.messages.length > 0) {
                const message = value.messages[0];
                if (!message.from || !message.text || !message.text.body) {
                    context.log.warn('❌ Invalid message structure:', JSON.stringify(message));
                    context.res = {
                        status: 400,
                        body: 'Invalid message structure'
                    };
                    return;
                }

                const from = message.from;
                const messageBody = message.text.body.toLowerCase();
                
                context.log(`📱 Processing message from ${from}: ${messageBody}`);

                let response = '';
                let city = 'surabaya'; // Default city
                let cityInput = ''; // Store original city input

                if (messageBody.startsWith('jadwal')) {
                    context.log('🕒 Processing jadwal command');
                    // Check if city is specified
                    const parts = messageBody.split(' ');
                    if (parts.length > 1) {
                        // Remove 'jadwal' and join the rest for multi-word cities
                        cityInput = parts.slice(1).join(' ');
                        // Convert to camelCase (e.g., "banda aceh" -> "bandaAceh")
                        city = cityInput.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
                        context.log(`🌆 City specified: ${cityInput} (${city})`);
                    }

                    if (!CITY_COORDINATES[city]) {
                        context.log.warn(`❌ Invalid city requested: ${city}`);
                        // Format city names for display
                        const cityList = Object.keys(CITY_COORDINATES)
                            .map(c => c.replace(/([A-Z])/g, ' $1').toLowerCase())
                            .sort()
                            .join('\n');
                        
                        response = `Maaf, kota ${cityInput || city} belum tersedia.\nKota yang tersedia:\n${cityList}`;
                    } else {
                        context.log(`🌍 Getting prayer times for ${city}`);
                        // Get prayer times
                        const prayerTimes = await getPrayerTimes(city);
                        response = formatPrayerTimes(prayerTimes, city);
                        context.log(`✅ Prayer times retrieved for ${city}`);
                    }
                } else {
                    context.log('ℹ️ Sending help message');
                    response = 'Untuk melihat jadwal sholat, ketik:\n*jadwal* untuk Surabaya\natau\n*jadwal [nama_kota]* untuk kota lain\nContoh: jadwal banda aceh';
                }

                context.log('📤 Sending response:', response);

                try {
                    const result = await sendWhatsAppMessage(from, response);
                    context.log('✅ WhatsApp API response:', JSON.stringify(result));
                    context.res = {
                        status: 200,
                        body: 'Message sent successfully'
                    };
                } catch (error) {
                    context.log.error('❌ Failed to send WhatsApp message:', error);
                    context.res = {
                        status: 500,
                        body: 'Failed to send message'
                    };
                }
            } else {
                context.log('ℹ️ No messages in the webhook');
                context.res = {
                    status: 200,
                    body: 'No messages to process'
                };
            }
        } else {
            context.log.warn('❌ Unknown webhook object type:', body.object);
            context.res = {
                status: 400,
                body: 'Unknown webhook object type'
            };
        }
    } catch (error) {
        context.log.error('❌ Error processing webhook:', error);
        context.res = {
            status: 500,
            body: 'Internal Server Error'
        };
    }
};

async function getPrayerTimes(city) {
    const coords = CITY_COORDINATES[city];
    const timezone = 'Asia/Jakarta';
    const prayerDate = new Date();
    
    // Create coordinates
    const coordinates = new adhan.Coordinates(coords.latitude, coords.longitude);
    
    // Get prayer times
    const params = adhan.CalculationMethod.MoonsightingCommittee();
    params.madhab = adhan.Madhab.Shafi;
    const prayerTimes = new adhan.PrayerTimes(coordinates, prayerDate, params);

    return {
        fajr: moment(prayerTimes.fajr).tz(timezone).format('HH:mm'),
        sunrise: moment(prayerTimes.sunrise).tz(timezone).format('HH:mm'),
        dhuhr: moment(prayerTimes.dhuhr).tz(timezone).format('HH:mm'),
        asr: moment(prayerTimes.asr).tz(timezone).format('HH:mm'),
        maghrib: moment(prayerTimes.maghrib).tz(timezone).format('HH:mm'),
        isha: moment(prayerTimes.isha).tz(timezone).format('HH:mm'),
        date: moment(prayerDate).tz(timezone).format('YYYY-MM-DD')
    };
}

function formatPrayerTimes(timings, city) {
    const date = moment().tz('Asia/Jakarta').format('dddd, D MMMM YYYY');
    city = city.charAt(0).toUpperCase() + city.slice(1);

    return `*Jadwal Sholat ${city}*\n` +
           `${date}\n\n` +
           `Subuh: ${timings.fajr}\n` +
           `Terbit: ${timings.sunrise}\n` +
           `Dzuhur: ${timings.dhuhr}\n` +
           `Ashar: ${timings.asr}\n` +
           `Maghrib: ${timings.maghrib}\n` +
           `Isya: ${timings.isha}`;
}

async function sendWhatsAppMessage(to, message) {
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !phoneNumberId) {
        throw new Error('Missing WhatsApp configuration. Please check WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables.');
    }

    console.log('WhatsApp Configuration:', {
        phoneNumberId,
        tokenLength: whatsappToken.length,
        to,
        messageLength: message.length
    });

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
        console.log('Making request to:', url);

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

        console.log('WhatsApp API Response:', {
            status: response.status,
            data: response.data
        });
        return response.data;
    } catch (error) {
        console.error('WhatsApp API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
}
