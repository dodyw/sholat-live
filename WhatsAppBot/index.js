const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');
const adhan = require('adhan');
const moment = require('moment-timezone');
const { TableClient } = require("@azure/data-tables");

// Function to get table client
function getTableClient(context) {
    try {
        if (!process.env.AzureWebJobsStorage) {
            context.log.warn('AzureWebJobsStorage connection string not found');
            return null;
        }
        return TableClient.fromConnectionString(
            process.env.AzureWebJobsStorage,
            "userMessages"
        );
    } catch (error) {
        context.log.error('Failed to initialize Table Client:', error);
        return null;
    }
}

// Function to check if we should send salam
async function shouldSendSalam(userId, context) {
    try {
        const tableClient = getTableClient(context);
        if (!tableClient) {
            context.log.warn('Table client not available, defaulting to NOT send salam');
            return false; 
        }

        const now = new Date();
        const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));

        try {
            // Try to get the user's last message time
            const entity = await tableClient.getEntity("messages", userId);
            const lastMessageTime = new Date(entity.lastMessageTime);
            
            // Update the timestamp regardless of whether we'll send salam
            await tableClient.upsertEntity({
                partitionKey: "messages",
                rowKey: userId,
                lastMessageTime: now.toISOString()
            }, "Replace");
            
            // If last message was less than 3 hours ago, don't send salam
            if (lastMessageTime > threeHoursAgo) {
                context.log(`Last message was within 3 hours for user ${userId}, no salam needed`);
                return false;
            }
        } catch (error) {
            if (error.statusCode === 404) {
                // First time user, create entry and send salam
                await tableClient.upsertEntity({
                    partitionKey: "messages",
                    rowKey: userId,
                    lastMessageTime: now.toISOString()
                }, "Replace");
                context.log(`First message from user ${userId}, sending salam`);
                return true;
            }
            context.log.warn('Error checking last message time:', error);
            return false; 
        }

        context.log(`More than 3 hours since last message for user ${userId}, sending salam`);
        return true;
    } catch (error) {
        context.log.error('Error managing message tracking:', error);
        return false; 
    }
}

// Function to get conversation history
async function getConversationHistory(userId, context, maxMessages = 5) {
    try {
        const tableClient = getTableClient(context);
        if (!tableClient) {
            context.log.warn('Table client not available for conversation history');
            return [];
        }

        const query = {
            queryOptions: { filter: `PartitionKey eq 'conversation_${userId}'` }
        };

        let messages = [];
        const iterator = tableClient.listEntities(query);
        for await (const message of iterator) {
            messages.push({
                role: message.role,
                content: message.content,
                timestamp: new Date(message.timestamp)
            });
        }

        // Sort by timestamp and get last N messages
        messages.sort((a, b) => b.timestamp - a.timestamp);
        return messages.slice(0, maxMessages).reverse();
    } catch (error) {
        context.log.error('Error fetching conversation history:', error);
        return [];
    }
}

// Function to store message in history
async function storeMessage(userId, role, content, context) {
    try {
        const tableClient = getTableClient(context);
        if (!tableClient) return;

        const timestamp = new Date().toISOString();
        const rowKey = `${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

        await tableClient.createEntity({
            partitionKey: `conversation_${userId}`,
            rowKey: rowKey,
            role: role,
            content: content,
            timestamp: timestamp
        });
    } catch (error) {
        context.log.error('Error storing message:', error);
    }
}

// Function to get AI response
async function getAIResponse(userMessage, userId, context) {
    try {
        const shouldGreet = await shouldSendSalam(userId, context);
        context.log('Should greet with salam:', shouldGreet);
        
        // Get recent conversation history
        const conversationHistory = await getConversationHistory(userId, context);
        
        const systemMessage = {
            role: "system",
            content: `Anda adalah asisten virtual cerdas untuk layanan jadwal sholat.
            Panduan penting:
            - JANGAN PERNAH mengucapkan salam kecuali ${shouldGreet ? 'ini adalah pesan pertama setelah 3 jam' : 'JANGAN'}
            - Jika user mengucapkan salam, jawab dengan "Waalaikumussalam"
            - Ingat konteks percakapan sebelumnya dengan user
            - Jika user sudah menyebutkan kota sebelumnya, gunakan informasi tersebut
            - Berikan respons yang personal dan relevan dengan percakapan
            - Bantu mencari kota untuk jadwal sholat
            - Jelaskan waktu sholat dengan bahasa sederhana
            - Jawab pertanyaan umum tentang sholat
            - Selalu berbicara dalam Bahasa Indonesia yang sopan dan formal
            - Jika user menanyakan jadwal sholat dan belum menyebutkan kota, tanyakan kota mereka
            - JANGAN memberikan jadwal sholat spesifik
            ${shouldGreet ? '- WAJIB mulai dengan "Assalamu\'alaikum"' : '- DILARANG mengucapkan salam'}`
        };

        const messages = [
            systemMessage,
            ...conversationHistory,
            { role: "user", content: userMessage }
        ];

        const apiUrl = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2023-05-15`;
        context.log('🌐 API URL:', apiUrl);
        context.log('🤖 Requesting AI response for:', userMessage);
        context.log('👋 Should greet with salam:', shouldGreet);
        
        const response = await axios.post(
            apiUrl,
            {
                messages: messages,
                max_tokens: 800,
                temperature: 0.7,
                frequency_penalty: 0.5,
                presence_penalty: 0.5,
                top_p: 0.95,
                stop: null
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': process.env.AZURE_OPENAI_API_KEY
                }
            }
        );

        const assistantResponse = response.data.choices[0].message.content;

        // Store both user message and assistant response in history
        await storeMessage(userId, "user", userMessage, context);
        await storeMessage(userId, "assistant", assistantResponse, context);

        return assistantResponse;
    } catch (error) {
        context.log.error('❌ Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });
        
        if (error.response?.status === 429 || (error.message && error.message.toLowerCase().includes('rate limit'))) {
            return 'Mohon maaf, layanan sedang sangat ramai. Untuk jadwal sholat, silakan ketik "jadwal [nama kota]" (contoh: jadwal jakarta)';
        }

        if (error.message && error.message.includes('No response from AI')) {
            return 'Mohon maaf, layanan AI sedang tidak merespon. Untuk jadwal sholat, silakan ketik "jadwal [nama kota]" (contoh: jadwal jakarta)';
        }
        
        return 'Mohon maaf, terjadi kendala teknis. Untuk jadwal sholat, silakan ketik "jadwal [nama kota]" (contoh: jadwal jakarta)';
    }
}

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

                if (messageBody.startsWith('jadwal')) {
                    context.log('🕒 Processing jadwal command');
                    // Check if city is specified
                    const parts = messageBody.split(' ');
                    if (parts.length > 1) {
                        // Remove 'jadwal' and join the rest for multi-word cities
                        const cityInput = parts.slice(1).join(' ');
                        // Convert to camelCase (e.g., "banda aceh" -> "bandaAceh")
                        const city = cityInput.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
                        context.log(`🌆 City specified: ${cityInput} (${city})`);

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
                        // No city specified, get AI to help
                        response = await getAIResponse(messageBody, from, context);
                    }
                } else {
                    // For non-jadwal messages, use AI
                    response = await getAIResponse(messageBody, from, context);
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
