const adhan = require('adhan');
const moment = require('moment-timezone');

module.exports = async function (context, req) {
    try {
        // Get query parameters
        const { city, latitude, longitude, date, timezone = 'Asia/Jakarta' } = req.query;

        if (!latitude || !longitude) {
            context.res = {
                status: 400,
                body: {
                    error: "Latitude and longitude are required parameters"
                }
            };
            return;
        }

        // Parse date or use current date
        const prayerDate = date ? new Date(date) : new Date();
        
        // Create coordinates
        const coordinates = new adhan.Coordinates(parseFloat(latitude), parseFloat(longitude));
        
        // Get prayer times
        const params = adhan.CalculationMethod.MoonsightingCommittee();
        params.madhab = adhan.Madhab.Shafi;
        const prayerTimes = new adhan.PrayerTimes(coordinates, prayerDate, params);

        // Format the prayer times
        const formattedPrayerTimes = {
            fajr: moment(prayerTimes.fajr).tz(timezone).format('HH:mm'),
            sunrise: moment(prayerTimes.sunrise).tz(timezone).format('HH:mm'),
            dhuhr: moment(prayerTimes.dhuhr).tz(timezone).format('HH:mm'),
            asr: moment(prayerTimes.asr).tz(timezone).format('HH:mm'),
            maghrib: moment(prayerTimes.maghrib).tz(timezone).format('HH:mm'),
            isha: moment(prayerTimes.isha).tz(timezone).format('HH:mm'),
            date: moment(prayerDate).tz(timezone).format('YYYY-MM-DD'),
            timezone,
            coordinates: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            }
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: formattedPrayerTimes
        };
    } catch (error) {
        context.log.error('Error in prayer times calculation:', error);
        context.res = {
            status: 500,
            body: {
                error: "Error calculating prayer times: " + error.message
            }
        };
    }
};
