/**
 * Title: subscription-service.js
 * Author: Tango Hunter
 * Date Created: 8/17/26
 * Description: Centralized subscription management for Content Creator platforms.
 *
 * Responsibilities:
 * • Determine whether a platform supports subscriptions
 * • Initialize platform subscriptions
 * • Coordinate platform-specific subscription services
 * • Maintain a consistent return contract across platforms
 * • Maintain platform subscriptions/access authorizations
 * • Handle generic retry and recovery behavior
 * • Update Content Creator expiration records
 *
 * This file DOES NOT:
 * • Build Discord announcements
 * • Send Discord messages
 * • Parse platform notifications
 * • Perform platform-specific subscription logic
 * • Handle Express routes
 *
 * IMPORTANT:
 *
 * Retry behavior belongs here rather than inside an individual
 * platform module.
 *
 * Every platform receives the same:
 *
 *     Initial Attempt
 *          ↓
 *     15 minute recovery window
 *          ↓
 *     Retry #1
 *          ↓
 *     15 minute recovery window
 *          ↓
 *     Retry #2
 *          ↓
 *     15 minute recovery window
 *          ↓
 *     Retry #3
 *
 * Platform-specific modules perform ONE operation.
 * This service determines when that operation is retried.
 */


/*
====================================
DATABASE
====================================
*/

const {
    getCreatorByPlatformAccount,
    getCreatorsNeedingSubscriptionRenewal,
    updateSubscriptionExpiration
} = require('../core/database/content-creators-repository');


/*
====================================
LOGGING
====================================
*/

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
PLATFORM SUBSCRIPTION SERVICES
====================================
*/

const YouTubeWebSub =
    require('./youtube-websub');

const TikTokSubscription =
    require('./tiktok-subscription');


/*
====================================
SUBSCRIPTION PLATFORM REGISTRY
====================================
*/

/*
 * Each platform must define:
 *
 * supported:
 *     Whether the platform has a
 *     subscription/authorization mechanism
 *     that SYNARA can maintain.
 *
 * service:
 *     The platform-specific module.
 *
 * Platforms without subscription support
 * use:
 *
 *     supported: false
 *     service: null
 *
 * IMPORTANT:
 *
 * TikTok's "subscription" is technically
 * OAuth access-token authorization rather
 * than a WebSub subscription.
 *
 * SYNARA uses the generic
 * subscriptionExpiresAt field for this
 * platform to represent:
 *
 *     access_token_expires_at
 *
 * This keeps the Content Creator system
 * platform agnostic.
 */

const SUBSCRIPTION_PLATFORMS = {

    youtube: {

        supported:
            true,

        service:
            YouTubeWebSub

    },

    tiktok: {

        supported:
            true,

        service:
            TikTokSubscription

    }
};


/*
====================================
RETRY CONFIGURATION
====================================
*/
const RETRY_DELAY_MS = 15 * 60 * 1000;


/*
 * Initial attempt + 3 retries.
 */
const MAX_RETRIES = 3;


/*
 * The normal maintenance window is
 * one hour.
 *
 * The scheduler will call this service
 * every 30 minutes.
 *
 * This means an authorization entering
 * the one-hour window will normally be
 * discovered with at least one scheduler
 * pass before expiration.
 */
const DEFAULT_MAINTENANCE_WINDOW_MS = 60 * 60 * 1000;


/*
====================================
RETRY STATE
====================================
*/

/*
 * Retry state intentionally lives in
 * this service because retry behavior
 * is platform agnostic.
 *
 * Key:
 *
 *     platform:accountIdentifier
 *
 * Example:
 *
 *     tiktok:123456789
 *
 * Each entry contains:
 *
 *     platform
 *     accountIdentifier
 *     failedAt
 *     nextRetryAt
 *     retryCount
 *     timer
 *
 * retryCount represents completed retries.
 *
 *     0 = initial attempt failed
 *     1 = retry #1 failed
 *     2 = retry #2 failed
 *     3 = retry #3 failed
 */
const retryState = new Map();


/*
====================================
HELPERS
====================================
*/

/**
 * Builds the unique retry key for a
 * platform/account combination.
 *
 * The same platform account may exist
 * across multiple Discord guilds.
 *
 * We must therefore retry once per
 * platform account rather than once per
 * Content Creator row.
 */
function getRetryKey({

    platform,

    accountIdentifier

}) {
    return (
        `${platform}:${accountIdentifier}`
    );
}


