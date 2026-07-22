/**
 * Title: tiktok-api.js
 * Author: Tango Hunter
 * Date Created: 7/21/26
 * Description: Verifies TikTok creator accounts using public profile pages.
 * This service is responsible only for account lookup and verification. It does not perform polling or upload detection.
 */

const {
    criticalLog
} = require('../../../core/logging/discord-logger');

const {
    logFeature
} = require('../../../core/logging/logger');


const fetch = global.fetch;


/*
====================================
CONSTANTS
====================================
*/

const TIKTOK_BASE_URL = 'https://www.tiktok.com';

const REQUEST_TIMEOUT = 10000;

const MAX_RETRIES = 2;

const TIKTOK_STATUS = Object.freeze({

    OK:
        0,

    USER_NOT_EXIST:
        10202,

    USER_BAN:
        10221,

    USER_PRIVATE:
        10222

});

/*
====================================
UTILITY HELPERS
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

/*
====================================
USERNAME NORMALIZATION
====================================
*/

function normalizeUsername(

    username

) {

    if (
        !username
    ) {
        return '';
    }

    return username

        .trim()

        .replace(

            /^@/,

            ''

        )

        .replace(

            /^https?:\/\/(www\.)?tiktok\.com\/@/i,

            ''

        )

        .replace(

            /\/$/,

            ''

        )

        .toLowerCase();

}

/*
====================================
USERNAME VALIDATION
====================================
*/

function validateUsername(

    username

) {

    const normalized =

        normalizeUsername(

            username

        );

    if (
        normalized.length === 0
    ) {

        return {

            success: false,

            error:

                'Please enter a TikTok username.'

        };
    }

    /*
    TikTok usernames:

    - letters
    - numbers
    - underscores
    - periods

    Maximum length: 24 characters
    */

    const validPattern =

        /^[a-zA-Z0-9._]{2,24}$/;

    if (

        !validPattern.test(

            normalized

        )
    ) {

        return {

            success: false,

            error:

                'That is not a valid TikTok username.'

        };
    }

    return {

        success: true,

        normalizedUsername:

            normalized

    };
}

/*
====================================
HTTP REQUEST
====================================
*/

async function requestTikTok(

    normalizedUsername

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

        const response =

            await fetch(

                `${TIKTOK_BASE_URL}/@${normalizedUsername}`,

                {

                    method: 'GET',

                    headers: {

                        'User-Agent':

                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',

                        'Accept':

                            'text/html'

                    },

                    signal:

                        controller.signal

                }
            );

        clearTimeout(

            timeout

        );

        return response;

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
VERIFY USERNAME
====================================
*/

async function verifyUsername(

    username

) {

    /*
    ====================================
    Normalize / Validate
    ====================================
    */

    const validation =

        validateUsername(

            username

        );

    if (
        !validation.success

    ) {
        return validation;
    }

    const {

        normalizedUsername

    } = validation;

    /*
    ====================================
    Retry Loop
    ====================================
    */

    for (

        let attempt = 1;

        attempt <= MAX_RETRIES;

        attempt++

    ) {

        try {

            logFeature({

                category:

                    'CONTENT_CREATOR',

                message:

                    'Verifying TikTok account.',

                details: {

                    username:

                        normalizedUsername,

                    attempt

                }
            });

            const response =

                await requestTikTok(

                    normalizedUsername

                );

            /*
            ====================================
            HTTP Status
            ====================================
            */

            if (
                response.status === 404
            ) {

                return {

                    success: false,

                    error:

                        'No TikTok account was found with that username.'

                };
            }

            if (
                !response.ok
            ) {

                throw new Error(

                    `TikTok returned HTTP ${response.status}`

                );
            }

            const html =

                await response.text();

            /*
            ====================================
            Parse hydration data
            ====================================
            */

            const hydrationMatch =

                html.match(

                    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/

                );

            if (
                !hydrationMatch
            ) {

                throw new Error(

                    'Unable to locate TikTok hydration data.'

                );

            }

            const hydration =

                JSON.parse(

                    hydrationMatch[1]

                );

            const userDetail =

                hydration

                    .__DEFAULT_SCOPE__

                    ['webapp.user-detail'];

            if (
                !userDetail
            ) {

                throw new Error(

                    'TikTok response did not include user detail.'

                );

            }

            const statusCode =

                userDetail.statusCode;

            switch (
                statusCode
            ) {

                case TIKTOK_STATUS.OK:

                    break;

                case TIKTOK_STATUS.USER_NOT_EXIST:

                case TIKTOK_STATUS.USER_BAN:

                    return {

                        success: false,

                        error:

                            'No TikTok account was found with that username.'

                    };

                case TIKTOK_STATUS.USER_PRIVATE:

                    return {

                        success: false,

                        error:

                            'This TikTok account is private and cannot be added.'

                    };

                default:

                    await criticalLog({

                        title:

                            'Unknown TikTok Status Code',

                        category:

                            'CONTENT_CREATOR',

                        details: {

                            statusCode,

                            username:

                                normalizedUsername,

                            file:

                                'tiktok-api.js',

                            function:

                                'verifyUsername'

                        }

                    });

                    throw new Error(

                        `Unknown TikTok status code: ${statusCode}`

                    );

            }

            /*
            ====================================
            Attempt to extract creator display name.
            ====================================
            */

            const creatorDisplayName =

                userDetail.userInfo?.user?.nickname

                ??

                normalizedUsername;

            /*
            ====================================
            Success
            ====================================
            */

            logFeature({

                category:

                    'CONTENT_CREATOR',

                message:

                    'TikTok account verified.',

                details: {

                    username:

                        normalizedUsername

                }
            });

            return {

                success: true,

                normalizedUsername,

                accountIdentifier:

                    normalizedUsername,

                creatorDisplayName,

                creatorUrl:

                    `${TIKTOK_BASE_URL}/@${normalizedUsername}`

            };

        }

        catch (
            error
        ) {

            logFeature({

                category:

                    'CONTENT_CREATOR',

                message:

                    'TikTok verification attempt failed.',

                details: {

                    username:

                        normalizedUsername,

                    attempt,

                    error:

                        error.message

                }
            });

            if (
                attempt < MAX_RETRIES
            ) {

                await sleep(

                    1000

                );

                continue;

            }

            logFeature({

                category:

                    'CONTENT_CREATOR',

                message:

                    'Unable to verify TikTok account.',

                details: {

                    username:

                        normalizedUsername,

                    error:

                        error.message

                }
            });

            return {

                success: false,

                error:

                    'Unable to contact TikTok. Please try again in a few moments.'

            };
        }
    }

    return {

        success: false,

        error:

            'Unable to contact TikTok. Please try again in a few moments.'

    };
}

module.exports = {
    normalizeUsername,
    verifyUsername
};
