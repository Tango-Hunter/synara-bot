/**
 * Title: subscription-scheduler.js
 * Author: Tango Hunter
 * Date Created: 8/17/26
 * Description: Scheduled maintenance for Content Creator platform subscriptions.
 *
 * Responsibilities:
 * • Schedule subscription maintenance using UTC cron
 * • Execute maintenance at scheduled times
 * • Enforce a maximum maintenance duration
 * • Report scheduler-level failures
 *
 * This file DOES NOT:
 * • Know which platforms support subscriptions
 * • Perform platform-specific subscription logic
 * • Access the Content Creator repository
 * • Build Discord announcements
 * • Send Discord messages
 */


/*
====================================
DEPENDENCIES
====================================
*/

const cron =
    require('node-cron');

const {
    maintainSubscriptions
} = require(
    './subscription-service'
);

const {
    logFeature,
    logError
} = require(
    '../core/logging/logger'
);

const {
    ERROR_TYPES
} = require(
    '../core/logging/error-types'
);

const {
    criticalLog
} = require(
    '../core/logging/discord-logger'
);


/*
====================================
SCHEDULER CONFIGURATION
====================================
*/

/*
 * Subscription maintenance runs at:
 *
 * 01:00 UTC
 * 07:00 UTC
 * 13:00 UTC
 * 19:00 UTC
 *
 * Cron:
 *
 * 0 1,7,13,19 * * *
 */
const SCHEDULER_CRON = '0 1,7,13,19 * * *';


/*
 * All scheduled maintenance operations
 * have a maximum runtime of 30 minutes.
 */
const MAX_MAINTENANCE_TIME_MS = 30 * 60 * 1000;


/*
====================================
RUNTIME STATE
====================================
*/

/*
 * Holds the active cron task.
 *
 * null means the scheduler has not
 * been started.
 */
let schedulerTask = null;


/*
====================================
RUN SUBSCRIPTION MAINTENANCE
====================================
*/

/**
 * Executes one complete subscription
 * maintenance cycle.
 *
 * The operation is allowed to run for
 * a maximum of 30 minutes.
 *
 * If the operation exceeds that limit,
 * the scheduler abandons the run and
 * sends a critical alert.
 */