/**
 * Builds a detailed representation of
 * an error without exposing secrets.
 *
 * TikTok errors may contain:
 *
 *     tiktokError
 *     tiktokErrorDescription
 *     tiktokLogId
 *
 * Those are extremely useful for
 * troubleshooting and critical logs.
 *
 * Access tokens and refresh tokens are
 * intentionally never included.
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

        tiktokError:
            error?.tiktokError
            ??
            null,

        tiktokErrorDescription:
            error?.tiktokErrorDescription
            ??
            null,

        tiktokLogId:
            error?.tiktokLogId
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


/**
 * Updates the subscription expiration
 * for every Content Creator using the
 * same platform account.
 *
 * This is only performed when the
 * platform returns a usable
 * subscriptionExpiresAt value.
 *
 * This preserves YouTube compatibility
 * because YouTube's WebSub expiration is
 * supplied through its verification
 * challenge rather than directly by
 * subscribe().
 */
async function updateCreatorExpirations({

    platform,

    accountIdentifier,

    subscriptionExpiresAt

}) {

    if (
        !subscriptionExpiresAt
    ) {

        return {

            updated:
                false,

            creatorsUpdated:
                0

        };
    }

    const creators =
        await getCreatorByPlatformAccount({

            platform,

            accountIdentifier

        });

    if (
        creators.length === 0
    ) {

        return {

            updated:
                false,

            creatorsUpdated:
                0

        };
    }

    let creatorsUpdated = 0;

    for (
        const creator of creators
    ) {

        await updateSubscriptionExpiration({

            guildId:
                creator.guild_id,

            platform,

            accountIdentifier,

            subscriptionExpiresAt

        });

        creatorsUpdated++;
    }

    return {

        updated:
            true,

        creatorsUpdated

    };
}


/**
 * Removes retry state for an account.
 */
function clearRetryState({

    platform,

    accountIdentifier

}) {

    const retryKey =
        getRetryKey({

            platform,

            accountIdentifier

        });

    const state =
        retryState.get(
            retryKey
        );

    if (
        state?.timer
    ) {
        clearTimeout(
            state.timer
        );
    }

    retryState.delete(
        retryKey
    );
}


/*
====================================
PLATFORM LOOKUP
====================================
*/
function getSubscriptionPlatform(
    platform
) {

    return (

        SUBSCRIPTION_PLATFORMS[
            platform
        ]

        ??

        null

    );
}


/*
====================================
SUBSCRIPTION SUPPORT
====================================
*/
function supportsSubscription(
    platform
) {

    const configuration =
        getSubscriptionPlatform(
            platform
        );


    return (

        configuration?.supported

        ===

        true

    );
}


/*
====================================
INITIALIZE SUBSCRIPTION
====================================
*/

/**
 * Initializes subscription handling
 * for a Content Creator.
 *
 * Platforms with subscription support:
 *
 *     subscription-service
 *             ↓
 *     platform.initialize()
 *
 * Platforms without subscription support:
 *
 *     subscription-service
 *             ↓
 *     return unsupported result
 *
 * The platform-specific module remains
 * responsible for its own protocol.
 */
async function initializeSubscription({

    platform,

    accountIdentifier

}) {

    const configuration =
        getSubscriptionPlatform(
            platform
        );

    /*
    ====================================
    UNKNOWN PLATFORM
    ====================================
    */
    if (
        !configuration
    ) {
        throw new Error(
            `Unsupported content creator platform: ${platform}`
        );
    }

    /*
    ====================================
    NO SUBSCRIPTION SUPPORT
    ====================================
    */
    if (
        !configuration.supported
        ||
        !configuration.service
    ) {

        return {

            platform,

            accountIdentifier,

            subscriptionSupported:
                false,

            subscriptionRequested:
                false,

            subscriptionExpiresAt:
                null

        };
    }

    /*
    ====================================
    PLATFORM SUBSCRIPTION
    ====================================
    */
    const result =
        await configuration.service.initialize({

            accountIdentifier

        });

    /*
    ====================================
    COMMON RETURN CONTRACT
    ====================================
    */
    return {

        platform,

        accountIdentifier,

        subscriptionSupported:
            true,

        subscriptionRequested:
            true,

        subscriptionExpiresAt:
            result.subscriptionExpiresAt
            ??
            null,

        platformData:
            result

    };
}


/*
====================================
SUBSCRIPTION VERIFICATION
====================================
*/

