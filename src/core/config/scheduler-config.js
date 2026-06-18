/**
 * Title: scheduler-config.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 6/15/26
 * Description: Centralized scheduler configuration.
 */

const schedulerConfig = {

    timezone:
        'UTC',

    schedules: {

        /*
        ============================
        Question of the Day
        8:00 AM Eastern
        ============================
        */
        qotd:
            '0 12 * * *',

        /*
        ============================
        Nightly Reflection
        8:00 PM Eastern
        ============================
        */
        nightlyMessage:
            '0 0 * * *',

        /*
        ============================
        Activity Audit
        12:05 AM Eastern
        ============================
        */
        activityAudit:
            '5 4 * * *',

        /*
        ============================
        Birthday Check
        12:05 AM UTC
        ============================
        */
        birthdays:
            '5 0 * * *'
    }
};

module.exports = {
    schedulerConfig
};
