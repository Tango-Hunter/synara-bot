/**
 * Title: twitch-eventsub-repository.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Date Modified: 5/29/26
 * Description: EventSub .
 */

const pool
     = require('./postgres');


async function getSubscription(
    twitchUserId
) {

    const result =

        await pool.query(

            `
            SELECT *
            FROM twitch_eventsub
            WHERE twitch_user_id = $1
            `,
            [
                twitchUserId
            ]
        );

    return result.rows[0] || null;
}

async function saveSubscription({

    twitchUserId,

    subscriptionId
}) {

    await pool.query(

        `
        INSERT INTO twitch_eventsub (

            twitch_user_id,

            subscription_id

        )

        VALUES (

            $1,

            $2
        )

        ON CONFLICT (
            twitch_user_id
        )

        DO UPDATE SET

            subscription_id =
                EXCLUDED.subscription_id,

            updated_at =
                NOW()
        `,
        [

            twitchUserId,

            subscriptionId
        ]
    );
}

module.exports = {
    getSubscription,
    saveSubscription
};
