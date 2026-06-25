/**
 * Title: nicknames-repository.js
 * Author: Tango Hunter
 * Date Created: 6/25/26
 * Description: Stores preferred user nicknames.
 */

const pool = require('./postgres');


/*
====================================
GET
====================================
*/
async function getNickname(
    userId
) {

    const result =

        await pool.query(

            `
            SELECT nickname

            FROM nicknames

            WHERE user_id = $1
            `,

            [
                userId
            ]
        );

    return result.rows[0]?.nickname ?? null;
}

/*
====================================
SET
====================================
*/
async function setNickname({
    userId,
    nickname
}) {

    await pool.query(

        `
        INSERT INTO nicknames (

            user_id,

            nickname

        )

        VALUES (

            $1,

            $2
        )

        ON CONFLICT (

            user_id

        )

        DO UPDATE

        SET

            nickname = EXCLUDED.nickname,

            updated_at = NOW()
        `,

        [

            userId,

            nickname
        ]
    );
}

/*
====================================
DELETE
====================================
*/
async function deleteNickname(
    userId
) {

    await pool.query(

        `
        DELETE FROM
            nicknames

        WHERE user_id = $1
        `,

        [
            userId
        ]
    );
}

module.exports = {
    getNickname,
    setNickname,
    deleteNickname
};
