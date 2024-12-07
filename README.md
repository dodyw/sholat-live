# Sholat Live API

A robust Azure Functions-based API for calculating Islamic prayer times. This API provides accurate prayer times based on geographical coordinates using the Moonsighting Committee calculation method, which is suitable for Indonesia and other Southeast Asian countries.

## Demo

Visit [sholat.live](https://sholat.live) to see the API in action.

## Features

- Get daily prayer times for any location using latitude and longitude
- Get monthly prayer times for calendar view and scheduling
- Supports different timezones (defaults to Asia/Jakarta)
- Uses the Moonsighting Committee calculation method
- Follows Shafi madhab settings
- Built with Node.js and Azure Functions

## API Endpoints

### 1. Daily Prayer Times

```
GET https://sholatlive-api.azurewebsites.net/api/prayer-times
```

Parameters:
- `latitude` (required): Latitude of the location
- `longitude` (required): Longitude of the location
- `date` (optional): Date in YYYY-MM-DD format (defaults to current date)
- `timezone` (optional): IANA timezone name (defaults to Asia/Jakarta)

Example:
```
https://sholatlive-api.azurewebsites.net/api/prayer-times?latitude=-7.2575&longitude=112.7521
```

Response:
```json
{
  "fajr": "04:14",
  "sunrise": "05:29",
  "dhuhr": "11:48",
  "asr": "15:10",
  "maghrib": "18:00",
  "isha": "19:12",
  "date": "2024-12-06",
  "timezone": "Asia/Jakarta",
  "coordinates": {
    "latitude": -7.2575,
    "longitude": 112.7521
  }
}
```

### 2. Monthly Prayer Times

```
GET https://sholatlive-api.azurewebsites.net/api/monthly-prayer-times
```

Parameters:
- `latitude` (required): Latitude of the location
- `longitude` (required): Longitude of the location
- `month` (optional): Month (1-12, defaults to current month)
- `year` (optional): Year (defaults to current year)
- `timezone` (optional): IANA timezone name (defaults to Asia/Jakarta)

Example:
```
https://sholatlive-api.azurewebsites.net/api/monthly-prayer-times?latitude=-7.2575&longitude=112.7521&month=12&year=2024
```

Response:
```json
{
  "month": 12,
  "year": 2024,
  "timezone": "Asia/Jakarta",
  "coordinates": {
    "latitude": -7.2575,
    "longitude": 112.7521
  },
  "prayerTimes": [
    {
      "date": "2024-12-01",
      "fajr": "03:47",
      "sunrise": "05:03",
      "dhuhr": "11:23",
      "asr": "14:44",
      "maghrib": "17:37",
      "isha": "18:48"
    },
    // ... more dates
  ]
}
```

### 3. WhatsApp Bot

A smart WhatsApp chatbot that provides prayer times for any city worldwide. The bot features natural language understanding, timezone awareness, and conversational interactions.

#### Key Features

1. **Global Coverage**:
   - Get prayer times for any city worldwide
   - Automatic timezone detection for accurate local times
   - Support for adding new cities on demand

2. **Natural Language Understanding**:
   - Understands various ways to ask for prayer times
   - Examples:
     ```
     jadwal sholat jakarta
     prayer times london
     waktu sholat di new york
     tokyo prayer schedule
     ```

3. **Smart Conversations**:
   - Responds appropriately to different types of greetings:
     - Islamic greetings (assalamualaikum → wa'alaikumsalam)
     - Time-based greetings (selamat pagi/siang/sore/malam)
     - Casual greetings (halo, hi, hey)
   - Understands thank you messages in various forms
   - Provides helpful guidance when needed

4. **City Management**:
   - Add new cities easily:
     ```
     tambah kota paris
     add city dubai
     ```
   - Automatic coordinate and timezone lookup
   - Remembers added cities for future use

#### Usage Examples

1. Get prayer times:
```
# Basic queries
jadwal sholat jakarta
prayer times london

# Natural language queries
kapan waktu sholat di tokyo?
what are prayer times in dubai

# Time-based queries
jadwal sholat besok di singapore
tomorrow's prayer times in new york
```

2. Add new cities:
```
tambah kota paris
add city moscow
```

3. Interactive features:
```
User: "assalamualaikum"
Bot: "Wa'alaikumsalam 🙏"

User: "selamat pagi"
Bot: "Selamat pagi! 👋 Ada yang bisa saya bantu?"

User: "help"
Bot: [Shows detailed help menu]
```

Response format:
```
📍 Prayer Times in [City]
📅 [Day], [Date]
🌍 [Timezone]

Fajr    : 04:14
Sunrise : 05:29
Dhuhr   : 11:48
Asr     : 15:10
Maghrib : 18:00
Isha    : 19:12
```

#### Technical Details

1. **Calculation Method**:
   - Uses Moonsighting Committee method
   - Configurable calculation parameters per region
   - Timezone-aware calculations

2. **Data Sources**:
   - OpenStreetMap for geocoding
   - TimezoneDB for accurate timezone data
   - MongoDB for city and user data storage

3. **Error Handling**:
   - Graceful handling of unknown cities
   - Helpful suggestions for misspelled cities
   - Clear error messages with recovery instructions

#### Setup WhatsApp Bot

1. Create Meta Business & Developer Accounts:
   ```
   1. Create account at business.facebook.com
   2. Create developer account at developers.facebook.com
   ```

2. Create WhatsApp Business App:
   ```
   1. Go to developers.facebook.com
   2. Create App > Choose Business
   3. Add WhatsApp product to your app
   4. Set up WhatsApp messaging
   ```

3. Get Required Credentials:

   a. WhatsApp Phone Number ID:
   ```
   1. Go to WhatsApp > Getting Started
   2. Find your Phone Number ID under API Setup
   ```

   b. WhatsApp Token:
   ```
   1. Go to System Users in Business Settings
   2. Create System User with WhatsApp Admin role
   3. Generate token with whatsapp_business_messaging permission
   ```

   c. Verify Token:
   ```
   1. Generate a random string (e.g., using openssl):
      openssl rand -hex 16
   2. Save this as your WHATSAPP_VERIFY_TOKEN
   ```

4. Configure Azure Function:
   ```
   1. Go to Azure Portal > Your Function App
   2. Add these Application Settings:
      WHATSAPP_VERIFY_TOKEN=your_verify_token
      WHATSAPP_TOKEN=your_whatsapp_token
      WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

5. Set up Webhook:
   ```
   1. In Meta Developers Portal > WhatsApp > Configuration
   2. Add Callback URL (your Azure Function URL)
   3. Add Verify Token (same as WHATSAPP_VERIFY_TOKEN)
   4. Select webhooks: messages, message_status
   ```

#### Testing Locally

1. Install dependencies:
```bash
npm install
```

2. Run test script:
```bash
NODE_ENV=test node WhatsAppBot/test.js
```

#### Supported Cities

The bot supports any city worldwide.

Type "jadwal" to see the complete list of supported cities.

#### Usage Examples

1. Get prayer times for Surabaya:
```
jadwal
```

2. Get prayer times for specific city:
```
jadwal medan
jadwal banda aceh
jadwal yogyakarta
```

Response format:
```
*Jadwal Sholat [City]*
[Day], [Date]

Subuh: HH:mm
Terbit: HH:mm
Dzuhur: HH:mm
Ashar: HH:mm
Maghrib: HH:mm
Isya: HH:mm
```

## Technical Stack

### Azure Platform Services

1. **Azure Functions**:
   - Runtime: Node.js 18 LTS
   - Plan: Consumption (Serverless)
   - Triggers: HTTP (API endpoints), Timer (scheduled tasks)
   - Auto-scaling based on demand

2. **Azure Cosmos DB (MongoDB API)**:
   - Used for storing city data, user preferences, and message history
   - Collections:
     - `locations`: City coordinates and timezone data
     - `messages`: User interaction history
     - `preferences`: User-specific settings

3. **Azure Application Insights**:
   - Real-time monitoring and analytics
   - Performance tracking and error logging
   - User interaction patterns analysis

4. **Azure Key Vault**:
   - Secure storage for API keys and tokens
   - Managed identities for secure access

### Third-Party Services

1. **Meta WhatsApp Business API**:
   - Version: Cloud API v18.0
   - Features used:
     - Webhook for message reception
     - Message templates
     - Interactive messages
   - Rate limits: 80 messages/sec

2. **TimezoneDB API**:
   - Purpose: Accurate timezone data for any coordinates
   - Endpoint: `api.timezonedb.com`
   - Features used:
     - Get timezone by lat/long
     - DST awareness
     - Local time conversion
   - Rate limit: 1 request/second

3. **Nominatim OpenStreetMap**:
   - Purpose: Geocoding and location data
   - Endpoint: `nominatim.openstreetmap.org`
   - Features used:
     - Forward geocoding (city name to coordinates)
     - Reverse geocoding (coordinates to city name)
     - Location data validation
   - Rate limit: 1 request/second
   - Usage policy compliant with:
     - User-Agent header
     - Rate limiting
     - Attribution requirements

### Core Libraries

1. **Prayer Time Calculation**:
   - `adhan-js`: v1.6.1
     - Moonsighting Committee method
     - High-precision calculations
     - Customizable parameters

2. **Date & Time Handling**:
   - `moment-timezone`: v0.5.43
     - Timezone conversions
     - Date formatting
     - DST handling

3. **HTTP Client**:
   - `axios`: v1.6.2
     - API requests
     - Request interceptors
     - Error handling

4. **Database**:
   - `mongodb`: v6.3.0
     - MongoDB native driver
     - Connection pooling
     - Replica set support

### Development Tools

1. **Local Development**:
   - Azure Functions Core Tools v4
   - VS Code with Azure Functions extension
   - MongoDB Community Edition

2. **Testing**:
   - Jest for unit testing
   - Postman for API testing
   - WhatsApp Business Test Numbers

3. **Monitoring**:
   - Azure Functions logs
   - Application Insights dashboards
   - Custom logging solutions

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  WhatsApp API   │────▶│  Azure Function  │────▶│   Cosmos DB    │
└─────────────────┘     └──────────────────┘     └────────────────┘
                               │  │  │
                               │  │  │
                        ┌──────┘  │  └──────┐
                        ▼         ▼         ▼
              ┌─────────────┐ ┌────────┐ ┌────────┐
              │ OpenStreet  │ │Timezone│ │ Adhan  │
              │    Map      │ │   DB   │ │  Calc  │
              └─────────────┘ └────────┘ └────────┘
```

### Performance Considerations

1. **Caching Strategy**:
   - City coordinates cached in MongoDB
   - Timezone data cached with 30-day TTL
   - Prayer times calculated on-demand

2. **Rate Limiting**:
   - Implemented for all external APIs
   - Exponential backoff for retries
   - Queue system for high-load scenarios

3. **Error Handling**:
   - Graceful degradation
   - Fallback options for each service
   - Comprehensive error logging

4. **Scalability**:
   - Stateless function design
   - Connection pooling
   - Efficient database indexing

## Installation and Development

1. Clone the repository:
```bash
git clone https://github.com/dodyw/sholat-live.git
cd sholat-live/serverless
```

2. Install dependencies:
```bash
npm install
```

3. Install Azure Functions Core Tools:
```bash
npm install -g azure-functions-core-tools@4
```

4. Create Azure resources:
```bash
az group create --name sholatlive-rg --location southeastasia
az storage account create --name sholatlivestore --location southeastasia --resource-group sholatlive-rg --sku Standard_LRS
az functionapp create --resource-group sholatlive-rg --consumption-plan-location southeastasia --runtime node --runtime-version 20 --functions-version 4 --name sholatlive-api --storage-account sholatlivestore
```

5. Run locally:
```bash
func start
```

6. Deploy to Azure:
```bash
zip -r function.zip . -x "*.git*"
az functionapp deployment source config-zip -g sholatlive-rg -n sholatlive-api --src function.zip
```

## Common Coordinates

Here are some common coordinates for Indonesian cities:

- Jakarta: -6.2088, 106.8456
- Surabaya: -7.2575, 112.7521
- Bandung: -6.9175, 107.6191
- Medan: 3.5952, 98.6722
- Semarang: -6.9932, 110.4203
- Yogyakarta: -7.7971, 110.3688
- Makassar: -5.1477, 119.4327
- Palembang: -2.9761, 104.7754
- Tangerang: -6.1784, 106.6319
- Depok: -6.4025, 106.7942

## Technologies Used

- Node.js 20
- Azure Functions v4
- adhan-js (Prayer time calculations)
- moment-timezone (Timezone handling)

## Author and Contact

**Dody Rachmat Wicaksono**  
Email: dody@nicecoder.com

I'm available for consultation and further development of this project. Feel free to reach out for:
- Custom features and integrations
- Technical support and troubleshooting
- Implementation guidance
- Similar project development

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Natural Language Understanding

#### Message Processing Flow

1. **Initial Message Classification**:
   ```javascript
   // Example user messages
   "jadwal sholat di london"
   "what are prayer times in tokyo?"
   "tambah kota paris"
   ```
   The bot first classifies the message into categories:
   - Prayer time request
   - City addition request
   - Greeting/conversation
   - Help request

2. **City Name Extraction**:
   - Uses pattern matching with regular expressions
   - Handles various formats:
     ```javascript
     // All these patterns are recognized
     "jakarta"
     "di jakarta"
     "kota jakarta"
     "prayer times jakarta"
     "jadwal sholat jakarta"
     ```
   - Supports multiple languages (Indonesian/English)
   - Removes common prefixes/suffixes

3. **Conversational Patterns**:
   ```javascript
   // Islamic greetings
   'assalamualaikum' → 'Wa'alaikumsalam 🙏'
   'ass wr wb' → 'Wa'alaikumsalam 🙏'

   // Time-based greetings
   'selamat pagi' → 'Selamat pagi! 👋'
   'good morning' → 'Good morning! 👋'

   // Casual greetings
   'halo' → 'Halo! 👋'
   'hi' → 'Hi! 👋'
   ```

#### City Processing System

1. **City Lookup Process**:
   ```mermaid
   graph TD
   A[User Request] --> B{City in DB?}
   B -->|Yes| C[Return Prayer Times]
   B -->|No| D[Background Processing]
   D --> E[Geocoding Request]
   E --> F[Timezone Lookup]
   F --> G[Save to DB]
   G --> H[Notify User]
   ```

2. **New City Processing**:
   a. **Initial Response**:
      ```
      "⏳ Sedang memproses kota baru: [city_name]
      Mohon tunggu sebentar..."
      ```

   b. **Background Tasks**:
      - Geocoding via OpenStreetMap
      - Timezone lookup via TimezoneDB
      - Data validation and normalization
      - Database storage

   c. **Success Response**:
      ```
      "✅ Kota [city_name] berhasil ditambahkan!
      Timezone: [timezone]
      
      Untuk melihat jadwal sholat, ketik:
      jadwal sholat [city_name]"
      ```

3. **Error Handling**:
   ```javascript
   // City not found
   "❌ Maaf, kota '[city_name]' tidak ditemukan.
   Pastikan ejaan nama kota sudah benar."

   // Rate limit exceeded
   "⏳ Mohon maaf, sistem sedang sibuk.
   Silakan coba lagi dalam beberapa saat."

   // Invalid city name
   "❌ Nama kota tidak valid.
   Contoh format yang benar: 'tambah kota paris'"
   ```

#### Geocoding Process

1. **OpenStreetMap Query**:
   ```javascript
   // Example API request
   GET https://nominatim.openstreetmap.org/search
   q=${cityName}
   format=json
   addressdetails=1
   limit=1
   ```

2. **Response Processing**:
   ```javascript
   {
     "place_id": 12345,
     "lat": "48.8566",
     "lon": "2.3522",
     "display_name": "Paris, Île-de-France, France",
     "address": {
       "city": "Paris",
       "state": "Île-de-France",
       "country": "France"
     }
   }
   ```

3. **Data Validation**:
   - Verify coordinates are valid
   - Check if location is a city
   - Validate country information
   - Handle special cases (e.g., city states)

#### Timezone Resolution

1. **TimezoneDB Lookup**:
   ```javascript
   // Example API request
   GET http://api.timezonedb.com/v2.1/get-time-zone
   key=${TIMEZONE_DB_KEY}
   format=json
   by=position
   lat=${latitude}
   lng=${longitude}
   ```

2. **Response Processing**:
   ```javascript
   {
     "status": "OK",
     "zoneName": "Europe/Paris",
     "gmtOffset": 3600,
     "dst": 1
   }
   ```

3. **Caching Strategy**:
   - Cache timezone data for 30 days
   - Update during DST transitions
   - Handle timezone changes

#### Database Schema

1. **Locations Collection**:
   ```javascript
   {
     "_id": ObjectId(),
     "name": "paris",
     "displayName": "Paris",
     "country": "France",
     "coordinates": {
       "latitude": 48.8566,
       "longitude": 2.3522
     },
     "timezone": "Europe/Paris",
     "lastUpdated": ISODate("2024-12-07..."),
     "aliases": ["paris france", "kota paris"],
     "metadata": {
       "population": 2161000,
       "type": "city",
       "osmId": "12345"
     }
   }
   ```

2. **Messages Collection**:
   ```javascript
   {
     "_id": ObjectId(),
     "userId": "6282231068140",
     "messageId": "wamid.HBgN...",
     "text": "jadwal sholat paris",
     "timestamp": ISODate("2024-12-07..."),
     "type": "prayer_request",
     "cityRequested": "paris",
     "processed": true
   }
   ```

This system ensures:
- Robust city name extraction
- Reliable geocoding and timezone lookup
- Efficient data storage and retrieval
- Graceful error handling
- User-friendly responses
