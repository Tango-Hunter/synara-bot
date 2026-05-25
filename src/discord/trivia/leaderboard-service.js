/**
 * Title: leaderboard-service.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Handles persistent scores, current streaks, best streaks, and leaderboard ranking.
 */

const pool =
    require('../../core/database/postgres');

async function addWin(
    userId
) {

    /*
    ============================
    CREATE USER IF MISSING
    ============================
    */

    await pool.query(

        `
        INSERT INTO trivia_leaderboard (

            user_id,
            score,
            streak,
            best_streak

        )

        VALUES (

            $1,
            0,
            0,
            0
        )

        ON CONFLICT (user_id)

        DO NOTHING
        `,
        [userId]
    );

    /*
    ============================
    UPDATE SCORE/STREAK
    ============================
    */

    await pool.query(

        `
        UPDATE trivia_leaderboard

        SET

            score = score + 1,

            streak = streak + 1,

            best_streak = GREATEST(

                best_streak,
                streak + 1
            )

        WHERE user_id = $1
        `,
        [userId]
    );
}

async function breakStreak(
    userId
) {

    await pool.query(

        `
        UPDATE trivia_leaderboard

        SET streak = 0

        WHERE user_id = $1
        `,
        [userId]
    );
}

async function getLeaderboard() {

    const result =

        await pool.query(

            `
            SELECT

                user_id,
                score,
                streak,
                best_streak

            FROM trivia_leaderboard

            ORDER BY score DESC

            LIMIT 10
            `
        );

    return result.rows;
}

async function getUserStats(
    userId
) {

    const result =

        await pool.query(

            `
            SELECT

                score,
                streak,
                best_streak

            FROM trivia_leaderboard

            WHERE user_id = $1
            `,
            [userId]
        );

    if (
        result.rows.length === 0
    ) {

        return {

            score: 0,

            streak: 0,

            best_streak: 0
        };
    }

    return result.rows[0];
}

module.exports = {
    addWin,
    breakStreak,
    getLeaderboard,
    getUserStats
};
