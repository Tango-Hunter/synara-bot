/**
 * Title: tiktok-authorization-repository.js
 * Author: Tango Hunter
 * Date Created: 8/18/26
 * Description: Repository functions for TikTok OAuth authorization data.
 */

const pool = require('./postgres');


/*
====================================
CREATE TIKTOK AUTHORIZATION
====================================
*/
async function createTikTokAuthorization({

    accountIdentifier,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    scope,
    tokenType = 'Bearer'

}) {

    const result =
        await pool.query(

            `
                INSERT INTO tiktok_authorizations (

                    account_identifier,

                    access_token,

                    refresh_token,

                    access_token_expires_at,

                    refresh_token_expires_at,

                    scope,

                    token_type,

                    authorization_status

                )

                VALUES (

                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    'active'

                )

                ON CONFLICT (

                    account_identifier

                )

                DO UPDATE SET

                    access_token =
                        EXCLUDED.access_token,

                    refresh_token =
                        EXCLUDED.refresh_token,

                    access_token_expires_at =
                        EXCLUDED.access_token_expires_at,

                    refresh_token_expires_at =
                        EXCLUDED.refresh_token_expires_at,

                    scope =
                        EXCLUDED.scope,

                    token_type =
                        EXCLUDED.token_type,

                    authorization_status =
                        'active',

                    updated_at =
                        NOW()

                RETURNING

                    id,

                    account_identifier,

                    access_token_expires_at,

                    refresh_token_expires_at,

                    scope,

                    token_type,

                    authorization_status,

                    created_at,

                    updated_at
            `,

            [

                accountIdentifier,
                accessToken,
                refreshToken,
                accessTokenExpiresAt,
                refreshTokenExpiresAt,
                scope,
                tokenType

            ]
        );

    return result.rows[0];
}


/*
====================================
GET TIKTOK AUTHORIZATION
====================================
*/
async function getTikTokAuthorization(
    accountIdentifier
) {

    const result =
        await pool.query(

            `
                SELECT

                    id,

                    account_identifier,

                    access_token,

                    refresh_token,

                    access_token_expires_at,

                    refresh_token_expires_at,

                    scope,

                    token_type,

                    authorization_status,

                    created_at,

                    updated_at

                FROM tiktok_authorizations

                WHERE account_identifier = $1

                LIMIT 1
            `,

            [
                accountIdentifier
            ]
        );

    return result.rows[0] || null;
}


/*
====================================
ACCESS TOKEN EXPIRATION
====================================
*/
async function isAccessTokenExpired(
    accountIdentifier
) {

    const result =
        await pool.query(

            `
                SELECT

                    access_token_expires_at,

                    authorization_status

                FROM tiktok_authorizations

                WHERE account_identifier = $1

                LIMIT 1
            `,

            [
                accountIdentifier
            ]

        );

    if (
        result.rows.length === 0
    ) {
        return true;
    }

    const authorization =
        result.rows[0];

    if (
        authorization.authorization_status !==
        'active'
    ) {
        return true;
    }

    return (
        new Date(
            authorization.access_token_expires_at
        ).getTime()
        <=
        Date.now()
    );
}


/*
====================================
UPDATE AUTHORIZATION TOKENS
====================================
*/
async function updateTikTokAuthorizationTokens({

    accountIdentifier,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    scope,
    tokenType

}) {

    const result =
        await pool.query(

            `
                UPDATE tiktok_authorizations

                SET

                    access_token =
                        $1,

                    refresh_token =
                        $2,

                    access_token_expires_at =
                        $3,

                    refresh_token_expires_at =
                        $4,

                    scope =
                        COALESCE($5, scope),

                    token_type =
                        COALESCE($6, token_type),

                    authorization_status =
                        'active',

                    updated_at =
                        NOW()

                WHERE account_identifier = $7

                RETURNING

                    id,

                    account_identifier,

                    access_token_expires_at,

                    refresh_token_expires_at,

                    scope,

                    token_type,

                    authorization_status,

                    created_at,

                    updated_at
            `,

            [

                accessToken,
                refreshToken,
                accessTokenExpiresAt,
                refreshTokenExpiresAt,
                scope || null,
                tokenType || null,
                accountIdentifier

            ]
        );

    if (
        result.rows.length === 0
    ) {
        throw new Error(
            `TikTok authorization not found for account identifier: ${accountIdentifier}`
        );
    }

    return result.rows[0];
}


module.exports = {
    createTikTokAuthorization,
    getTikTokAuthorization,
    isAccessTokenExpired,
    updateTikTokAuthorizationTokens
};
