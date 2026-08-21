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
 *
 * This file DOES NOT:
 * • Build Discord announcements
 * • Send Discord messages
 * • Parse platform notifications
 * • Perform platform-specific subscription logic
 * • Handle Express routes
 */


const {
    getCreatorByPlatformAccount,
    getCreatorsNeedingSubscriptionRenewal,
    updateSubscriptionExpiration
} = require(
    '../core/database/content-creators-repository'
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
PLATFORM SUBSCRIPTION SERVICES
====================================
*/

const YouTubeWebSub =
    require('./youtube-websub');


/*
====================================
SUBSCRIPTION PLATFORM REGISTRY
====================================

Each platform must define:

supported:
    Whether the platform has a subscription
    mechanism that SYNARA can maintain.

service:
    The platform-specific subscription module.

Platforms without subscription support
must use:

supported: false
service: null

Add new platforms here as they are
implemented.
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
            false,
        service:
            null
    }

};


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
 * Initializes subscription handling for
 * a Content Creator.
 *
 * This function provides the common entry
 * point that content-creator-handler.js
 * will eventually call.
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
 * responsible for its own subscription
 * protocol.
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
 * actual subscription expiration.
 *
 * This service is responsible for:
 *
 * • Finding all Content Creator records
 *   using the verified platform/account.
 *
 * • Updating subscription expiration
 *   for every matching guild.
 *
 * This keeps database operations out
 * of platform-specific subscription
 * modules.
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
SUBSCRIPTION MAINTENANCE
====================================
*/

/**
 * Checks all supported subscription
 * platforms for subscriptions that are
 * missing or approaching expiration.
 *
 * The service determines which platforms
 * support subscriptions and delegates
 * the actual subscription operation to
 * the platform-specific service.
 *
 * Platforms without subscription support
 * are skipped automatically.
 *
 * A failed subscription request is treated
 * as a critical operational failure and is
 * sent to the private SYNARA critical
 * logging channel immediately.
 */
async function maintainSubscriptions({

    expiresBefore

} = {}) {

    /*
    ====================================
    DEFAULT MAINTENANCE WINDOW
    ====================================
    */

    const maintenanceThreshold =

        expiresBefore

        ??

        new Date(

            Date.now()

            +

            (

                24 *

                60 *

                60 *

                1000

            )

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
        SKIP PLATFORMS WITHOUT SUBSCRIPTIONS
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

        try {

            /*
            ====================================
            FIND CREATORS REQUIRING
            SUBSCRIPTION MAINTENANCE
            ====================================
            */

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

                        error.message

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

                    error:

                        error.message

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

        let platformRequested = 0;

        let platformSkipped = 0;

        let platformErrors = 0;

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

            try {

                const result =

                    await configuration.service.subscribe({

                        accountIdentifier

                    });

                platformRequested++;

                subscriptionsRequested++;

                results.push({

                    platform,

                    accountIdentifier,

                    success:
                        true,

                    result

                });

            }

            catch (
                error
            ) {

                platformErrors++;

                errors++;

                /*
                ====================================
                CRITICAL RENEWAL FAILURE
                ====================================
                */

                await criticalLog({

                    title:

                        'Content Creator Subscription Renewal Failed',

                    category:

                        'SUBSCRIPTION_SERVICE',

                    status:

                        'ERROR',

                    details: {

                        failure:

                            'Platform subscription renewal failed.',

                        platform,

                        accountIdentifier,

                        expiresBefore:

                            maintenanceThreshold,

                        error:

                            error.message

                    }
                });

                logError({

                    type:

                        ERROR_TYPES.UNKNOWN_ERROR,

                    source:

                        'subscription-service',

                    message:

                        'Platform subscription renewal failed.',

                    details: {

                        platform,

                        accountIdentifier,

                        error:

                            error.message

                    }
                });

                results.push({

                    platform,

                    accountIdentifier,

                    success:
                        false,

                    error:

                        error.message

                });
            }
        }

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


module.exports = {
    initializeSubscription,
    supportsSubscription,
    maintainSubscriptions,
    handleSubscriptionVerification
};
