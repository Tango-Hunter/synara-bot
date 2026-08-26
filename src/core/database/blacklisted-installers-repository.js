/**
 * Title: blacklisted-installers-repository.js
 * Author: Tango Hunter
 * Date Created: 8/25/26
 * Description: Repository functions for managing blacklisted Discord users and guilds.
 */

const pool = require('./postgres');


/*
====================================
GET BLACKLISTED ENTRIES
====================================
*/

async function getBlacklistedEntries() {

    const result =
        await pool.query(`

            SELECT
                id,
                type,
                name,
                discord_id,
                reason,
                created_at

            FROM blacklisted_installers

            ORDER BY
                created_at DESC

        `);


    return result.rows;
}


/*
====================================
CHECK USER BLACKLIST
====================================
*/
async function isUserBlacklisted(
    discordId
) {

    if (
        !discordId
    ) {
        return false;
    }

    const result =
        await pool.query(

            `

                SELECT
                    1

                FROM blacklisted_installers

                WHERE
                    type = 'user'

                    AND

                    discord_id = $1

                LIMIT 1

            `,

            [
                discordId
            ]
        );

    return (
        result.rowCount >
        0
    );
}


/*
====================================
CHECK GUILD BLACKLIST
====================================
*/
async function isGuildBlacklisted(
    discordId
) {

    if (
        !discordId
    ) {
        return false;
    }

    const result =
        await pool.query(

            `

                SELECT
                    1

                FROM blacklisted_installers

                WHERE
                    type = 'guild'

                    AND

                    discord_id = $1

                LIMIT 1

            `,

            [
                discordId
            ]
        );

    return (
        result.rowCount >
        0
    );
}


/*
====================================
CREATE BLACKLIST ENTRY
====================================
*/

async function createBlacklistEntry({

    type,

    name,

    discordId,

    reason = null

}) {

    if (
        type !== 'user'
        &&
        type !== 'guild'
    ) {
        throw new Error(
            `Invalid blacklist type: ${type}`
        );
    }

    if (
        !discordId
    ) {
        throw new Error(
            'A Discord ID is required to create a blacklist entry.'
        );
    }

    if (
        !name
    ) {
        throw new Error(
            'A name is required to create a blacklist entry.'
        );
    }

    const result =
        await pool.query(

            `

                INSERT INTO
                    blacklisted_installers (

                        type,

                        name,

                        discord_id,

                        reason

                    )

                VALUES (

                    $1,

                    $2,

                    $3,

                    $4

                )

                ON CONFLICT (
                    type,
                    discord_id
                )

                DO NOTHING

                RETURNING
                    id,
                    type,
                    name,
                    discord_id,
                    reason,
                    created_at

            `,

            [

                type,

                name,

                discordId,

                reason

            ]
        );

    /*
    ====================================
    ENTRY ALREADY EXISTS
    ====================================
    */
    if (
        result.rowCount ===
        0
    ) {
        return null;
    }

    return result.rows[0];
}


/*
====================================
REMOVE BLACKLIST ENTRY
====================================
*/

async function removeBlacklistEntry({

    type,

    discordId

}) {

    if (
        type !== 'user'
        &&
        type !== 'guild'
    ) {
        throw new Error(
            `Invalid blacklist type: ${type}`
        );
    }

    if (
        !discordId
    ) {
        throw new Error(
            'A Discord ID is required to remove a blacklist entry.'
        );
    }

    const result =
        await pool.query(

            `

                DELETE FROM
                    blacklisted_installers

                WHERE

                    type = $1

                    AND

                    discord_id = $2

                RETURNING
                    id,
                    type,
                    name,
                    discord_id,
                    reason,
                    created_at

            `,

            [

                type,

                discordId

            ]
        );

    if (
        result.rowCount ===
        0
    ) {
        return null;
    }

    return result.rows[0];
}


/*
====================================
EXPORTS
====================================
*/

module.exports = {
    getBlacklistedEntries,
    isUserBlacklisted,
    isGuildBlacklisted,
    createBlacklistEntry,
    removeBlacklistEntry
};
