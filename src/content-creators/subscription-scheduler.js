/**
 * Title: subscription-scheduler.js
 * Author: Tango Hunter
 * Date Created: 8/17/26
 * Description:
 * Centralized scheduler for Content Creator
 * platform subscription/authorization maintenance.
 *
 * Responsibilities:
 * • Run subscription maintenance every 30 minutes
 * • Delegate all maintenance work to subscription-service
 * • Prevent overlapping maintenance executions
 * • Log successful maintenance operations
 * • Log scheduler failures
 * • Send critical alerts when the scheduler itself fails
 *
 * This file DOES NOT:
 * • Perform platform-specific subscription logic
 * • Refresh TikTok tokens directly
 * • Manage YouTube WebSub directly
 * • Perform retries
 * • Update Content Creator records directly
 *
 * Retry behavior belongs to subscription-service.js.
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
} = require('./subscription-service');

const {
    logFeature,
    logError
} = require('../core/logging/logger');

const {
    ERROR_TYPES
} = require('../core/logging/error-types');

const {
    criticalLog
} = require('../core/logging/discord-logger');


/*
====================================
SCHEDULER CONFIGURATION
====================================
*/

/*
 * Run subscription maintenance every
 * 30 minutes.
 */
const SUBSCRIPTION_SCHEDULE = '*/30 * * * *';


/*
 * All scheduler timestamps are evaluated
 * in UTC.
 *
 * This keeps the maintenance schedule
 * independent of Railway's server timezone.
 */
const SUBSCRIPTION_TIMEZONE = 'UTC';


/*
====================================
SCHEDULER STATE
====================================
*/

/*
 * Keeps a reference to the active
 * node-cron task.
 *
 * This prevents accidental duplicate
 * scheduler registration if the
 * initialization function is called
 * more than once.
 */
let schedulerTask = null;


/*
 * Additional in-process protection.
 *
 * Even with node-cron's noOverlap option,
 * we retain our own guard because it
 * makes the execution state explicit and
 * protects us if the scheduling
 * implementation changes later.
 */
let maintenanceRunning = false;


/*
====================================
HELPERS
====================================
*/

/**
 * Converts an unknown error into a
 * useful structured object for logging.
 */
function getErrorDetails(
    error
) {

    return {

        message:
            error?.message
            ??
            'Unknown error.',

        name:
            error?.name
            ??
            'Error',

        stack:
            error?.stack
            ??
            null,

        code:
            error?.code
            ??
            null,

        status:
            error?.status
            ??
            null,

        statusCode:
            error?.statusCode
            ??
            null

    };
}


/*
====================================
MAINTENANCE EXECUTION
====================================
*/

/**
 * Executes one subscription maintenance
 * cycle.
 *
 * This function intentionally contains
 * no platform-specific logic.
 *
 * subscription-service determines:
 *
 * • Which platforms need maintenance
 * • Which accounts need maintenance
 * • How each platform performs maintenance
 * • Whether a retry is required
 * • When retries occur
 * • How many retries are allowed
 */
async function runSubscriptionMaintenance() {

    /*
    ====================================
    DUPLICATE EXECUTION PROTECTION
    ====================================
    */

    if (
        maintenanceRunning
    ) {

        return {

            skipped:
                true,

            reason:
                'maintenance_already_running'

        };
    }

    maintenanceRunning = true;

    const startedAt = new Date();

    try {

        /*
        ====================================
        RUN MAINTENANCE
        ====================================
        */
        const result =
            await maintainSubscriptions();

        /*
        ====================================
        SUCCESSFUL MAINTENANCE
        ====================================
        */
        const completedAt =
            new Date();

        const durationMs =
            completedAt.getTime()
            -
            startedAt.getTime();

        /*
         * Only successful operations are
         * logged.
         */
        logFeature({

            category:
                'CONTENT_CREATORS',

            message:
                'Subscription maintenance completed successfully.',

            details: {

                schedule:
                    SUBSCRIPTION_SCHEDULE,

                timezone:
                    SUBSCRIPTION_TIMEZONE,

                startedAt,

                completedAt,

                durationMs,

                platformsChecked:
                    result?.platformsChecked
                    ??
                    0,

                platformsSkipped:
                    result?.platformsSkipped
                    ??
                    0,

                creatorsChecked:
                    result?.creatorsChecked
                    ??
                    0,

                subscriptionsRequested:
                    result?.subscriptionsRequested
                    ??
                    0,

                subscriptionsSkipped:
                    result?.subscriptionsSkipped
                    ??
                    0,

                errors:
                    result?.errors
                    ??
                    0

            }
        });

        return {

            skipped:
                false,

            success:
                true,

            result

        };
    }

    catch (
        error
    ) {

        /*
        ====================================
        SCHEDULER FAILURE
        ====================================
        */
        const errorDetails =
            getErrorDetails(
                error
            );

        /*
        * This is a real scheduler failure,
        * not an individual platform failure.
        *
        * Individual platform failures are
        * handled by subscription-service.
        */
        logError({

            type:
                ERROR_TYPES.UNKNOWN_ERROR,

            source:
                'subscription-scheduler',

            message:
                'Subscription maintenance scheduler failed.',

            details: {

                schedule:
                    SUBSCRIPTION_SCHEDULE,

                timezone:
                    SUBSCRIPTION_TIMEZONE,

                startedAt,

                error:
                    errorDetails

            }
        });

        /*
        ====================================
        CRITICAL ALERT
        ====================================
        */
        await criticalLog({

            title:
                'Subscription Scheduler Failure',

            category:
                'SUBSCRIPTION_SERVICE',

            status:
                'ERROR',

            details: {

                failure:
                    'The scheduled subscription maintenance operation failed.',

                schedule:
                    SUBSCRIPTION_SCHEDULE,

                timezone:
                    SUBSCRIPTION_TIMEZONE,

                startedAt,

                error:
                    errorDetails

            }
        });


        return {

            skipped:
                false,

            success:
                false,

            error:
                errorDetails

        };
    }

    finally {

        maintenanceRunning =
            false;

    }
}


