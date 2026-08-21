/**
 * Title: tiktok-api.js
 * Author: Tango Hunter
 * Date Created: 7/21/26
 * Date Modified: 8/18/26
 * Description: TikTok API integration for Login Kit,
 * OAuth token management, and authorized user lookup.
 *
 * This service is responsible only for communicating
 * with TikTok's API.
 *
 * It does not:
 *
 * - Manage Discord interactions
 * - Store authorization records
 * - Manage content creator records
 * - Poll for new content
 * - Post Discord announcements
 */


const crypto = require('crypto');

const {
    criticalLog
} = require('../../../core/logging/discord-logger');

const {
    logFeature
} = require('../../../core/logging/logger');


/*
====================================
ENVIRONMENT
====================================
*/

const TIKTOK_CLIENT_KEY =
    process.env.TIKTOK_CLIENT_KEY;

const TIKTOK_CLIENT_SECRET =
    process.env.TIKTOK_CLIENT_SECRET;

const TIKTOK_REDIRECT_URI =
    process.env.TIKTOK_REDIRECT_URI;


/*
====================================
CONSTANTS
====================================
*/

const TIKTOK_AUTHORIZE_URL =
    'https://www.tiktok.com/v2/auth/authorize/';

const TIKTOK_TOKEN_URL =
    'https://open.tiktokapis.com/v2/oauth/token/';

const TIKTOK_USER_INFO_URL =
    'https://open.tiktokapis.com/v2/user/info/';

const TIKTOK_BASE_URL =
    'https://www.tiktok.com';

const REQUEST_TIMEOUT =
    10000;

const STATE_MAX_AGE =
    10 * 60 * 1000;

const TIKTOK_SCOPES = [

    'user.info.basic',

    'video.list'

].join(',');


/*
====================================
CONFIGURATION VALIDATION
====================================
*/

function validateConfiguration() {

    const missing = [];

    if (
        !TIKTOK_CLIENT_KEY
    ) {

        missing.push(
            'TIKTOK_CLIENT_KEY'
        );

    }

    if (
        !TIKTOK_CLIENT_SECRET
    ) {

        missing.push(
            'TIKTOK_CLIENT_SECRET'
        );

    }

    if (
        !TIKTOK_REDIRECT_URI
    ) {

        missing.push(
            'TIKTOK_REDIRECT_URI'
        );

    }

    if (
        missing.length > 0
    ) {

        throw new Error(
            `Missing TikTok configuration: ${missing.join(', ')}`
        );

    }

}


/*
====================================
REQUEST HELPER
====================================
*/

async function requestTikTok({

    url,

    options = {}

}) {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(

            () => {

                controller.abort();

            },

            REQUEST_TIMEOUT

        );

    try {

        const response =
            await fetch(

                url,

                {

                    ...options,

                    signal:
                        controller.signal

                }

            );

        return response;

    }

    finally {

        clearTimeout(
            timeout
        );

    }

}


/*
====================================
OAUTH STATE
====================================

The state value protects the OAuth
callback from unsolicited requests.

The state payload is signed with the
TikTok client secret so we do not need
a separate state table.

The payload contains only information
needed to restore the Discord setup
workflow.
====================================
*/

function createOAuthState({

    guildId,

    userId

}) {

    validateConfiguration();

    if (
        !guildId ||
        !userId
    ) {

        throw new Error(
            'guildId and userId are required to create TikTok OAuth state.'
        );

    }

    const payload = {

        guildId,

        userId,

        timestamp:
            Date.now(),

        nonce:
            crypto.randomBytes(
                16
            ).toString(
                'hex'
            )

    };

    const encodedPayload =
        Buffer
            .from(
                JSON.stringify(
                    payload
                )
            )
            .toString(
                'base64url'
            );

    const signature =
        crypto
            .createHmac(
                'sha256',
                TIKTOK_CLIENT_SECRET
            )
            .update(
                encodedPayload
            )
            .digest(
                'base64url'
            );

    return `${encodedPayload}.${signature}`;

}


