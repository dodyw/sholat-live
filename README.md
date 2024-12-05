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
