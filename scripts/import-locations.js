require('dotenv').config();
const { MongoClient } = require('mongodb');

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

    // Others
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
    }
];

async function importLocations() {
    try {
        // Load environment variables from parent directory's .env file
        require('dotenv').config({ path: '../.env' });

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Connect to MongoDB
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db('sholat-live');
        const locations = db.collection('locations');

        // Drop existing collection if it exists
        await locations.drop().catch(() => console.log('Collection does not exist, creating new one...'));

        // Create indexes
        await locations.createIndex({ name: 1 }, { unique: true });
        await locations.createIndex({ aliases: 1 });

        // Insert all cities
        const result = await locations.insertMany(cities);
        console.log(`Successfully imported ${result.insertedCount} cities`);

        // Close connection
        await client.close();
    } catch (error) {
        console.error('Error importing locations:', error);
    }
}

// Run the import
importLocations();
