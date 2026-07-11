/**
 * Title: twitch-repository.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Date Modified: 5/29/26
 * Description: CRUD operations for Discord-Twitch Linking.
 */

const pool
    = require('./postgres');

async function getTwitchUserByDiscordId(
    discordUserId
) {

    const result =

        await pool.query(

            `
            SELECT *
            FROM twitch_users
            WHERE discord_user_id = $1
            `,
            [
                discordUserId
            ]
        );

    return result.rows[0] || null;
}

async function upsertTwitchUser({

    discordUserId,

    discordName,

    guildId,

    twitchUserId,

    twitchLogin,

    twitchDisplayName,

    twitchProfileImageUrl
}) {

    await pool.query(

        `
        INSERT INTO twitch_users (

            discord_user_id,
            discord_name,
            guild_ids,

            twitch_user_id,
            twitch_login,
            twitch_display_name,
            twitch_profile_image_url,

            notifications_enabled,

            last_verified_at,

            created_at,
            updated_at

        )

        VALUES (

            $1,
            $2,
            ARRAY[$3],

            $4,
            $5,
            $6,
            $7,

            TRUE,

            NOW(),

            NOW(),
            NOW()
        )

        ON CONFLICT (
            discord_user_id
        )

        DO UPDATE SET

            discord_name =
                EXCLUDED.discord_name,

            guild_ids =

                CASE

                    WHEN NOT (
                        $3 = ANY (
                            twitch_users.guild_ids
                        )
                    )

                    THEN

                        array_append(

                            twitch_users.guild_ids,

                            $3
                        )

                    ELSE

                        twitch_users.guild_ids

                END,

            twitch_user_id =
                EXCLUDED.twitch_user_id,

            twitch_login =
                EXCLUDED.twitch_login,

            twitch_display_name =
                EXCLUDED.twitch_display_name,

            twitch_profile_image_url =
                EXCLUDED.twitch_profile_image_url,

            notifications_enabled =
                TRUE,

            last_verified_at =
                NOW(),

            updated_at =
                NOW()
        `,
        [

            discordUserId,
            discordName,
            guildId,

            twitchUserId,
            twitchLogin,
            twitchDisplayName,
            twitchProfileImageUrl
        ]
    );
}

async function disableNotifications(
    discordUserId
) {

    await pool.query(

        `
        UPDATE twitch_users

        SET

            notifications_enabled = FALSE,

            updated_at = NOW()

        WHERE

            discord_user_id = $1
        `,
        [
            discordUserId
        ]
    );
}

async function getEnabledUsersByTwitchUserId(
    twitchUserId
) {

    const result =

        await pool.query(

            `
            SELECT *
            FROM twitch_users

            WHERE

                twitch_user_id = $1

            AND

                notifications_enabled = TRUE
            `,
            [
                twitchUserId
            ]
        );

    return result.rows;
}

/*
====================================
REMOVE GUILD
====================================
*/

async function removeGuildTwitchAlerts(
    guildId
) {

    /*
    ====================================
    REMOVE GUILD FROM ALL ARRAYS
    ====================================
    */

    await pool.query(

        `
        UPDATE twitch_users

        SET

            guild_ids = array_remove(

                guild_ids,

                $1

            ),

            updated_at = NOW()

        WHERE

            $1 = ANY(

                guild_ids

            )
        `,

        [
            guildId
        ]
    );

    /*
    ====================================
    REMOVE ORPHANED RECORDS
    ====================================
    */

    await pool.query(

        `
        DELETE FROM twitch_users

        WHERE cardinality(

            guild_ids

        ) = 0
        `
    );

}

module.exports = {
    getEnabledUsersByTwitchUserId,
    getTwitchUserByDiscordId,
    upsertTwitchUser,
    disableNotifications,
    removeGuildTwitchAlerts
};
