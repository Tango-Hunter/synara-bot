/**
 * Title: check-eventsub.js
 * Author: Tango Hunter
 * Date Created: 7/22/26
 * Description:
 * Developer utility used to inspect the current Twitch EventSub subscriptions registered with the Twitch API.
 * This script is read-only and does not modify subscriptions.
 */

const axios = require('axios');

require('dotenv').config();

const {
    getAccessToken
} = require('../../core/services/twitch-service');

const {
    logFeature
} = require('../../core/logging/logger');


/*
====================================
Resolve Twitch User
====================================
*/

async function getTwitchUser(

    accessToken,

    twitchUserId

) {

    const response =

        await axios.get(

            'https://api.twitch.tv/helix/users',

            {

                params: {

                    id:

                        twitchUserId

                },

                headers: {

                    Authorization:

                        `Bearer ${accessToken}`,

                    'Client-Id':

                        process.env.TWITCH_CLIENT_ID

                }
            }
        );

    return (

        response.data.data[0]

        ??

        null

    );
}

/*
====================================
Check EventSub
====================================
*/
async function checkEventSub() {

    try {

        console.log('');
        console.log('========================================');
        console.log(' Twitch EventSub Diagnostic');
        console.log('========================================');
        console.log('');

        const accessToken = await getAccessToken();

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

        const subscriptions = response.data.data;

        console.log(

            `Total subscriptions: ${subscriptions.length}`

        );

        console.log('');

        /*
        ====================================
        Group by Broadcaster
        ====================================
        */

        const grouped = new Map();

        for (

            const subscription of subscriptions

        ) {

            const broadcasterId =

                subscription.condition
                    ?.broadcaster_user_id

                ||

                'UNKNOWN';
                
            if (

                !grouped.has(

                    broadcasterId

                )

            ) {

                grouped.set(

                    broadcasterId,

                    []

                );

            }

            grouped

                .get(

                    broadcasterId

                )

                .push(

                    subscription

                );

        }

        for (

            const [

                broadcasterId,

                entries

            ]

            of grouped

        ) {

            const broadcaster =

                await getTwitchUser(

                    accessToken,

                    broadcasterId

                );

            console.log(

                '========================================'

            );

            console.log(

                `Display Name : ${

                    broadcaster

                        ?.display_name

                    ??

                    'Unknown'

                }`
            );

            console.log(

                `Login        : ${

                    broadcaster

                        ?.login

                    ??

                    'Unknown'

                }`
            );

            console.log(

                `User ID      : ${broadcasterId}`

            );

            console.log(

                '----------------------------------------'

            );

            for (
                const entry of entries
            ) {

                console.log(

                    `Type         : ${entry.type}`

                );

                console.log(

                    `Status       : ${entry.status}`

                );

                console.log(

                    `Created      : ${entry.created_at}`

                );

                console.log(

                    `Subscription : ${entry.id}`

                );

                console.log('');

            }
        }

        console.log(

            '========================================'

        );

        console.log(

            'EventSub check complete.'

        );

        console.log(

            '========================================'

        );
    }

    catch (error) {

        console.log('');
        console.log('========================================');
        console.log(' Diagnostic Error');
        console.log('========================================');
        console.log('');

        console.error(
            'Message:',
            error.message
        );

        console.error(
            'Status:',
            error.response?.status
        );

        console.error(
            'Response:'
        );

        console.dir(
            error.response?.data,
            {
                depth: null
            }
        );

        console.error('');
    }
}

if (
    require.main === module
) {
    checkEventSub();
}

module.exports = {
    checkEventSub
};
