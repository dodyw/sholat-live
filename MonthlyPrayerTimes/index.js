const adhan = require('adhan');
const moment = require('moment-timezone');

module.exports = async function (context, req) {
    try {
        // Get query parameters
        const latitude = parseFloat(req.query.latitude);
        const longitude = parseFloat(req.query.longitude);
        const timezone = req.query.timezone || 'Asia/Jakarta';
        const month = parseInt(req.query.month) || moment().month() + 1; // 1-12
        const year = parseInt(req.query.year) || moment().year();

        // Validate parameters
        if (isNaN(latitude) || isNaN(longitude)) {
            context.res = {
                status: 400,
                body: {
                    error: "Invalid latitude or longitude parameters"
                }
            };
            return;
        }

        if (month < 1 || month > 12) {
            context.res = {
                status: 400,
                body: {
                    error: "Month must be between 1 and 12"
                }
            };
            return;
        }

        // Create coordinates and calculation parameters
        const coordinates = new adhan.Coordinates(latitude, longitude);
        const params = new adhan.CalculationMethod.MoonsightingCommittee();
        params.madhab = adhan.Madhab.Shafi;

        // Get number of days in the month
        const daysInMonth = moment(`${year}-${month}`, 'YYYY-M').daysInMonth();
        
        // Calculate prayer times for each day
        const monthlyPrayerTimes = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = moment.tz(`${year}-${month}-${day}`, timezone);
            const prayerTimes = new adhan.PrayerTimes(coordinates, date.toDate(), params);

            monthlyPrayerTimes.push({
                date: date.format('YYYY-MM-DD'),
                fajr: moment(prayerTimes.fajr).tz(timezone).format('HH:mm'),
                sunrise: moment(prayerTimes.sunrise).tz(timezone).format('HH:mm'),
                dhuhr: moment(prayerTimes.dhuhr).tz(timezone).format('HH:mm'),
                asr: moment(prayerTimes.asr).tz(timezone).format('HH:mm'),
                maghrib: moment(prayerTimes.maghrib).tz(timezone).format('HH:mm'),
                isha: moment(prayerTimes.isha).tz(timezone).format('HH:mm')
            });
        }

        context.res = {
            body: {
                month,
                year,
                timezone,
                coordinates: {
                    latitude,
                    longitude
                },
                prayerTimes: monthlyPrayerTimes
            }
        };
    } catch (error) {
        context.log.error('Error calculating prayer times:', error);
        context.res = {
            status: 500,
            body: {
                error: "Internal server error while calculating prayer times",
                details: error.message
            }
        };
    }
};
