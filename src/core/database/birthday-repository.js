/**
 * Title: birthday-repository.js
 * Author: Tango Hunter
 * Date Created: 6/17/26
 * Description:  Records and retrieves birthdays.
 */

const pool = require('./postgres');


async function getBirthday({

    guildId,

    userId
}) {

    const result =

        await pool.query(

            `
            SELECT
                month,
                day
            FROM birthdays
            WHERE guild_id = $1
            AND user_id = $2
            `,

            [
                guildId,
                userId
            ]
        );

    return result.rows[0] || null;
}

async function updateBirthday({

    guildId,

    userId,

    month,

    day
}) {

    await pool.query(

        `
        INSERT INTO birthdays (

            guild_id,
            user_id,
            month,
            day

        )

        VALUES (

            $1,
            $2,
            $3,
            $4
        )

        ON CONFLICT (

            guild_id,
            user_id

        )

        DO UPDATE SET

            month = EXCLUDED.month,
            day = EXCLUDED.day,
            updated_at = NOW()
        `,

        [
            guildId,
            userId,
            month,
            day
        ]
    );
}

async function getUpcomingBirthdays({

    guildId,

    startMonth,

    endMonth
}) {

    const result =

        await pool.query(

            `
            SELECT
                user_id,
                month,
                day
            FROM birthdays
            WHERE guild_id = $1
            ORDER BY month, day
            `,

            [
                guildId
            ]
        );

    return result.rows;
}

async function getBirthdaysForDate({

    guildId,

    month,

    day
}) {

    const result =

        await pool.query(

            `
            SELECT
                user_id
            FROM birthdays
            WHERE guild_id = $1
            AND month = $2
            AND day = $3
            `,

            [
                guildId,
                month,
                day
            ]
        );

    return result.rows;
}

module.exports = {
    getBirthday,
    updateBirthday,
    getUpcomingBirthdays,
    getBirthdaysForDate
};
