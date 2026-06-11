/**
 * Title: bonk-repository.js
 * Author: Tango Hunter
 * Date Created: 6/11/26
 * Description:  Records and retrieves bonks.
 */

const pool =  require('./postgres');


async function recordBonk({

    guildId,

    userId,

    username,

    received = false,

    given = false
}) {

    await pool.query(

        `
        INSERT INTO bonk_counts (

            guild_id,

            user_id,

            username,

            received_count,

            given_count,

            updated_at
        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            NOW()
        )

        ON CONFLICT (

            guild_id,

            user_id
        )

        DO UPDATE

        SET

            username =
                EXCLUDED.username,

            received_count =
                bonk_counts.received_count
                +
                EXCLUDED.received_count,

            given_count =
                bonk_counts.given_count
                +
                EXCLUDED.given_count,

            updated_at =
                NOW()
        `,
        [

            guildId,

            userId,

            username,

            received ? 1 : 0,

            given ? 1 : 0
        ]
    );
}

async function getBonkCount({

    guildId,

    userId
}) {

    const result =
        await pool.query(

            `
            SELECT received_count

            FROM bonk_counts

            WHERE guild_id = $1

            AND user_id = $2
            `,
            [

                guildId,

                userId
            ]
        );

    if (
        result.rows.length === 0
    ) {

        return 0;
    }

    return result.rows[0]
        .received_count;
}

module.exports = {
    recordBonk,
    getBonkCount
};
