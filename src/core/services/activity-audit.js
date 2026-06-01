/**
 * Title: activity-audit.js
 * Author: Tango Hunter
 * Date Created: 6/1/26
 * Date Modified: 6/1/26
 * Description: Audits recent activity in server and updates notifications for live-alerts.
 */

const pool = require('../database/postgres');

async function runActivityAudit() {

    //
    // Mark inactive users
    //
    await pool.query(`

        UPDATE community_activity

        SET

            is_inactive = TRUE,

            updated_at = NOW()

        WHERE

            last_activity_at
            < NOW() - INTERVAL '30 days'
    `);

    //
    // Mark active users
    //
    await pool.query(`

        UPDATE community_activity

        SET

            is_inactive = FALSE,

            updated_at = NOW()

        WHERE

            last_activity_at
            >= NOW() - INTERVAL '30 days'
    `);

    //
    // Disable Twitch notifications
    //
    await pool.query(`

        UPDATE twitch_users

        SET

            notifications_enabled = FALSE

        WHERE

            discord_user_id IN (

                SELECT

                    discord_user_id

                FROM

                    community_activity

                WHERE

                    is_inactive = TRUE
            )
    `);

    //
    // Enable Twitch notifications
    //
    await pool.query(`

        UPDATE twitch_users

        SET

            notifications_enabled = TRUE

        WHERE

            discord_user_id IN (

                SELECT

                    discord_user_id

                FROM

                    community_activity

                WHERE

                    is_inactive = FALSE
            )
    `);

    //
    // Debug Output
    //
    const activityResult = await pool.query(`

        SELECT

            discord_user_id,
            last_activity_at,
            is_inactive

        FROM community_activity
    `);

    console.log(
        '[ACTIVITY AUDIT USERS]',
        activityResult.rows
    );

    const twitchResult = await pool.query(`

        SELECT

            discord_user_id,
            notifications_enabled

        FROM twitch_users
    `);

    console.log(
        '[TWITCH STATUS]',
        twitchResult.rows
    );
}

module.exports = {
    runActivityAudit
};
