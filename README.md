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

A WhatsApp chatbot that provides prayer times for 50 major Indonesian cities. Users can get prayer times by sending messages like "jadwal" (for Surabaya) or "jadwal [city]" (e.g., "jadwal medan" or "jadwal banda aceh").

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

The bot supports 50 major Indonesian cities including:
- Java: Jakarta, Surabaya, Bandung, Semarang, Yogyakarta, etc.
- Sumatra: Medan, Palembang, Banda Aceh, Padang, etc.
- Kalimantan: Pontianak, Banjarmasin, Samarinda, etc.
- Sulawesi: Makassar, Manado, Palu, etc.
- Others: Denpasar, Ambon, Jayapura, etc.

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

## WhatsApp Bot with OpenAI Integration

The WhatsApp bot provides an interactive interface for users to check prayer times and get Islamic information.

### Features

- Natural language understanding powered by Azure OpenAI GPT-3.5
- Smart prayer time lookups with city detection
- Pre-calculated prayer times stored in Azure Table Storage
- Next prayer time countdown and reminders

### Environment Variables

Required environment variables for the WhatsApp bot:

```bash
# WhatsApp Cloud API
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name

# Azure Storage
AzureWebJobsStorage=your_storage_connection_string
```

### Setup

1. Create Azure OpenAI resource with GPT-3.5 Turbo model
2. Set up Azure Storage account
3. Configure WhatsApp Business API
4. Copy `.env.template` to `.env` and add credentials
5. Run `npm install`
6. Start with `func start`

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
