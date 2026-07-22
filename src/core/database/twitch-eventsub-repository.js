/**
 * Title: twitch-eventsub-repository.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Description: EventSub Repository Functions.
 */

const pool
     = require('./postgres');


async function getSubscription({

    twitchUserId,

    subscriptionType

}) {

    const result =

        await pool.query(

            `

            SELECT *

            FROM twitch_eventsub

            WHERE

                twitch_user_id = $1

            AND

                subscription_type = $2

            `,

            [

                twitchUserId,

                subscriptionType

            ]

        );

    return (

        result.rows[0]

        ??

        null

    );
}

async function saveSubscription({

    twitchUserId,

    subscriptionType,

    subscriptionId

}) {

    await pool.query(

        `

        INSERT INTO twitch_eventsub (

            twitch_user_id,

            subscription_type,

            subscription_id,

            last_verified_at

        )

        VALUES (

            $1,

            $2,

            $3,

            NOW()

        )

        ON CONFLICT (

            twitch_user_id,

            subscription_type

        )

        DO UPDATE SET

            subscription_id =

                EXCLUDED.subscription_id,

            updated_at =

                NOW(),

            last_verified_at =

                NOW()

        `,

        [

            twitchUserId,

            subscriptionType,

            subscriptionId

        ]

    );
}

async function touchSubscription({

    twitchUserId,

    subscriptionType

}) {

    await pool.query(

        `

        UPDATE twitch_eventsub

        SET

            updated_at = NOW(),

            last_verified_at = NOW()

        WHERE

            twitch_user_id = $1

        AND

            subscription_type = $2

        `,

        [

            twitchUserId,

            subscriptionType

        ]

    );
}

module.exports = {
    getSubscription,
    saveSubscription,
    touchSubscription
};
