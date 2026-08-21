/**
 * Title: youtube-api.js
 * Author: Tango Hunter
 * Date Created: 7/18/26
 * Description: YouTube API integration for Content Creator Announcements.
 *
 * This file is responsible for:
 * • Channel verification
 * • Metadata retrieval
 * • Channel normalization
 */

const {
    logFeature
} = require('../../../core/logging/logger');


const API_KEY = process.env.YOUTUBE_API_KEY;

const API_BASE = 'https://www.googleapis.com/youtube/v3';

const REQUEST_TIMEOUT = 10000;

const RETRY_DELAY = 10000;


/*
====================================
HELPERS
====================================
*/

function sleep(

    milliseconds

) {

    return new Promise(

        resolve =>

            setTimeout(

                resolve,

                milliseconds

            )
    );
}

function normalizeChannelName(

    channelName

) {

    if (
        !channelName
    ) {
        return null;
    }

    let normalized =

        channelName.trim();

    if (

        normalized.startsWith(

            '@'

        )
    ) {

        normalized =

            normalized.substring(

                1

            );
    }

    return normalized;

}

async function requestYouTube(

    endpoint,

    searchParams

) {

    const controller =

        new AbortController();

    const timeout =

        setTimeout(

            () =>

                controller.abort(),

            REQUEST_TIMEOUT

        );

    try {

        const url =

            new URL(

                `${API_BASE}/${endpoint}`

            );

        Object.entries(

            searchParams

        ).forEach(

            ([

                key,

                value

            ]) =>

                url.searchParams.append(

                    key,

                    value

                )
        );

        url.searchParams.append(

            'key',

            API_KEY

        );

        const response =

            await fetch(

                url,

                {

                    signal:

                        controller.signal

                }
            );

        clearTimeout(

            timeout

        );

        if (
            !response.ok
        ) {

            throw new Error(

                `YouTube API returned ${response.status}`

            );
        }

        return await response.json();

    }

    catch (
        error
    ) {

        clearTimeout(

            timeout

        );

        throw error;

    }
}

/*
====================================
CHANNEL VERIFICATION
====================================
*/

async function verifyChannelName({

    channelName

}) {

    const normalized =

        normalizeChannelName(

            channelName

        );

    if (
        !normalized
    ) {

        return {

            success: false,

            error:

                'A YouTube channel name is required.'

        };
    }

    for (

        let attempt = 1;

        attempt <= 2;

        attempt++

    ) {

        try {

            const response =

                await requestYouTube(

                    'channels',

                    {

                        part:

                            'snippet',

                        forHandle:

                            normalized

                    }
                );

            if (

                !response.items ||

                response.items.length === 0

            ) {

                return {

                    success: false,

                    error:

                        'No YouTube channel was found with that name.'

                };
            }

            const channel =

                response.items[0];

            logFeature({

                category:

                    'CONTENT_CREATOR',

                message:

                    'YouTube channel verified.',

                details: {

                    channelId:

                        channel.id,

                    creatorDisplayName:

                        channel.snippet.title

                }

            });

            return {

                success: true,

                normalizedIdentifier:

                    normalized,

                accountIdentifier:

                    channel.id,

                creatorDisplayName:

                    channel.snippet.title,

                creatorUrl:

                    `https://www.youtube.com/channel/${channel.id}`

            };
        }

        catch (
            error
        ) {

            if (

                error.name === 'AbortError'

            ) {

                logFeature({

                    category:

                        'CONTENT_CREATOR',

                    message:

                        'YouTube request timed out.',

                    details: {

                        channelName:

                            normalized

                    }
                });
            }

            logFeature({

                category:

                    'CONTENT_CREATOR',

                message:

                    `YouTube verification attempt ${attempt} failed.`,

                details: {

                    error:

                        error.message,

                    channelName:

                        normalized

                }
            });

            if (

                attempt === 1

            ) {

                await sleep(

                    RETRY_DELAY

                );
            }
        }
    }

    return {

        success: false,

        error:

            'Unable to contact YouTube. Please try again in a few moments.'

    };
}

module.exports = {
    normalizeChannelName,
    verifyChannelName
};
