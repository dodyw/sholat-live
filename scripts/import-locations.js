require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');
const axios = require('axios');

// Function to add delay between API calls
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
            return response.data.zoneName;
        }
        return 'Asia/Jakarta'; // Default to Jakarta timezone
    } catch (error) {
        console.error('Error getting timezone:', error);
        return 'Asia/Jakarta';
    }
}

const cities = [
    // Java
    {
        name: 'jakarta',
        displayName: 'Jakarta',
        latitude: -6.2088,
        longitude: 106.8456,
        aliases: ['dki', 'dki jakarta', 'jakarta pusat', 'jakpus', 'jakarta selatan', 'jaksel', 'jakarta timur', 'jaktim', 'jakarta barat', 'jakbar', 'jakarta utara', 'jakut']
    },
    {
        name: 'surabaya',
        displayName: 'Surabaya',
        latitude: -7.2575,
        longitude: 112.7521,
        aliases: ['sby', 'suroboyo']
    },
    {
        name: 'bandung',
        displayName: 'Bandung',
        latitude: -6.9175,
        longitude: 107.6191,
        aliases: ['bdg', 'paris van java']
    },
    {
        name: 'semarang',
        displayName: 'Semarang',
        latitude: -6.9932,
        longitude: 110.4203,
        aliases: ['smg']
    },
    {
        name: 'yogyakarta',
        displayName: 'Yogyakarta',
        latitude: -7.7971,
        longitude: 110.3688,
        aliases: ['jogja', 'yogya', 'jogjakarta', 'diy']
    },
    {
        name: 'malang',
        displayName: 'Malang',
        latitude: -7.9797,
        longitude: 112.6304,
        aliases: ['mlg']
    },
    {
        name: 'bogor',
        displayName: 'Bogor',
        latitude: -6.5971,
        longitude: 106.8060,
        aliases: ['bgr']
    },
    {
        name: 'tangerang',
        displayName: 'Tangerang',
        latitude: -6.1784,
        longitude: 106.6319,
        aliases: ['tang', 'tangsel', 'tangerang selatan']
    },
    {
        name: 'depok',
        displayName: 'Depok',
        latitude: -6.4025,
        longitude: 106.7942,
        aliases: ['dpk']
    },
    {
        name: 'bekasi',
        displayName: 'Bekasi',
        latitude: -6.2383,
        longitude: 106.9756,
        aliases: ['bks']
    },

    // Sumatra
    {
        name: 'medan',
        displayName: 'Medan',
        latitude: 3.5952,
        longitude: 98.6722,
        aliases: ['mdn']
    },
    {
        name: 'palembang',
        displayName: 'Palembang',
        latitude: -2.9761,
        longitude: 104.7754,
        aliases: ['plg', 'plbg']
    },
    {
        name: 'bandaaceh',
        displayName: 'Banda Aceh',
        latitude: 5.5483,
        longitude: 95.3238,
        aliases: ['aceh']
    },
    {
        name: 'padang',
        displayName: 'Padang',
        latitude: -0.9471,
        longitude: 100.4172,
        aliases: ['pdg']
    },
    {
        name: 'pekanbaru',
        displayName: 'Pekanbaru',
        latitude: 0.5071,
        longitude: 101.4478,
        aliases: ['pkb', 'pku']
    },
    {
        name: 'jambi',
        displayName: 'Jambi',
        latitude: -1.6101,
        longitude: 103.6131,
        aliases: ['jmb']
    },
    {
        name: 'bengkulu',
        displayName: 'Bengkulu',
        latitude: -3.7928,
        longitude: 102.2608,
        aliases: ['bgl']
    },
    {
        name: 'lampung',
        displayName: 'Bandar Lampung',
        latitude: -5.3971,
        longitude: 105.2668,
        aliases: ['lampung', 'bandarlampung']
    },

    // Kalimantan
    {
        name: 'pontianak',
        displayName: 'Pontianak',
        latitude: 0.0263,
        longitude: 109.3425,
        aliases: ['ptk']
    },
    {
        name: 'banjarmasin',
        displayName: 'Banjarmasin',
        latitude: -3.3186,
        longitude: 114.5944,
        aliases: ['bjm', 'banjar']
    },
    {
        name: 'samarinda',
        displayName: 'Samarinda',
        latitude: -0.4948,
        longitude: 117.1436,
        aliases: ['smd']
    },
    {
        name: 'balikpapan',
        displayName: 'Balikpapan',
        latitude: -1.2379,
        longitude: 116.8529,
        aliases: ['bpp']
    },
    {
        name: 'palangkaraya',
        displayName: 'Palangka Raya',
        latitude: -2.2161,
        longitude: 113.9135,
        aliases: ['palangkaraya', 'plk']
    },

    // Sulawesi
    {
        name: 'makassar',
        displayName: 'Makassar',
        latitude: -5.1477,
        longitude: 119.4327,
        aliases: ['ujung pandang', 'ujungpandang', 'mks']
    },
    {
        name: 'manado',
        displayName: 'Manado',
        latitude: 1.4748,
        longitude: 124.8421,
        aliases: ['mnd']
    },
    {
        name: 'palu',
        displayName: 'Palu',
        latitude: -0.9003,
        longitude: 119.8779,
        aliases: ['plu']
    },
    {
        name: 'gorontalo',
        displayName: 'Gorontalo',
        latitude: 0.5435,
        longitude: 123.0568,
        aliases: ['gto']
    },
    {
        name: 'kendari',
        displayName: 'Kendari',
        latitude: -3.9985,
        longitude: 122.5127,
        aliases: ['kdi']
    },

    // Others Indonesia
    {
        name: 'denpasar',
        displayName: 'Denpasar',
        latitude: -8.6705,
        longitude: 115.2126,
        aliases: ['bali', 'dps']
    },
    {
        name: 'mataram',
        displayName: 'Mataram',
        latitude: -8.5833,
        longitude: 116.1167,
        aliases: ['mtr', 'lombok']
    },
    {
        name: 'kupang',
        displayName: 'Kupang',
        latitude: -10.1772,
        longitude: 123.6070,
        aliases: ['kpg']
    },
    {
        name: 'ambon',
        displayName: 'Ambon',
        latitude: -3.6954,
        longitude: 128.1814,
        aliases: ['amb']
    },
    {
        name: 'jayapura',
        displayName: 'Jayapura',
        latitude: -2.5916,
        longitude: 140.6690,
        aliases: ['papua', 'djj']
    },
    {
        name: 'ternate',
        displayName: 'Ternate',
        latitude: 0.7833,
        longitude: 127.3667,
        aliases: ['tnt']
    },

    // International Cities with hardcoded timezones
    {
        name: 'tokyo',
        displayName: 'Tokyo',
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo',
        aliases: ['tokyo', 'tokyo city']
    },
    {
        name: 'beijing',
        displayName: 'Beijing',
        latitude: 39.9042,
        longitude: 116.4074,
        timezone: 'Asia/Shanghai',
        aliases: ['beijing', 'peking']
    },
    {
        name: 'hongkong',
        displayName: 'Hong Kong',
        latitude: 22.3193,
        longitude: 114.1694,
        timezone: 'Asia/Hong_Kong',
        aliases: ['hong kong', 'hk']
    },
    {
        name: 'singapore',
        displayName: 'Singapore',
        latitude: 1.3521,
        longitude: 103.8198,
        timezone: 'Asia/Singapore',
        aliases: ['singapore', 'singapura', 'sg']
    },
    {
        name: 'seoul',
        displayName: 'Seoul',
        latitude: 37.5665,
        longitude: 126.9780,
        timezone: 'Asia/Seoul',
        aliases: ['seoul', 'korea']
    },
    {
        name: 'bangkok',
        displayName: 'Bangkok',
        latitude: 13.7563,
        longitude: 100.5018,
        timezone: 'Asia/Bangkok',
        aliases: ['bangkok', 'krung thep']
    },
    {
        name: 'kualalumpur',
        displayName: 'Kuala Lumpur',
        latitude: 3.1390,
        longitude: 101.6869,
        timezone: 'Asia/Kuala_Lumpur',
        aliases: ['kuala lumpur', 'kl']
    }
];

async function importLocations() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('cities');
        
        // Clear existing data
        await collection.deleteMany({});
        
        // Import each city with timezone
        for (const city of cities) {
            // Get timezone for the city
            await delay(1100); // Wait 1.1 seconds between API calls to avoid rate limiting
            const timezone = city.timezone || await getTimezone(city.latitude, city.longitude);
            console.log(`Processing ${city.displayName} (${timezone})`);
            
            // Add the city to the database with timezone
            await collection.insertOne({
                name: city.name,
                displayName: city.displayName,
                latitude: city.latitude,
                longitude: city.longitude,
                timezone: timezone,
                aliases: city.aliases || []
            });
        }
        
        const count = await collection.countDocuments();
        console.log(`Successfully imported ${count} cities`);
        
    } catch (error) {
        console.error('Error importing locations:', error);
    } finally {
        await client.close();
    }
}

// Run the import
importLocations();
