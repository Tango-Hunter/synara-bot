/**
 * Title: tiktok-subscription.js
 * Author: Tango Hunter
 * Date Created: 8/23/26
 * Description: Handles TikTok OAuth access-token maintenance for Content Creator Announcements.
 *
 * Responsibilities:
 * • Initialize TikTok authorization state for a Content Creator.
 * • Refresh TikTok access tokens.
 * • Persist refreshed TikTok tokens.
 * • Return the refreshed expiration using the common
 *   subscriptionExpiresAt contract.
 *
 * Important:
 * TikTok does not use a traditional subscription lease.
 *
 * Within SYNARA's platform-agnostic Content Creator system,
 * subscriptionExpiresAt represents the expiration of the
 * platform's authorization/lease mechanism.
 *
 * For TikTok:
 *
 *     subscriptionExpiresAt
 *             =
 *     access_token_expires_at
 *
 * This file does NOT:
 * • Perform retry scheduling.
 * • Decide when retries occur.
 * • Send critical Discord alerts.
 * • Update content_creators directly.
 * • Send Discord announcements.
 * • Handle Express routes.
 *
 * Retry policy belongs to subscription-service.js so that
 * all supported platforms receive the same failure/recovery
 * behavior.
 */


/*
====================================
DEPENDENCIES
====================================
*/

const {
    getTikTokAuthorization,
    updateTikTokAuthorizationTokens
} = require(
    '../core/database/tiktok-authorization-repository'
);

const {
    logFeature,
    logError
} = require(
    '../core/logging/logger'
);

const {
    ERROR_TYPES
} = require(
    '../core/logging/error-types'
);

const fetch =
    global.fetch;


/*
====================================
CONSTANTS
====================================
*/

/*
 * TikTok Login Kit OAuth v2 token
 * endpoint.
 *
 * This endpoint is used both for the
 * authorization-code exchange and for
 * refreshing an existing access token.
 *
 * TikTok specifically requires:
 *
 *     grant_type=refresh_token
 *
 * when refreshing an access token.
 */
const TIKTOK_TOKEN_URL =
    'https://open.tiktokapis.com/v2/oauth/token/';


/*
 * Prevent a TikTok token request from
 * hanging indefinitely.
 */
const REQUEST_TIMEOUT_MS = 10000;


/*
====================================
CONFIGURATION
====================================
*/

/**
 * Retrieves and validates the TikTok
 * application credentials.
 */
function getTikTokConfiguration() {

    const clientKey =
        process.env.TIKTOK_CLIENT_KEY;

    const clientSecret =
        process.env.TIKTOK_CLIENT_SECRET;

    if (
        !clientKey
    ) {
        throw new Error(
            'Missing TikTok configuration: TIKTOK_CLIENT_KEY'
        );
    }

    if (
        !clientSecret
    ) {
        throw new Error(
            'Missing TikTok configuration: TIKTOK_CLIENT_SECRET'
        );
    }

    return {
        clientKey,
        clientSecret
    };
}


/*
====================================
DATE HELPERS
====================================
*/

/**
 * Converts TikTok's expires_in value,
 * which is expressed in seconds from
 * the time of the response, into the
 * absolute timestamp used by SYNARA's
 * database.
 *
 * TikTok's user access token is normally
 * valid for 24 hours.
 */
function calculateExpiration(
    expiresIn
) {

    const numericExpiresIn =
        Number(
            expiresIn
        );

    if (
        !Number.isFinite(
            numericExpiresIn
        )
        ||
        numericExpiresIn <= 0
    ) {
        throw new Error(
            'TikTok returned an invalid token expiration value.'
        );
    }

    return new Date(
        Date.now()
        +
        (
            numericExpiresIn
            *
            1000
        )
    );
}


/*
====================================
TOKEN RESPONSE VALIDATION
====================================
*/

function validateTokenResponse(
    tokenData
) {

    if (
        !tokenData
        ||
        typeof tokenData !== 'object'
    ) {
        throw new Error(
            'TikTok returned an empty or invalid token response.'
        );
    }

    if (
        tokenData.error
    ) {

        const errorCode =
            tokenData.error;

        const errorDescription =
            tokenData.error_description
            ??
            'TikTok did not provide an error description.';

        const logId =
            tokenData.log_id
            ??
            'unknown';

        const error =
            new Error(
                `TikTok token refresh failed: ${errorCode} - ${errorDescription} (log_id: ${logId})`
            );

        /*
         * Attach structured information to
         * the Error object so the centralized
         * subscription service can later use
         * it for critical logging.
         */
        error.tiktokError =
            errorCode;

        error.tiktokErrorDescription =
            errorDescription;

        error.tiktokLogId =
            logId;

        throw error;
    }

    if (
        !tokenData.access_token
    ) {
        throw new Error(
            'TikTok token refresh response did not contain an access_token.'
        );
    }

    if (
        !tokenData.expires_in
    ) {
        throw new Error(
            'TikTok token refresh response did not contain expires_in.'
        );
    }

    /*
     * TikTok's refresh response should
     * contain a refresh token.
     *
     * We validate it here rather than
     * accidentally overwriting a valid
     * stored refresh token with undefined.
     */
    if (
        !tokenData.refresh_token
    ) {
        throw new Error(
            'TikTok token refresh response did not contain a refresh_token.'
        );
    }

    if (
        !tokenData.refresh_expires_in
    ) {
        throw new Error(
            'TikTok token refresh response did not contain refresh_expires_in.'
        );
    }

    return tokenData;
}


