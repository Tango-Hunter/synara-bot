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

        return;
    }

const accessToken =

    await getAccessToken();

    let response;

    try {

        console.log(

            '[EVENTSUB CALLBACK]',

            `${process.env.PUBLIC_URL}/twitch/eventsub`
        );

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

        const twitchError =
            error.response?.data;

        console.error(
            '[EVENTSUB ERROR FULL]',
            JSON.stringify(
                twitchError,
                null,
                2
            )
        );

        throw error;
    }

    const subscription =

        response.data.data[0];

    await saveSubscription({

        twitchUserId,

        subscriptionId:
            subscription.id
    });
}

module.exports = {
    ensureEventSubSubscription
};
