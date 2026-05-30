/**
 * Title: twitch-service.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Date Modified: 5/29/26
 * Description: Handles Twitch authentication and user lookups.
 */

const axios = require('axios');


let cachedToken = null;

let tokenExpiresAt = null;


async function getAccessToken() {

    const now = Date.now();

    if (

        cachedToken &&

        tokenExpiresAt &&

        now < tokenExpiresAt

    ) {

        return cachedToken;
    }

    const response = await axios.post(

        'https://id.twitch.tv/oauth2/token',

        null,

        {

            params: {

                client_id:
                    process.env.TWITCH_CLIENT_ID,

                client_secret:
                    process.env.TWITCH_CLIENT_SECRET,

                grant_type:
                    'client_credentials'
            }
        }
    );

    cachedToken =
        response.data.access_token;

    tokenExpiresAt =

        now +

        (
            response.data.expires_in
            * 1000
        ) -

        60000;

    return cachedToken;
}

async function getTwitchUser(
    login
) {

    const accessToken =

        await getAccessToken();

    const response =

        await axios.get(

            'https://api.twitch.tv/helix/users',

            {

                headers: {

                    Authorization:
                        `Bearer ${accessToken}`,

                    'Client-Id':
                        process.env.TWITCH_CLIENT_ID
                },

                params: {

                    login
                }
            }
        );

    return response.data.data[0] || null;
}

module.exports = {
    getAccessToken,
    getTwitchUser
};
