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
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


/*
====================================
LIVE STATE VERIFICATION
====================================
*/

/*
 * EventSub can notify us that a stream has
 * started slightly before the Twitch Helix
 * /streams endpoint reflects that new state.
 *
 * This is especially important for console
 * streams, where the transition into the live
 * state can take a short amount of time.
 *
 * We therefore verify the stream multiple
 * times before considering the EventSub
 * notification invalid.
 *
 * Attempt 1: immediate
 * Attempt 2: +5 seconds
 * Attempt 3: +15 seconds
 * Attempt 4: +30 seconds
 */
const LIVE_VERIFICATION_DELAYS_MS = [
    0,
    5 * 1000,
    15 * 1000,
    30 * 1000
];


/*
====================================
WAIT HELPER
====================================
*/

function wait(
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


async function getLiveStreamData(
    twitchUserId,
    streamStartedAt = null,
    options = {}
) {

    const {

        retryVerification = true

    } = options;

    const accessToken =
        await getAccessToken();

    const verificationAttempts = [];

        /*
        ====================================
        DETERMINE VERIFICATION SCHEDULE
        ====================================
        
        stream.online events use the full
        retry schedule because Twitch Helix
        may temporarily lag behind EventSub.
    
        Offline cooldown verification is
        intentionally a single request because
        the five-minute offline cooldown has
        already provided the reconnection buffer.
        */
    
        const verificationDelays =
            retryVerification
    
                ?
    
            LIVE_VERIFICATION_DELAYS_MS
    
                :
    
            [0];

    for (
        let attemptIndex = 0;
        attemptIndex <
            verificationDelays.length;
        attemptIndex++
    ) {

        const attemptNumber =
            attemptIndex + 1;

        const delayMs =
            verificationDelays[
                attemptIndex
            ];

        /*
        ====================================
        WAIT BEFORE RETRY
        ====================================
        */
        if (
            delayMs > 0
        ) {

            logFeature({

                category:
                    'TWITCH',

                message:
                    'Waiting before Twitch live-state verification retry.',

                details: {

                    twitchUserId,

                    startedAt:
                        streamStartedAt,

                    attempt:
                        attemptNumber,

                    maxAttempts:
                        LIVE_VERIFICATION_DELAYS_MS.length,

                    delaySeconds:
                        delayMs / 1000

                }
            });

            await wait(
                delayMs
            );
        }

        /*
        ====================================
        QUERY TWITCH HELIX
        ====================================
        */
        const attemptStartedAt = Date.now();

        try {

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

            const stream = response.data.data[0];

            const requestDurationMs =
                Date.now()
                -
                attemptStartedAt;

            /*
            ====================================
            RECORD ATTEMPT
            ====================================
            */
            verificationAttempts.push({

                attempt:
                    attemptNumber,

                delayMs,

                requestDurationMs,

                live:
                    Boolean(
                        stream
                    )
            });

            /*
            ====================================
            LOG VERIFICATION ATTEMPT
            ====================================
            */
            logFeature({

                category:
                    'TWITCH',

                message:
                    stream

                        ? 'Twitch live-state verification succeeded.'

                        : 'Twitch live-state verification reports stream is not live yet.',

                details: {

                    twitchUserId,

                    startedAt:
                        streamStartedAt,

                    attempt:
                        attemptNumber,

                    maxAttempts:
                        LIVE_VERIFICATION_DELAYS_MS.length,

                    delaySeconds:
                        delayMs / 1000,

                    requestDurationMs,

                    live:
                        Boolean(
                            stream
                        )
                }
            });

            /*
            ====================================
            STREAM NOT LIVE YET
            ====================================
            */
            if (
                !stream
            ) {
                continue;
            }

            /*
            ====================================
            STREAM CONFIRMED LIVE
            ====================================
            */
            if (
                attemptNumber > 1
            ) {

                logFeature({

                    category:
                        'TWITCH',

                    message:
                        'Twitch live stream confirmed after verification retry.',

                    details: {

                        twitchUserId,

                        startedAt:
                            streamStartedAt,

                        successfulAttempt:
                            attemptNumber,

                        attemptsPerformed:
                            verificationAttempts.length,

                        previousAttempts:

                            verificationAttempts
                                .slice(
                                    0,
                                    -1
                                )
                    }
                });
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
                        stream.game_name,

                    verificationAttempt:
                        attemptNumber

                }
            });

            /*
            ====================================
            BUILD FRESH THUMBNAIL URL
            ====================================

            Twitch uses a reusable thumbnail URL.

            The stream start timestamp is added
            as a cache-buster so Discord treats
            each stream session as a new image.

            Duplicate EventSub deliveries for
            the same stream session receive the
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

        catch (
            error
        ) {

            const requestDurationMs =
                Date.now()
                -
                attemptStartedAt;

            verificationAttempts.push({

                attempt:
                    attemptNumber,

                delayMs,

                requestDurationMs,

                live:
                    false,

                error: {

                    message:
                        error.message,

                    status:
                        error.response?.status
                        ??
                        null,

                    response:
                        error.response?.data
                        ??
                        null

                }
            });

            /*
            ====================================
            LOG FAILED API ATTEMPT
            ====================================
            */
            logError({

                type:
                    ERROR_TYPES?.TWITCH_ERROR
                    ??
                    'TWITCH_ERROR',

                source:
                    'twitch-stream-service',

                message:
                    'Twitch live-state verification request failed.',

                details: {

                    twitchUserId,

                    startedAt:
                        streamStartedAt,

                    attempt:
                        attemptNumber,

                    maxAttempts:
                        LIVE_VERIFICATION_DELAYS_MS.length,

                    delaySeconds:
                        delayMs / 1000,

                    requestDurationMs,

                    status:
                        error.response?.status
                        ??
                        null,

                    twitchResponse:
                        error.response?.data
                        ??
                        null,

                    error:
                        error.message

                }
            });

            /*
            ====================================
            RETRY API FAILURE
            ====================================
            */
            if (
                attemptNumber <
                LIVE_VERIFICATION_DELAYS_MS.length
            ) {
                continue;
            }

            /*
            ====================================
            ALL ATTEMPTS FAILED
            ====================================
            */
            throw error;

        }
    }

        /*
        ====================================
        LIVE STATE COULD NOT BE VERIFIED
        ====================================
        */
        const failureMessage =
    
            retryVerification
    
                ?
    
            'Twitch stream.online event could not be verified through Helix after all verification attempts.'
    
                :
    
            'Twitch live-state verification returned no active stream.';
    
        /*
        ====================================
        LOG VERIFICATION FAILURE
        ====================================
        */
        if (
            retryVerification
        ) {
    
            logError({
    
                type:
                    ERROR_TYPES?.TWITCH_ERROR
                    ??
                    'TWITCH_ERROR',
    
                source:
                    'twitch-stream-service',
    
                message:
                    failureMessage,
    
                details: {
    
                    twitchUserId,
    
                    startedAt:
                        streamStartedAt,
    
                    attempts:
                        verificationAttempts.length,
    
                    maxAttempts:
                        verificationDelays.length,
    
                    verificationWindowSeconds:
                        verificationDelays[
                            verificationDelays.length - 1
                        ] / 1000,
    
                    verificationAttempts
    
                }
            });
        }
    
        else {
    
            logFeature({
    
                category:
                    'TWITCH',
    
                message:
                    'Twitch offline-state verification confirms stream is offline.',
    
                details: {
    
                    twitchUserId,
    
                    startedAt:
                        streamStartedAt,
    
                    attempts:
                        verificationAttempts.length
    
                }
            });
        }
    
        return null;
}


module.exports = {
    getLiveStreamData
};