/*
====================================
VALIDATE OAUTH STATE
====================================
*/

function validateOAuthState(
    state
) {

    validateConfiguration();

    if (
        !state ||
        typeof state !== 'string'
    ) {

        return {

            valid: false,

            error:
                'Missing OAuth state.'

        };

    }

    const parts =
        state.split('.');

    if (
        parts.length !== 2
    ) {

        return {

            valid: false,

            error:
                'Invalid OAuth state format.'

        };

    }

    const [
        encodedPayload,
        suppliedSignature
    ] = parts;

    const expectedSignature =
        crypto
            .createHmac(
                'sha256',
                TIKTOK_CLIENT_SECRET
            )
            .update(
                encodedPayload
            )
            .digest(
                'base64url'
            );

    const suppliedBuffer =
        Buffer.from(
            suppliedSignature
        );

    const expectedBuffer =
        Buffer.from(
            expectedSignature
        );

    if (
        suppliedBuffer.length !==
        expectedBuffer.length
    ) {

        return {

            valid: false,

            error:
                'Invalid OAuth state signature.'

        };

    }

    if (
        !crypto.timingSafeEqual(
            suppliedBuffer,
            expectedBuffer
        )
    ) {

        return {

            valid: false,

            error:
                'Invalid OAuth state signature.'

        };

    }

    let payload;

    try {

        payload =
            JSON.parse(

                Buffer
                    .from(
                        encodedPayload,
                        'base64url'
                    )
                    .toString(
                        'utf8'
                    )

            );

    }

    catch (
        error
    ) {

        return {

            valid: false,

            error:
                'Unable to decode OAuth state.'

        };

    }

    if (
        !payload.guildId ||
        !payload.userId ||
        !payload.timestamp
    ) {

        return {

            valid: false,

            error:
                'OAuth state is missing required information.'

        };

    }

    const age =
        Date.now() -
        Number(
            payload.timestamp
        );

    if (
        age < 0 ||
        age > STATE_MAX_AGE
    ) {

        return {

            valid: false,

            error:
                'TikTok authorization request has expired.'

        };

    }

    return {

        valid: true,

        guildId:
            payload.guildId,

        userId:
            payload.userId,

        timestamp:
            payload.timestamp,

        nonce:
            payload.nonce

    };

}


/*
====================================
BUILD AUTHORIZATION URL
====================================
*/

function buildAuthorizationUrl({

    guildId,

    userId

}) {

    validateConfiguration();

    const state =
        createOAuthState({

            guildId,

            userId

        });

    const params =
        new URLSearchParams({

            client_key:
                TIKTOK_CLIENT_KEY,

            response_type:
                'code',

            scope:
                TIKTOK_SCOPES,

            redirect_uri:
                TIKTOK_REDIRECT_URI,

            state

        });

    return {

        authorizationUrl:
            `${TIKTOK_AUTHORIZE_URL}?${params.toString()}`,

        state

    };

}


/*
====================================
EXCHANGE AUTHORIZATION CODE
====================================
*/

