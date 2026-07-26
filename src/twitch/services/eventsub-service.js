/**
 * Title: eventsub-service.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Description: Creates eventSub.
 */

const axios = require('axios');

const {
    getAccessToken
} = require('../../core/services/twitch-service');

const {
    getSubscription,
    saveSubscription,
    touchSubscription
} = require('../../core/database/twitch-eventsub-repository');

const {
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


async function synchronizeSubscription({

    twitchUserId,

    subscriptionType,

    accessToken

}) {

    const response =

        await axios.get(

            'https://api.twitch.tv/helix/eventsub/subscriptions',

            {

                headers: {

                    Authorization:

                        `Bearer ${accessToken}`,

                    'Client-Id':

                        process.env.TWITCH_CLIENT_ID

                }
            }
        );

    const subscription =

        response.data.data.find(

            entry =>

                entry.type ===

                    subscriptionType

                &&

                entry.condition
                    ?.broadcaster_user_id ===

                    twitchUserId

        );

    if (
        !subscription
    ) {
        return false;
    }

    await saveSubscription({

        twitchUserId,

        subscriptionType,

        subscriptionId:

            subscription.id

    });

    logFeature({

        category:

            'EVENTSUB',

        message:

            'EventSub repository synchronized.',

        details: {

            twitchUserId,

            subscriptionType,

            subscriptionId:

                subscription.id

        }
    });

    return true;
}

async function ensureEventSubSubscription({

    twitchUserId

}) {

    const accessToken =

        await getAccessToken();

    const requiredSubscriptions = [

        'stream.online',

        'stream.offline'

    ];

    for (

        const subscriptionType

        of requiredSubscriptions

    ) {

        const existing =

            await getSubscription({

                twitchUserId,

                subscriptionType

            });

        if (
            existing
        ) {

            await touchSubscription({

                twitchUserId,

                subscriptionType

            });

            logFeature({

                category:

                    'EVENTSUB',

                message:

                    'Verified EventSub subscription',

                details: {

                    twitchUserId,

                    subscriptionType

                }

            });

            continue;

        }

        let response;

        try {

            response =

                await axios.post(

                    'https://api.twitch.tv/helix/eventsub/subscriptions',

                    {

                        type:

                            subscriptionType,

                        version:

                            '1',

                        condition: {

                            broadcaster_user_id:

                                twitchUserId

                        },

                        transport: {

                            method:

                                'webhook',

                            callback:

                                `${process.env.PUBLIC_URL}/twitch/eventsub`,

                            secret:

                                process.env.TWITCH_EVENTSUB_SECRET

                        }

                    },

                    {

                        headers: {

                            Authorization:

                                `Bearer ${accessToken}`,

                            'Client-Id':

                                process.env.TWITCH_CLIENT_ID,

                            'Content-Type':

                                'application/json'

                        }

                    }

                );

        }

        catch (
            error
        ) {

            if (
                error.response?.status === 409
            ) {

                const synchronized =

                    await synchronizeSubscription({

                        twitchUserId,

                        subscriptionType,

                        accessToken

                    });

                if (
                    synchronized
                ) {

                    logFeature({

                        category:

                            'EVENTSUB',

                        message:

                            'Recovered existing EventSub subscription.',

                        details: {

                            twitchUserId,

                            subscriptionType

                        }

                    });

                    continue;

                }

            }

            logError({

                type:

                    ERROR_TYPES.TWITCH_ERROR,

                source:

                    'eventsub-service',

                message:

                    error.message,

                details: {

                    twitchUserId,

                    subscriptionType,

                    twitchResponse:

                        error.response?.data

                }
            });

            throw error;

        }

        const subscription =

            response.data.data[0];

        await saveSubscription({

            twitchUserId,

            subscriptionType,

            subscriptionId:

                subscription.id

        });

        logFeature({

            category:

                'EVENTSUB',

            message:

                'Created EventSub subscription',

            details: {

                twitchUserId,

                subscriptionType,

                subscriptionId:

                    subscription.id

            }
        });
    }
}

module.exports = {
    ensureEventSubSubscription
};
