/**
 * Title: eventsub-service.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 5/30/26
 * Description: Creates eventSub.
 */

const axios = require('axios');

const {
    getAccessToken
} = require('../../core/services/twitch-service');

const {
    getSubscription,
    saveSubscription
} = require('../../core/database/twitch-eventsub-repository');

const {
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


async function ensureEventSubSubscription({

    twitchUserId
}) {

    const existing =
        await getSubscription(
            twitchUserId
        );

    if (
        existing
    ) {

        logFeature({

            category:
                'EVENTSUB',

            message:
                'Existing EventSub found',

            details: {

                twitchUserId
            }
        });

        return;
    }

const accessToken =

    await getAccessToken();

    let response;

    try {

        for (
            const eventType
            of [

                'stream.online',

                'stream.offline'
            ]
        ) {

        response =

            await axios.post(
                'https://api.twitch.tv/helix/eventsub/subscriptions',

                {

                    type:
                        eventType,

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

                            process.env
                                .TWITCH_EVENTSUB_SECRET
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

    } catch (error) {

        logError({

            type:
                ERROR_TYPES.TWITCH_ERROR,

            source:
                'eventsub-service',

            message:
                error.message,

            details: {

                twitchUserId,

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

        subscriptionId:
            subscription.id
    });

    logFeature({

        category:
            'EVENTSUB',

        message:
            'EventSub subscription created',

        details: {

            twitchUserId,

            subscriptionId:
                subscription.id
        }
    });
}

module.exports = {
    ensureEventSubSubscription
};
