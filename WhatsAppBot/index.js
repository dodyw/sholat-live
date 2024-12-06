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
    context.log('WhatsApp webhook triggered');

    // Handle WhatsApp verification
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        context.log(`Webhook verification request - Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);
        context.log(`Expected token: ${process.env.WHATSAPP_VERIFY_TOKEN}`);

        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            context.log('Webhook verified successfully');
            context.res = {
                status: 200,
                body: parseInt(challenge)
            };
            return;
        }
        context.log('Webhook verification failed');
        context.res = {
            status: 403,
            body: 'Forbidden'
        };
        return;
    }

    try {
        // Handle incoming messages
        const body = req.body;
        
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry[0];
            const changes = entry.changes[0];
            const value = changes.value;
            
            if (value.messages && value.messages.length > 0) {
                const message = value.messages[0];
                const from = message.from;
                const messageBody = message.text.body.toLowerCase();

                let response = '';
                let city = 'surabaya'; // Default city
                let cityInput = ''; // Store original city input

                if (messageBody.startsWith('jadwal')) {
                    // Check if city is specified
                    const parts = messageBody.split(' ');
                    if (parts.length > 1) {
                        // Remove 'jadwal' and join the rest for multi-word cities
                        cityInput = parts.slice(1).join(' ');
                        // Convert to camelCase (e.g., "banda aceh" -> "bandaAceh")
                        city = cityInput.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
                    }

                    if (!CITY_COORDINATES[city]) {
                        // Format city names for display
                        const cityList = Object.keys(CITY_COORDINATES)
                            .map(c => c.replace(/([A-Z])/g, ' $1').toLowerCase())
                            .sort()
                            .join('\n');
                        
                        response = `Maaf, kota ${cityInput || city} belum tersedia.\nKota yang tersedia:\n${cityList}`;
                    } else {
                        // Get prayer times
                        const prayerTimes = await getPrayerTimes(city);
                        response = formatPrayerTimes(prayerTimes, city);
                    }
                } else {
                    response = 'Untuk melihat jadwal sholat, ketik:\n*jadwal* untuk Surabaya\natau\n*jadwal [nama_kota]* untuk kota lain\nContoh: jadwal banda aceh';
                }

                // Send response back to WhatsApp
                await sendWhatsAppMessage(from, response);
            }
        }

        return { statusCode: 200 };
    } catch (error) {
        context.error('Error:', error);
        return { statusCode: 500 };
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
    // Skip WhatsApp API calls in test environment
    if (process.env.NODE_ENV === 'test') {
        console.log('\nResponse Message:', message, '\n');
        return;
    }

    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    await axios.post(
        `https://graph.facebook.com/v12.0/${phoneNumberId}/messages`,
        {
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: message }
        },
        {
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            }
        }
    );
}
