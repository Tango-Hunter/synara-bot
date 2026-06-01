/**
 * Title: scheduler-config.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 5/20/26
 * Description: Centralized scheduler configuration.
 */

const schedulerConfig = {

    timezone:
        'America/New_York',

    schedules: {

        qotd:
            '0 8 * * *',

        nightlyMessage:
            '0 20 * * *',

        activityAudit:
            '5 0 * * *'
    }
};

module.exports = {
    schedulerConfig
};