async function exchangeAuthorizationCode(
    code
) {

    validateConfiguration();

    if (
        !code
    ) {

        throw new Error(
            'TikTok authorization code is required.'
        );

    }

    const body =
        new URLSearchParams({

            client_key:
                TIKTOK_CLIENT_KEY,

            client_secret:
                TIKTOK_CLIENT_SECRET,

            code,

            grant_type:
                'authorization_code',

            redirect_uri:
                TIKTOK_REDIRECT_URI

        });

    try {

        const response =
            await requestTikTok({

                url:
                    TIKTOK_TOKEN_URL,

                options: {

                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/x-www-form-urlencoded'

                    },

                    body:
                        body.toString()

                }

            });

        const data =
            await response.json();

        if (
            !response.ok
        ) {

            await criticalLog({

                title:
                    'TikTok Authorization Failed',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'exchangeAuthorizationCode',

                    status:
                        response.status,

                    error:
                        data.error,

                    errorDescription:
                        data.error_description

                }

            });

            throw new Error(
                data.error_description
                ||
                data.error
                ||
                `TikTok returned HTTP ${response.status}.`
            );

        }

        if (
            !data.access_token ||
            !data.refresh_token ||
            !data.open_id
        ) {

            await criticalLog({

                title:
                    'Invalid TikTok Authorization Response',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'exchangeAuthorizationCode',

                    hasAccessToken:
                        Boolean(
                            data.access_token
                        ),

                    hasRefreshToken:
                        Boolean(
                            data.refresh_token
                        ),

                    hasOpenId:
                        Boolean(
                            data.open_id
                        )

                }

            });

            throw new Error(
                'TikTok authorization response did not contain the required account information.'
            );

        }

        logFeature({

            category:
                'CONTENT_CREATOR',

            message:
                'TikTok authorization completed.',

            details: {

                accountIdentifier:
                    data.open_id,

                scope:
                    data.scope

            }

        });

        return {

            accountIdentifier:
                data.open_id,

            accessToken:
                data.access_token,

            refreshToken:
                data.refresh_token,

            accessTokenExpiresIn:
                Number(
                    data.expires_in
                ),

            refreshTokenExpiresIn:
                Number(
                    data.refresh_expires_in
                ),

            scope:
                data.scope
                ||
                TIKTOK_SCOPES,

            tokenType:
                data.token_type
                ||
                'Bearer'

        };

    }

    catch (
        error
    ) {

        if (
            error.name ===
            'AbortError'
        ) {

            await criticalLog({

                title:
                    'TikTok Authorization Timeout',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'exchangeAuthorizationCode',

                    timeout:
                        REQUEST_TIMEOUT

                }

            });

            throw new Error(
                'TikTok authorization request timed out.'
            );

        }

        throw error;

    }

}


/*
====================================
REFRESH ACCESS TOKEN
====================================
*/

async function refreshAccessToken(
    refreshToken
) {

    validateConfiguration();

    if (
        !refreshToken
    ) {

        throw new Error(
            'TikTok refresh token is required.'
        );

    }

    const body =
        new URLSearchParams({

            client_key:
                TIKTOK_CLIENT_KEY,

            client_secret:
                TIKTOK_CLIENT_SECRET,

            grant_type:
                'refresh_token',

            refresh_token:
                refreshToken

        });

    try {

        const response =
            await requestTikTok({

                url:
                    TIKTOK_TOKEN_URL,

                options: {

                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/x-www-form-urlencoded'

                    },

                    body:
                        body.toString()

                }

            });

        const data =
            await response.json();

        if (
            !response.ok
        ) {

            await criticalLog({

                title:
                    'TikTok Token Refresh Failed',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'refreshAccessToken',

                    status:
                        response.status,

                    error:
                        data.error,

                    errorDescription:
                        data.error_description

                }

            });

            throw new Error(
                data.error_description
                ||
                data.error
                ||
                `TikTok returned HTTP ${response.status}.`
            );

        }

        if (
            !data.access_token ||
            !data.refresh_token
        ) {

            await criticalLog({

                title:
                    'Invalid TikTok Refresh Response',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'refreshAccessToken',

                    hasAccessToken:
                        Boolean(
                            data.access_token
                        ),

                    hasRefreshToken:
                        Boolean(
                            data.refresh_token
                        )

                }

            });

            throw new Error(
                'TikTok token refresh response did not contain the required token information.'
            );

        }

        logFeature({

            category:
                'CONTENT_CREATOR',

            message:
                'TikTok access token refreshed.',

            details: {

                accessTokenExpiresIn:
                    Number(
                        data.expires_in
                    ),

                refreshTokenExpiresIn:
                    Number(
                        data.refresh_expires_in
                    ),

                scope:
                    data.scope

            }

        });

        return {

            accessToken:
                data.access_token,

            refreshToken:
                data.refresh_token,

            accessTokenExpiresIn:
                Number(
                    data.expires_in
                ),

            refreshTokenExpiresIn:
                Number(
                    data.refresh_expires_in
                ),

            scope:
                data.scope
                ||
                TIKTOK_SCOPES,

            tokenType:
                data.token_type
                ||
                'Bearer'

        };

    }

    catch (
        error
    ) {

        if (
            error.name ===
            'AbortError'
        ) {

            await criticalLog({

                title:
                    'TikTok Token Refresh Timeout',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'refreshAccessToken',

                    timeout:
                        REQUEST_TIMEOUT

                }

            });

            throw new Error(
                'TikTok token refresh request timed out.'
            );

        }

        throw error;

    }

}


