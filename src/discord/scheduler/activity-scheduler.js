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

const {
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


function startActivityScheduler() {

    cron.schedule(

        schedulerConfig
            .schedules
            .activityAudit,

        async () => {

            logFeature({

                category:
                    'ACTIVITY',

                message:
                    'Activity scheduler registered',

                details: {

                    schedule:
                        schedulerConfig.schedules.activityAudit,

                    timezone:
                        schedulerConfig.timezone
                }
            });

            try {

                logFeature({

                    category:
                        'ACTIVITY',

                    message:
                        'Activity audit started',

                    details: {

                        schedule:
                            schedulerConfig.schedules.activityAudit
                    }
                });

                await runActivityAudit();

                logFeature({

                    category:
                        'ACTIVITY',

                    message:
                        'Activity audit completed',

                    details: {

                        schedule:
                            schedulerConfig.schedules.activityAudit
                    }
                });

            } catch (
                error
            ) {
                logError({

                    type:
                        ERROR_TYPES.SCHEDULER_ERROR,

                    source:
                        'activity-scheduler',

                    message:
                        error.message,

                    details: {

                        schedule:
                            schedulerConfig.schedules.activityAudit
                    }
                });
            }
        },
        {
            timezone:
                schedulerConfig
                    .timezone
        }
    );
}

module.exports = {
    startActivityScheduler
};