/**
 * Records a successfully verified
 * platform subscription.
 *
 * The platform-specific module is
 * responsible for communicating with
 * the platform and determining the
 * actual expiration.
 *
 * This service:
 *
 * • Finds all Content Creator records
 *   using the platform/account.
 *
 * • Updates expiration for every
 *   matching guild.
 *
 * This remains compatible with
 * YouTube WebSub verification.
 */
async function handleSubscriptionVerification({

    platform,

    accountIdentifier,

    subscriptionExpiresAt

}) {

    if (
        !platform
        ||
        !accountIdentifier
        ||
        !subscriptionExpiresAt
    ) {

        throw new Error(
            'Platform, accountIdentifier, and subscriptionExpiresAt are required.'
        );
    }

    const creators =
        await getCreatorByPlatformAccount({

            platform,

            accountIdentifier

        });

    /*
    ====================================
    NO REGISTERED CREATORS
    ====================================
    */
    if (
        creators.length === 0
    ) {

        return {

            platform,

            accountIdentifier,

            subscriptionUpdated:
                false,

            creatorsUpdated:
                0

        };
    }

    /*
    ====================================
    UPDATE ALL MATCHING CREATORS
    ====================================
    */
    let creatorsUpdated = 0;

    for (
        const creator of creators
    ) {

        await updateSubscriptionExpiration({

            guildId:
                creator.guild_id,

            platform,

            accountIdentifier,

            subscriptionExpiresAt

        });

        creatorsUpdated++;
    }

    /*
    ====================================
    RETURN RESULT
    ====================================
    */
    return {

        platform,

        accountIdentifier,

        subscriptionUpdated:
            true,

        creatorsUpdated,

        subscriptionExpiresAt

    };
}


/*
====================================
RETRY OPERATION
====================================
*/

/**
 * Performs one retry attempt for a
 * previously failed platform operation.
 *
 * This function is intentionally generic.
 *
 * It does not know whether the platform
 * is TikTok, YouTube, or another future
 * platform.
 */
