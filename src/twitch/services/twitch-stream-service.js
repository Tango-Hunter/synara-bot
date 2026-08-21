/**
 * Title: twitch-stream-service.js
 * Author: Tango Hunter
 * Date Created: 6/4/26
 * Date Modified: 8/21/26
 * Description: Retrieves live stream information from Twitch Helix API.
 */

const axios = require('axios');

const {
    getAccessToken
} = require('../../core/services/twitch-service');

const {
    logFeature
} = require('../../core/logging/logger');


/*
====================================
GET LIVE STREAM DATA
====================================
*/

async function getLiveStreamData(
    twitchUserId,
    streamStartedAt = null
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


    /*
    ====================================
    STREAM NOT LIVE
    ====================================
    */

    if (
        !stream
    ) {
        return null;
    }

    /*
    ====================================
    LOG STREAM DATA
    ====================================
    */
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


    /*
    ====================================
    BUILD FRESH THUMBNAIL URL
    ====================================

    Twitch uses a reusable thumbnail URL.

    The stream start timestamp is added as
    a cache-buster so Discord treats each
    stream session as a new image.

    Duplicate EventSub deliveries for the
    same stream session will receive the
    same URL.
    */

    let thumbnailUrl =
        stream.thumbnail_url

            .replace(
                '{width}',
                '1280'
            )

            .replace(
                '{height}',
                '720'
            );


    if (
        streamStartedAt
    ) {

        thumbnailUrl +=

            `?started=${encodeURIComponent(
                streamStartedAt
            )}`;
    }

    /*
    ====================================
    RETURN NORMALIZED STREAM DATA
    ====================================
    */
    return {

        title:
            stream.title,

        category:
            stream.game_name,

        twitchLogin:
            stream.user_login,

        twitchDisplayName:
            stream.user_name,

        thumbnailUrl

    };
}


module.exports = {
    getLiveStreamData
};