/*
====================================
REFRESH ACCESS TOKEN
====================================
*/

async function refreshAccessToken({

    accountIdentifier,
    refreshToken

}) {

    const {
        clientKey,
        clientSecret
    } =
        getTikTokConfiguration();


    if (
        !accountIdentifier
    ) {
        throw new Error(
            'TikTok accountIdentifier is required for token refresh.'
        );
    }

    if (
        !refreshToken
    ) {
        throw new Error(
            `TikTok refresh token is missing for account ${accountIdentifier}.`
        );
    }

    /*
     * TikTok requires
     * application/x-www-form-urlencoded
     * for OAuth token management.
     */
    const body =
        new URLSearchParams({

            client_key:
                clientKey,

            client_secret:
                clientSecret,

            grant_type:
                'refresh_token',

            refresh_token:
                refreshToken

        });

    const controller =
        new AbortController();

    const timeout =
        setTimeout(

            () => {

                controller.abort();

            },

            REQUEST_TIMEOUT_MS

        );

    let response;

    try {

        response =
            await fetch(

                TIKTOK_TOKEN_URL,

                {

                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/x-www-form-urlencoded',

                        'Cache-Control':
                            'no-cache'

                    },

                    body,

                    signal:
                        controller.signal

                }
            );
    }

    catch (
        error
    ) {

        if (
            error.name ===
            'AbortError'
        ) {

            throw new Error(
                `TikTok token refresh request timed out after ${REQUEST_TIMEOUT_MS}ms for account ${accountIdentifier}.`
            );
        }

        throw new Error(
            `TikTok token refresh request failed for account ${accountIdentifier}: ${error.message}`
        );
    }

    finally {

        clearTimeout(
            timeout
        );
    }

    /*
     * TikTok returns a JSON response for
     * both successful and failed OAuth
     * requests.
     */
    let tokenData;

    try {

        tokenData =
            await response.json();

    }

    catch (
        error
    ) {
        throw new Error(
            `TikTok token refresh returned an unreadable response for account ${accountIdentifier}. HTTP ${response.status}.`
        );
    }

    /*
     * Validate the JSON body first because
     * TikTok's OAuth errors contain useful
     * error codes and log IDs.
     */
    try {

        validateTokenResponse(
            tokenData
        );
    }

    catch (
        error
    ) {

        /*
         * If TikTok returned an HTTP failure
         * without its normal OAuth error
         * structure, preserve the HTTP status.
         */
        if (
            !error.tiktokError
            &&
            !response.ok
        ) {
            error.message =
                `TikTok token refresh failed with HTTP ${response.status} for account ${accountIdentifier}: ${error.message}`;
        }

        throw error;
    }

    /*
     * The HTTP status should also be
     * successful.
     */
    if (
        !response.ok
    ) {
        throw new Error(
            `TikTok token refresh returned HTTP ${response.status} for account ${accountIdentifier}.`
        );
    }

    /*
     * TikTok may rotate the refresh token.
     *
     * The response token MUST therefore be
     * persisted instead of assuming the old
     * refresh token remains valid.
     */
    const accessTokenExpiresAt =
        calculateExpiration(
            tokenData.expires_in
        );

    const refreshTokenExpiresAt =
        calculateExpiration(
            tokenData.refresh_expires_in
        );

    return {

        accountIdentifier,

        accessToken:
            tokenData.access_token,

        refreshToken:
            tokenData.refresh_token,

        accessTokenExpiresAt,

        refreshTokenExpiresAt,

        scope:
            tokenData.scope
            ??
            null,

        tokenType:
            tokenData.token_type
            ??
            'Bearer',

        openId:
            tokenData.open_id
            ??
            null

    };
}


/*
====================================
INITIALIZE
====================================
*/

/**
 * Initializes TikTok subscription state
 * for a Content Creator.
 *
 * The TikTok authorization already exists
 * before the Content Creator record is
 * finalized.
 *
 * Therefore the existing access-token
 * expiration becomes the platform's
 * subscriptionExpiresAt value.
 */
