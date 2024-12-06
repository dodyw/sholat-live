const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { updatePrayerTimes } = require('../WhatsAppBot/index.js');

module.exports = async function (context, myTimer) {
    const timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue) {
        context.log('Timer function is running late!');
    }
    
    context.log('Timer trigger function running at:', timeStamp);
    
    // Update prayer times for the next 7 days
    await updatePrayerTimes(context);
    
    context.log('Prayer times updated successfully');
};