async function performRetry({

    platform,

    accountIdentifier

}) {

    const retryKey =
        getRetryKey({

            platform,

            accountIdentifier

        });


    const state =
        retryState.get(
            retryKey
        );

    if (
        !state
    ) {
        return;
    }

    const configuration =
        getSubscriptionPlatform(
            platform
        );

    if (
        !configuration
        ||
        !configuration.supported
        ||
        !configuration.service
    ) {

        clearRetryState({

            platform,

            accountIdentifier

        });

        return;
    }

    /*
     * retryCount represents the number
     * of retries already attempted.
     *
     * Therefore:
     *
     * retryCount = 0
     *     → this is retry #1
     *
     * retryCount = 1
     *     → this is retry #2
     *
     * retryCount = 2
     *     → this is retry #3
     */
    const retryNumber = state.retryCount + 1;

    /*
    ====================================
    CRITICAL RETRY WINDOW ALERT
    ====================================
    */
    await criticalLog({

        title:
            'Content Creator Subscription Retry',

        category:
            'SUBSCRIPTION_SERVICE',

        status:
            'ERROR',

        details: {

            failure:
                'The initial platform subscription/authorization attempt did not recover within the 15-minute recovery window.',

            platform,

            accountIdentifier,

            retryNumber,

            maxRetries:
                MAX_RETRIES,

            failedAt:
                state.failedAt,

            retryStartedAt:
                new Date(),

            nextRetry:
                retryNumber < MAX_RETRIES

        }
    });

    /*
    ====================================
    EXECUTE RETRY
    ====================================
    */
    try {

        const result =
            await configuration.service.subscribe({

                accountIdentifier

            });

        /*
        ====================================
        UPDATE EXPIRATION
        ====================================
        */
        const expirationResult =
            await updateCreatorExpirations({

                platform,

                accountIdentifier,

                subscriptionExpiresAt:
                    result.subscriptionExpiresAt

            });

        /*
        ====================================
        RECOVERY
        ====================================
        */
        await criticalLog({

            title:
                'Content Creator Subscription Recovered',

            category:
                'SUBSCRIPTION_SERVICE',

            status:
                'SUCCESS',

            details: {

                failure:
                    'A previously failed platform subscription/authorization operation recovered successfully.',

                platform,

                accountIdentifier,

                successfulAttempt:
                    retryNumber + 1,

                retryNumber,

                maxRetries:
                    MAX_RETRIES,

                subscriptionExpiresAt:
                    result.subscriptionExpiresAt
                    ??
                    null,

                creatorsUpdated:
                    expirationResult.creatorsUpdated

            }
        });

        logFeature({

            category:
                'CONTENT_CREATORS',

            message:
                'Platform subscription recovered after retry.',

            details: {

                platform,

                accountIdentifier,

                retryNumber,

                successfulAttempt:
                    retryNumber + 1,

                subscriptionExpiresAt:
                    result.subscriptionExpiresAt
                    ??
                    null,

                creatorsUpdated:
                    expirationResult.creatorsUpdated

            }
        });

        clearRetryState({

            platform,

            accountIdentifier

        });

        return {

            success:
                true,

            recovered:
                true,

            retryNumber,

            result

        };
    }

    catch (
        error
    ) {

        /*
        ====================================
        RECORD FAILED RETRY
        ====================================
        */

        state.retryCount = retryNumber;

        state.lastError =
            getErrorDetails(
                error
            );

        /*
        ====================================
        ALL RETRIES EXHAUSTED
        ====================================
        */

        if (
            retryNumber >=
            MAX_RETRIES
        ) {

            await criticalLog({

                title:
                    'Content Creator Subscription Recovery Failed',

                category:
                    'SUBSCRIPTION_SERVICE',

                status:
                    'ERROR',

                details: {

                    failure:
                        'Initial subscription/authorization attempt and all three recovery retries failed.',

                    platform,

                    accountIdentifier,

                    initialFailureAt:
                        state.failedAt,

                    finalAttemptAt:
                        new Date(),

                    retryCount:
                        retryNumber,

                    maxRetries:
                        MAX_RETRIES,

                    error:
                        getErrorDetails(
                            error
                        )
                }
            });

            logError({

                type:
                    ERROR_TYPES.UNKNOWN_ERROR,

                source:
                    'subscription-service',

                message:
                    'All platform subscription recovery attempts failed.',

                details: {

                    platform,

                    accountIdentifier,

                    initialFailureAt:
                        state.failedAt,

                    retryCount:
                        retryNumber,

                    maxRetries:
                        MAX_RETRIES,

                    error:
                        getErrorDetails(
                            error
                        )
                }
            });

            clearRetryState({

                platform,

                accountIdentifier

            });

            return {

                success:
                    false,

                recovered:
                    false,

                exhausted:
                    true,

                retryNumber,

                error:
                    error.message

            };
        }

        /*
        ====================================
        SCHEDULE NEXT RETRY
        ====================================
        */
        state.nextRetryAt =
            new Date(
                Date.now()
                +
                RETRY_DELAY_MS
            );

        state.timer =
            setTimeout(

                () => {

                    performRetry({

                        platform,

                        accountIdentifier

                    })

                    .catch(
                        retryError => {

                            logError({

                                type:
                                    ERROR_TYPES.UNKNOWN_ERROR,

                                source:
                                    'subscription-service',

                                message:
                                    'Unhandled subscription retry error.',

                                details: {

                                    platform,

                                    accountIdentifier,

                                    retryNumber,

                                    error:
                                        getErrorDetails(
                                            retryError
                                        )
                                }
                            });
                        }
                    );
                },

                RETRY_DELAY_MS

            );

        logError({

            type:
                ERROR_TYPES.UNKNOWN_ERROR,

            source:
                'subscription-service',

            message:
                'Platform subscription retry failed; another retry has been scheduled.',

            details: {

                platform,

                accountIdentifier,

                retryNumber,

                maxRetries:
                    MAX_RETRIES,

                nextRetryAt:
                    state.nextRetryAt,

                error:
                    getErrorDetails(
                        error
                    )
            }
        });

        return {

            success:
                false,

            recovered:
                false,

            exhausted:
                false,

            retryNumber,

            retryScheduled:
                true,

            nextRetryAt:
                state.nextRetryAt,

            error:
                error.message

        };
    }
}


/*
====================================
SCHEDULE RETRY
====================================
*/

/**
 * Creates retry state after the
 * initial subscription attempt fails.
 */
