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
// Temp Log
    console.log(
        '[EVENTSUB] FUNCTION CALLED'
    );
// End Temp Log
    const existing =

        await getSubscription(
            twitchUserId
        );

    if (
        existing
    ) {
// Temp Log
        console.log(

            '[EVENTSUB EXISTS]',

            twitchUserId
        );
// End Temp Log
        return;
    }
// Temp Log
    console.log(

    '[EVENTSUB] REQUESTING ACCESS TOKEN'
);
// End Temp Log
const accessToken =

    await getAccessToken();

    console.log(

        '[EVENTSUB] ACCESS TOKEN RECEIVED'
    );

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

        console.error(

            '[EVENTSUB ERROR FULL]',

            JSON.stringify(

                error.response?.data ||

                error.message,

                null,

                2
            )
        );

        throw error;
    }

    const subscription =

        response.data.data[0];

// Temp Log
    console.log(

        '[EVENTSUB CREATED]',

        subscription.id,

        twitchUserId
    );
// End Temp Log
    await saveSubscription({

        twitchUserId,

        subscriptionId:
            subscription.id
    });
}

module.exports = {
    ensureEventSubSubscription
};
