/**
 * Title: activity-repository.js
 * Author: Tango Hunter
 * Date Created: 6/1/26
 * Date Modified: 6/1/26
 * Description:  Records and retrieves who is active/inactive.
 */

const pool = require('./postgres');


async function recordActivity(
    discordUserId
) {

    await pool.query(

        `
        INSERT INTO community_activity (

            discord_user_id,

            last_activity_at,

            message_count,

            is_inactive

        )

        VALUES (

            $1,

            NOW(),

            1,

            FALSE
        )

        ON CONFLICT (
            discord_user_id
        )

        DO UPDATE SET

            last_activity_at = NOW(),

            message_count =
                community_activity.message_count + 1,

            is_inactive = FALSE,

            updated_at = NOW()
        `,
        [
            discordUserId
        ]
    );
}

async function getInactiveUsers() {

    const result =

        await pool.query(

            `
            SELECT *

            FROM community_activity

            WHERE

                last_activity_at

                < NOW() - INTERVAL '30 days'
            `
        );

    return result.rows;
}

module.exports = {
    recordActivity,
    getInactiveUsers
};
