/**
 * Title: twitch-stream-service.js
 * Author: Tango Hunter
 * Date Created: 6/4/26
 * Date Modified: 6/4/26
 * Description: Retrieves live stream information from Twitch Helix API.
 */

const axios = require('axios');

const {
    getAccessToken
} = require('../../core/services/twitch-service');

const {
    logFeature
} = require('../../core/logging/logger');


async function getLiveStreamData(
    twitchUserId
) {

    const accessToken =
        await getAccessToken();

    const response =

        await axios.get(

            'https://api.twitch.tv/helix/streams',

            {

                params: {

                    user_id:
                        twitchUserId
                },

                headers: {

                    Authorization:
                        `Bearer ${accessToken}`,

                    'Client-Id':
                        process.env
                            .TWITCH_CLIENT_ID
                }
            }
        );

    const stream =
        response.data.data[0];

    if (
        !stream
    ) {

        return null;
    }

    logFeature({

        category:
            'TWITCH',

        message:
            'Live stream data retrieved',

        details: {

            twitchUserId,

            title:
                stream.title,

            category:
                stream.game_name
        }
    });

    return {

        title:
            stream.title,

        category:
            stream.game_name,

        twitchLogin:
            stream.user_login,

        twitchDisplayName:
            stream.user_name,

        thumbnailUrl:

            stream.thumbnail_url

                .replace(
                    '{width}',
                    '1280'
                )

                .replace(
                    '{height}',
                    '720'
                )
    };
}

module.exports = {
    getLiveStreamData
};