/*
====================================
START SCHEDULER
====================================
*/

/**
 * Starts the subscription scheduler.
 *
 * This function is safe to call more
 * than once.
 *
 * Only one scheduler task will be
 * registered in the process.
 */
function startSubscriptionScheduler() {

    /*
    ====================================
    DUPLICATE START PROTECTION
    ====================================
    */

    if (
        schedulerTask
    ) {
        return schedulerTask;
    }

    /*
    ====================================
    REGISTER CRON TASK
    ====================================
    */
    schedulerTask =
        cron.schedule(

            SUBSCRIPTION_SCHEDULE,

            () => {

                runSubscriptionMaintenance()

                    .catch(
                        error => {

                            /*
                             * runSubscriptionMaintenance()
                             * already handles expected
                             * failures.
                             *
                             * This catch protects the
                             * scheduler from an
                             * unexpected rejected
                             * promise.
                             */

                            const errorDetails =
                                getErrorDetails(
                                    error
                                );

                            logError({

                                type:
                                    ERROR_TYPES.UNKNOWN_ERROR,

                                source:
                                    'subscription-scheduler',

                                message:
                                    'Unhandled subscription scheduler error.',

                                details:
                                    errorDetails

                            });

                            criticalLog({

                                title:
                                    'Subscription Scheduler Failure',

                                category:
                                    'SUBSCRIPTION_SERVICE',

                                status:
                                    'ERROR',

                                details: {

                                    failure:
                                        'An unhandled error escaped the subscription scheduler.',

                                    error:
                                        errorDetails

                                }
                            })

                            .catch(
                                criticalError => {

                                    logError({

                                        type:
                                            ERROR_TYPES.UNKNOWN_ERROR,

                                        source:
                                            'subscription-scheduler',

                                        message:
                                            'Failed to send critical scheduler failure log.',

                                        details:
                                            getErrorDetails(
                                                criticalError
                                            )

                                    });
                                }
                            );
                        }
                    );
            },

            {

                name:
                    'synara-subscription-scheduler',

                timezone:
                    SUBSCRIPTION_TIMEZONE,

                /*
                 * Prevent node-cron from
                 * starting another execution
                 * while the previous execution
                 * is still running.
                 */
                noOverlap:
                    true

            }
        );

    /*
    ====================================
    SCHEDULER REGISTRATION LOG
    ====================================
    */
    logFeature({

        category:
            'CONTENT_CREATORS',

        message:
            'Subscription scheduler registered.',

        details: {

            schedule:
                SUBSCRIPTION_SCHEDULE,

            timezone:
                SUBSCRIPTION_TIMEZONE,

            maintenanceWindowMinutes:
                60,

            retryDelayMinutes:
                15,

            maxRetries:
                3

        }
    });

    return schedulerTask;
}


/*
====================================
STOP SCHEDULER
====================================
*/

/**
 * Stops the subscription scheduler.
 *
 * This is primarily useful for:
 *
 * • Controlled shutdown
 * • Tests
 * • Future lifecycle management
 */
function stopSubscriptionScheduler() {

    if (
        !schedulerTask
    ) {

        return;

    }

    try {

        schedulerTask.stop();

        if (
            typeof schedulerTask.destroy
            ===
            'function'
        ) {

            schedulerTask.destroy();

        }
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.UNKNOWN_ERROR,

            source:
                'subscription-scheduler',

            message:
                'Failed to stop subscription scheduler.',

            details:
                getErrorDetails(
                    error
                )

        });
    }

    finally {

        schedulerTask =
            null;

        maintenanceRunning =
            false;

    }
}


/*
====================================
EXPORTS
====================================
*/
module.exports = {
    startSubscriptionScheduler,
    stopSubscriptionScheduler,
    runSubscriptionMaintenance
};