/*
====================================
GET AUTHORIZED USER
====================================
*/

async function getAuthorizedUser(
    accessToken
) {

    if (
        !accessToken
    ) {

        throw new Error(
            'TikTok access token is required.'
        );

    }

        const fields =
        [
            'open_id',
            'display_name',
            'avatar_url'
        ].join(',');

    try {

        const response =
            await requestTikTok({

                url:
                    `${TIKTOK_USER_INFO_URL}?fields=${fields}`,

                options: {

                    method:
                        'GET',

                    headers: {

                        Authorization:
                            `Bearer ${accessToken}`,

                        Accept:
                            'application/json'

                    }

                }

            });

        const data =
            await response.json();

        if (
            !response.ok
        ) {

            await criticalLog({

                title:
                    'TikTok User Lookup Failed',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'getAuthorizedUser',

                    status:
                        response.status,

                    error:
                        data.error,

                    errorDescription:
                        data.error_description

                }

            });

            throw new Error(
                data.error_description
                ||
                data.error
                ||
                `TikTok returned HTTP ${response.status}.`
            );

        }

        const user =
            data.data?.user;

        if (
            !user?.open_id
        ) {

            await criticalLog({

                title:
                    'Invalid TikTok User Response',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'getAuthorizedUser',

                    hasUser:
                        Boolean(
                            user
                        ),

                    hasOpenId:
                        Boolean(
                            user?.open_id
                        )

                }

            });

            throw new Error(
                'TikTok did not return a valid authorized user.'
            );

        }

        logFeature({

            category:
                'CONTENT_CREATOR',

            message:
                'TikTok authorized user retrieved.',

            details: {

                accountIdentifier:
                    user.open_id,

                creatorDisplayName:
                    user.display_name

            }

        });

        return {
            accountIdentifier:
                user.open_id,

            creatorDisplayName:
                user.display_name
                ||
                'TikTok Creator',

            creatorUrl:
                null,
                
            avatarUrl:
                user.avatar_url
                ||
                null
        };
    }

    catch (
        error
    ) {

        if (
            error.name ===
            'AbortError'
        ) {

            await criticalLog({

                title:
                    'TikTok User Lookup Timeout',

                category:
                    'CONTENT_CREATOR',

                details: {

                    function:
                        'getAuthorizedUser',

                    timeout:
                        REQUEST_TIMEOUT

                }

            });

            throw new Error(
                'TikTok user lookup request timed out.'
            );

        }

        throw error;

    }

}


/*
====================================
CALCULATE TOKEN EXPIRATION
====================================

Converts TikTok's expires_in values
into actual timestamps for storage
in tiktok_authorizations.
====================================
*/

function calculateTokenExpiration(
    expiresIn
) {

    const seconds =
        Number(
            expiresIn
        );

    if (
        !Number.isFinite(
            seconds
        )
        ||
        seconds <= 0
    ) {

        throw new Error(
            'TikTok returned an invalid token expiration value.'
        );

    }

    return new Date(

        Date.now() +
        (
            seconds *
            1000
        )

    );

}


/*
====================================
EXPORTS
====================================
*/

module.exports = {

    createOAuthState,

    validateOAuthState,

    buildAuthorizationUrl,

    exchangeAuthorizationCode,

    refreshAccessToken,

    getAuthorizedUser,

    calculateTokenExpiration

};