function scheduleInitialRetry({

    platform,

    accountIdentifier,

    error

}) {

    const retryKey =
        getRetryKey({

            platform,

            accountIdentifier

        });

    /*
     * If another maintenance cycle
     * already created retry state for
     * this account, do not create a
     * duplicate retry timer.
     */
    if (
        retryState.has(
            retryKey
        )
    ) {
        return retryState.get(
            retryKey
        );
    }

    const state = {

        platform,

        accountIdentifier,

        failedAt:
            new Date(),

        nextRetryAt:
            new Date(
                Date.now()
                +
                RETRY_DELAY_MS
            ),

        retryCount:
            0,

        lastError:
            getErrorDetails(
                error
            ),

        timer:
            null

    };

    state.timer =
        setTimeout(

            () => {

                performRetry({

                    platform,

                    accountIdentifier

                })

                .catch(
                    retryError => {

                        logError({

                            type:
                                ERROR_TYPES.UNKNOWN_ERROR,

                            source:
                                'subscription-service',

                            message:
                                'Unhandled subscription retry error.',

                            details: {

                                platform,

                                accountIdentifier,

                                error:
                                    getErrorDetails(
                                        retryError
                                    )

                            }
                        });
                    }
                );
            },

            RETRY_DELAY_MS

        );

    retryState.set(

        retryKey,

        state

    );

    return state;
}


/*
====================================
SUBSCRIPTION MAINTENANCE
====================================
*/

/**
 * Checks all supported subscription
 * platforms for subscriptions that are
 * missing or approaching expiration.
 *
 * The default maintenance window is
 * one hour.
 *
 * A scheduler should call this function
 * every 30 minutes.
 *
 * IMPORTANT:
 *
 * A failed operation does NOT immediately
 * become a critical alert.
 *
 * Instead:
 *
 *     initial failure
 *          ↓
 *     Railway error
 *          ↓
 *     15 minute recovery timer
 *          ↓
 *     critical retry alert
 *          ↓
 *     retry #1
 *          ↓
 *     retry #2
 *          ↓
 *     retry #3
 */