async function initialize({

    accountIdentifier

}) {

    if (
        !accountIdentifier
    ) {
        throw new Error(
            'TikTok accountIdentifier is required.'
        );
    }

    const authorization =
        await getTikTokAuthorization(
            accountIdentifier
        );

    if (
        !authorization
    ) {
        throw new Error(
            `TikTok authorization not found for account ${accountIdentifier}.`
        );
    }

    if (
        authorization.authorization_status !==
        'active'
    ) {
        throw new Error(
            `TikTok authorization is not active for account ${accountIdentifier}.`
        );
    }

    if (
        !authorization.access_token_expires_at
    ) {
        throw new Error(
            `TikTok access token expiration is missing for account ${accountIdentifier}.`
        );
    }

    logFeature({

        category:
            'CONTENT_CREATORS',

        message:
            'TikTok authorization initialized.',

        details: {

            accountIdentifier,

            accessTokenExpiresAt:
                authorization.access_token_expires_at

        }
    });

    return {

        accountIdentifier,

        /*
         * IMPORTANT:
         *
         * For TikTok this field represents
         * OAuth access-token expiration.
         *
         * The generic Content Creator system
         * calls this subscriptionExpiresAt
         * because the database field is
         * platform agnostic.
         */
        subscriptionExpiresAt:
            authorization.access_token_expires_at

    };
}


/*
====================================
SUBSCRIBE / REFRESH
====================================
*/

/**
 * Performs one TikTok authorization
 * maintenance operation.
 *
 * The centralized subscription-service
 * is responsible for retrying failed
 * subscription operations for ALL
 * supported platforms.
 */
async function subscribe({

    accountIdentifier

}) {

    if (
        !accountIdentifier
    ) {
        throw new Error(
            'TikTok accountIdentifier is required.'
        );
    }

    /*
     * Retrieve the currently stored
     * authorization.
     */
    const authorization =
        await getTikTokAuthorization(
            accountIdentifier
        );

    if (
        !authorization
    ) {
        throw new Error(
            `TikTok authorization not found for account ${accountIdentifier}.`
        );
    }

    if (
        authorization.authorization_status !==
        'active'
    ) {
        throw new Error(
            `TikTok authorization is not active for account ${accountIdentifier}.`
        );
    }

    if (
        !authorization.refresh_token
    ) {
        throw new Error(
            `TikTok refresh token is missing for account ${accountIdentifier}.`
        );
    }

    /*
     * Perform exactly ONE TikTok refresh
     * attempt.
     */
    const refreshed =
        await refreshAccessToken({

            accountIdentifier,

            refreshToken:
                authorization.refresh_token

        });

    /*
     * TikTok can rotate the refresh token.
     *
     * Persist EVERYTHING returned by
     * TikTok immediately after a successful
     * refresh.
     */
    const updatedAuthorization =
        await updateTikTokAuthorizationTokens({

            accountIdentifier,

            accessToken:
                refreshed.accessToken,

            refreshToken:
                refreshed.refreshToken,

            accessTokenExpiresAt:
                refreshed.accessTokenExpiresAt,

            refreshTokenExpiresAt:
                refreshed.refreshTokenExpiresAt,

            scope:
                refreshed.scope,

            tokenType:
                refreshed.tokenType

        });

    /*
     * Verify the account identity returned
     * by TikTok when it is available.
     *
     * This protects us from accidentally
     * associating a token response with the
     * wrong authorization record.
     */
    if (
        refreshed.openId
        &&
        refreshed.openId !==
        accountIdentifier
    ) {

        const error =
            new Error(
                `TikTok returned an unexpected open_id during token refresh for account ${accountIdentifier}.`
            );

        error.expectedOpenId =
            accountIdentifier;

        error.receivedOpenId =
            refreshed.openId;

        throw error;
    }

    logFeature({

        category:
            'CONTENT_CREATORS',

        message:
            'TikTok access token refreshed successfully.',

        details: {

            accountIdentifier,

            accessTokenExpiresAt:
                refreshed.accessTokenExpiresAt,

            refreshTokenExpiresAt:
                refreshed.refreshTokenExpiresAt,

            scope:
                refreshed.scope,

            tokenType:
                refreshed.tokenType,

            refreshTokenRotated:
                refreshed.refreshToken !==
                authorization.refresh_token

        }
    });


    /*
     * Return the common subscription
     * contract expected by
     * subscription-service.js.
     *
     * For TikTok:
     *
     * subscriptionExpiresAt
     * =
     * accessTokenExpiresAt
     */
    return {

        accountIdentifier,

        subscriptionExpiresAt:
            refreshed.accessTokenExpiresAt,

        platformData: {

            accessTokenExpiresAt:
                refreshed.accessTokenExpiresAt,

            refreshTokenExpiresAt:
                refreshed.refreshTokenExpiresAt,

            scope:
                refreshed.scope,

            tokenType:
                refreshed.tokenType,

            authorizationId:
                updatedAuthorization.id

        }
    };
}


/*
====================================
EXPORTS
====================================
*/
module.exports = {
    initialize,
    subscribe
};
