/**
 * Title: activity-scheduler.js
 * Author: Tango Hunter
 * Date Created: 6/1/26
 * Date Modified: 6/1/26
 * Description: Runs the activity audit service.
 */

const cron = require('node-cron');

const {
    runActivityAudit
} = require('../../core/services/activity-audit');

const {
    schedulerConfig
} = require('../../core/config/scheduler-config');

function startActivityScheduler() {

    cron.schedule(

        schedulerConfig
            .schedules
            .activityAudit,

        async () => {

            try {

                console.log(
                    '[ACTIVITY AUDIT] Starting'
                );

                await runActivityAudit();

                console.log(
                    '[ACTIVITY AUDIT] Complete'
                );

            } catch (
                error
            ) {

                console.error(
                    '[ACTIVITY AUDIT ERROR]',
                    error
                );
            }

        },

        {

            timezone:
                schedulerConfig
                    .timezone
        }
    );

    console.log(
        `[ACTIVITY AUDIT] Scheduled: ${schedulerConfig.schedules.activityAudit} (${schedulerConfig.timezone})`
    );
}

module.exports = {
    startActivityScheduler
};