async function maintainSubscriptions({

    expiresBefore

} = {}) {

    const maintenanceThreshold =
        expiresBefore
        ??
        new Date(
            Date.now()
            +
            DEFAULT_MAINTENANCE_WINDOW_MS
        );

    /*
    ====================================
    MAINTENANCE RESULTS
    ====================================
    */

    const results = [];

    let platformsChecked = 0;

    let platformsSkipped = 0;

    let creatorsChecked = 0;

    let subscriptionsRequested = 0;

    let subscriptionsSkipped = 0;

    let errors = 0;

    /*
    ====================================
    CHECK ALL REGISTERED PLATFORMS
    ====================================
    */
    for (
        const [
            platform,
            configuration
        ]
        of Object.entries(
            SUBSCRIPTION_PLATFORMS
        )
    ) {

        /*
        ====================================
        SKIP UNSUPPORTED PLATFORMS
        ====================================
        */
        if (
            !configuration.supported
            ||
            !configuration.service
        ) {

            platformsSkipped++;

            continue;
        }

        platformsChecked++;

        let platformCreators = [];

        /*
        ====================================
        FIND ACCOUNTS REQUIRING
        SUBSCRIPTION MAINTENANCE
        ====================================
        */
        try {

            platformCreators =
                await getCreatorsNeedingSubscriptionRenewal({

                    platform,

                    expiresBefore:
                        maintenanceThreshold

                });


            creatorsChecked +=
                platformCreators.length;

        }

        catch (
            error
        ) {

            errors++;

            /*
            ====================================
            CRITICAL PLATFORM LOOKUP FAILURE
            ====================================
            */
            await criticalLog({

                title:
                    'Content Creator Subscription Failure',

                category:
                    'SUBSCRIPTION_SERVICE',

                status:
                    'ERROR',

                details: {

                    failure:
                        'Unable to retrieve creators requiring subscription maintenance.',

                    platform,

                    expiresBefore:
                        maintenanceThreshold,

                    error:
                        getErrorDetails(
                            error
                        )
                }
            });

            logError({

                type:
                    ERROR_TYPES.UNKNOWN_ERROR,

                source:
                    'subscription-service',

                message:
                    'Failed to retrieve creators requiring subscription maintenance.',

                details: {

                    platform,

                    expiresBefore:
                        maintenanceThreshold,

                    error:
                        getErrorDetails(
                            error
                        )
                }
            });

            results.push({

                platform,

                creatorsChecked:
                    0,

                subscriptionsRequested:
                    0,

                subscriptionsSkipped:
                    0,

                errors:
                    1

            });


            continue;
        }

        /*
        ====================================
        NOTHING TO MAINTAIN
        ====================================
        */
        if (
            platformCreators.length === 0
        ) {

            results.push({

                platform,

                creatorsChecked:
                    0,

                subscriptionsRequested:
                    0,

                subscriptionsSkipped:
                    0,

                errors:
                    0

            });

            continue;
        }

        /*
        ====================================
        TRACK UNIQUE PLATFORM ACCOUNTS
        ====================================
        */
        const processedAccounts =
            new Set();


        let platformRequested =
            0;

        let platformSkipped =
            0;

        let platformErrors =
            0;

        /*
        ====================================
        PROCESS PLATFORM ACCOUNTS
        ====================================
        */
        for (
            const creator of platformCreators
        ) {

            const accountIdentifier =
                creator.account_identifier;

            /*
            ====================================
            SAME PLATFORM ACCOUNT MAY EXIST
            IN MULTIPLE DISCORD GUILDS.
            ====================================
            */
            if (
                processedAccounts.has(
                    accountIdentifier
                )
            ) {

                platformSkipped++;

                subscriptionsSkipped++;

                continue;
            }

            processedAccounts.add(
                accountIdentifier
            );

            const retryKey =
                getRetryKey({

                    platform,

                    accountIdentifier

                });

            /*
            ====================================
            ALREADY WAITING FOR RETRY
            ====================================
            */

            if (
                retryState.has(
                    retryKey
                )
            ) {

                platformSkipped++;

                subscriptionsSkipped++;

                continue;
            }

            try {

                /*
                ====================================
                INITIAL PLATFORM ATTEMPT
                ====================================
                */
                const result =
                    await configuration.service.subscribe({

                        accountIdentifier

                    });

                platformRequested++;

                subscriptionsRequested++;

                /*
                ====================================
                UPDATE CONTENT CREATOR EXPIRATION
                ====================================
                */
                const expirationResult =
                    await updateCreatorExpirations({

                        platform,

                        accountIdentifier,

                        subscriptionExpiresAt:
                            result.subscriptionExpiresAt

                    });

                /*
                ====================================
                SUCCESSFUL INITIAL ATTEMPT
                ====================================
                */
                logFeature({

                    category:
                        'CONTENT_CREATORS',

                    message:
                        'Platform subscription maintenance completed.',

                    details: {

                        platform,

                        accountIdentifier,

                        subscriptionExpiresAt:
                            result.subscriptionExpiresAt
                            ??
                            null,

                        creatorsUpdated:
                            expirationResult.creatorsUpdated

                    }
                });

                results.push({

                    platform,

                    accountIdentifier,

                    success:
                        true,

                    recovered:
                        false,

                    result,

                    creatorsUpdated:
                        expirationResult.creatorsUpdated

                });
            }

            catch (
                error
            ) {

                platformErrors++;

                errors++;

                /*
                ====================================
                INITIAL FAILURE
                ====================================
                */
                const errorDetails =
                    getErrorDetails(
                        error
                    );

                logError({

                    type:
                        ERROR_TYPES.UNKNOWN_ERROR,

                    source:
                        'subscription-service',

                    message:
                        'Initial platform subscription maintenance attempt failed. Retry scheduled.',

                    details: {

                        platform,

                        accountIdentifier,

                        retryDelayMinutes:
                            RETRY_DELAY_MS
                            /
                            60000,

                        maxRetries:
                            MAX_RETRIES,

                        error:
                            errorDetails

                    }
                });

                /*
                ====================================
                SCHEDULE RETRY
                ====================================
                */
                const retry =
                    scheduleInitialRetry({

                        platform,

                        accountIdentifier,

                        error

                    });

                results.push({

                    platform,

                    accountIdentifier,

                    success:
                        false,

                    recovered:
                        false,

                    retryScheduled:
                        true,

                    retryNumber:
                        0,

                    nextRetryAt:
                        retry.nextRetryAt,

                    error:
                        error.message

                });
            }
        }

        /*
        ====================================
        PLATFORM RESULTS
        ====================================
        */
        results.push({

            platform,

            creatorsChecked:
                platformCreators.length,

            subscriptionsRequested:
                platformRequested,

            subscriptionsSkipped:
                platformSkipped,

            errors:
                platformErrors

        });
    }

    /*
    ====================================
    RETURN MAINTENANCE RESULT
    ====================================
    */
    return {

        maintenanceThreshold,

        platformsChecked,

        platformsSkipped,

        creatorsChecked,

        subscriptionsRequested,

        subscriptionsSkipped,

        errors,

        results

    };
}


/*
====================================
EXPORTS
====================================
*/
module.exports = {
    initializeSubscription,
    supportsSubscription,
    maintainSubscriptions,
    handleSubscriptionVerification
};