async function runSubscriptionMaintenance() {

    const startedAt =

        new Date();

    logFeature({

        category:

            'CONTENT_CREATORS',

        message:

            'Subscription maintenance started.',

        details: {

            startedAt,

            scheduledInterval:

                '01:00, 07:00, 13:00, 19:00 UTC',

            timeoutMinutes:
                30

        }
    });


    /*
    ====================================
    CREATE MAINTENANCE OPERATION
    ====================================
    */

    const maintenanceOperation = maintainSubscriptions();


    /*
    ====================================
    CREATE TIMEOUT
    ====================================
    */

    const timeoutOperation =

        new Promise(

            (_, reject) => {

                setTimeout(

                    () => {

                        reject(

                            new Error(

                                'Subscription maintenance exceeded the 30-minute execution limit.'

                            )
                        );
                    },

                    MAX_MAINTENANCE_TIME_MS

                );
            }
        );


    try {

        const result =

            await Promise.race([

                maintenanceOperation,

                timeoutOperation

            ]);


        const completedAt =

            new Date();

        const durationMs =

            completedAt.getTime()

            -

            startedAt.getTime();


        /*
        ====================================
        LOG SUCCESSFUL COMPLETION
        ====================================
        */

        logFeature({

            category:

                'CONTENT_CREATORS',

            message:

                'Subscription maintenance completed.',

            details: {

                startedAt,

                completedAt,

                durationMs,

                maintenanceThreshold:

                    result.maintenanceThreshold,

                platformsChecked:

                    result.platformsChecked,

                platformsSkipped:

                    result.platformsSkipped,

                creatorsChecked:

                    result.creatorsChecked,

                subscriptionsRequested:

                    result.subscriptionsRequested,

                subscriptionsSkipped:

                    result.subscriptionsSkipped,

                errors:

                    result.errors

            }
        });


        return result;

    }

    catch (
        error
    ) {

        const failedAt =

            new Date();

        const durationMs =

            failedAt.getTime()

            -

            startedAt.getTime();


        /*
        ====================================
        CRITICAL TIMEOUT
        ====================================
        */

        const timedOut =

            durationMs >=

            MAX_MAINTENANCE_TIME_MS;


        if (
            timedOut
        ) {

            await criticalLog({

                title:

                    'Content Creator Subscription Maintenance Timeout',

                category:

                    'SUBSCRIPTION_SCHEDULER',

                status:

                    'ERROR',

                details: {

                    failure:

                        'Subscription maintenance exceeded the 30-minute execution limit and was abandoned.',

                    startedAt,

                    failedAt,

                    durationMs,

                    timeoutMinutes:
                        30,

                    schedule:

                        '01:00, 07:00, 13:00, 19:00 UTC',

                    error:

                        error.message

                }
            });

            logError({

                type:

                    ERROR_TYPES.UNKNOWN_ERROR,

                source:

                    'subscription-scheduler',

                message:

                    'Subscription maintenance exceeded the 30-minute execution limit.',

                details: {

                    startedAt,

                    failedAt,

                    durationMs,

                    error:

                        error.message

                }
            });


            return {

                timedOut:
                    true,

                error:

                    error.message

            };
        }


        /*
        ====================================
        OTHER SCHEDULER FAILURE
        ====================================
        */

        await criticalLog({

            title:

                'Content Creator Subscription Maintenance Failed',

            category:

                'SUBSCRIPTION_SCHEDULER',

            status:

                'ERROR',

            details: {

                failure:

                    'Subscription maintenance failed unexpectedly.',

                startedAt,

                failedAt,

                durationMs,

                error:

                    error.message

            }
        });

        logError({

            type:

                ERROR_TYPES.UNKNOWN_ERROR,

            source:

                'subscription-scheduler',

            message:

                'Subscription maintenance failed.',

            details: {

                startedAt,

                failedAt,

                durationMs,

                error:

                    error.message

            }
        });


        return {

            timedOut:
                false,

            error:

                error.message

        };
    }
}


/*
====================================
START SCHEDULER
====================================
*/

/**
 * Starts the Content Creator
 * subscription maintenance scheduler.
 *
 * The scheduler runs exclusively from
 * the UTC cron schedule:
 *
 * 01:00 UTC
 * 07:00 UTC
 * 13:00 UTC
 * 19:00 UTC
 */
function startSubscriptionScheduler() {

    /*
    ====================================
    PREVENT DUPLICATE SCHEDULERS
    ====================================
    */

    if (

        schedulerTask

    ) {

        logFeature({

            category:

                'CONTENT_CREATORS',

            message:

                'Subscription scheduler is already running.',

            details: {

                schedule:

                    SCHEDULER_CRON,

                timezone:
                    'UTC'

            }
        });

        return;

    }


    /*
    ====================================
    CREATE CRON TASK
    ====================================
    */

    schedulerTask =

        cron.schedule(

            SCHEDULER_CRON,

            () => {

                runSubscriptionMaintenance();

            },

            {

                timezone:
                    'UTC'

            }
        );


    logFeature({

        category:

            'CONTENT_CREATORS',

        message:

            'Subscription scheduler started.',

        details: {

            schedule:

                SCHEDULER_CRON,

            executionTimes:

                [

                    '01:00 UTC',

                    '07:00 UTC',

                    '13:00 UTC',

                    '19:00 UTC'

                ],

            timeoutMinutes:
                30

        }
    });
}


/*
====================================
STOP SCHEDULER
====================================
*/

/**
 * Stops the subscription scheduler.
 *
 * Useful for graceful application
 * shutdown and testing.
 */
function stopSubscriptionScheduler() {

    if (
        !schedulerTask
    ) {
        return;
    }


    schedulerTask.stop();


    schedulerTask =

        null;


    logFeature({

        category:

            'CONTENT_CREATORS',

        message:

            'Subscription scheduler stopped.',

        details: {}

    });
}


/*
====================================
EXPORTS
====================================
*/

module.exports = {
    runSubscriptionMaintenance,
    startSubscriptionScheduler,
    stopSubscriptionScheduler
};
