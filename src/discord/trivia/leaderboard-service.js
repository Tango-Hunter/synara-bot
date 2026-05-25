/**
 * Title: leaderboard-service.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Handles persistent scores, current streaks, best streaks, and leaderboard ranking.
 */

const fs = require('fs');

const path = require('path');

const leaderboardPath =
    path.join(
        __dirname,
        '../databases/leaderboard.json'
    );

function loadLeaderboard() {

    if (
        !fs.existsSync(
            leaderboardPath
        )
    ) {

        return {};
    }

    return JSON.parse(

        fs.readFileSync(
            leaderboardPath,
            'utf8'
        )
    );
}

function saveLeaderboard(
    data
) {

    fs.writeFileSync(

        leaderboardPath,

        JSON.stringify(
            data,
            null,
            4
        )
    );
}

function addWin(
    userId
) {

    const leaderboard =
        loadLeaderboard();

    if (
        !leaderboard[userId]
    ) {

        leaderboard[userId] = {

            score: 0,

            streak: 0,

            bestStreak: 0
        };
    }

    leaderboard[userId].score += 1;

    leaderboard[userId].streak += 1;

    if (

        leaderboard[userId].streak >

        leaderboard[userId].bestStreak
    ) {

        leaderboard[userId].bestStreak =

            leaderboard[userId].streak;
    }

    saveLeaderboard(
        leaderboard
    );
}

function breakStreak(
    userId
) {

    const leaderboard =
        loadLeaderboard();

    if (
        !leaderboard[userId]
    ) {

        return;
    }

    leaderboard[userId].streak = 0;

    saveLeaderboard(
        leaderboard
    );
}

function getLeaderboard() {

    const leaderboard =
        loadLeaderboard();

    return Object.entries(
        leaderboard
    )

        .sort(

            (
                a,
                b
            ) =>

                b[1].score -

                a[1].score
        )

        .slice(
            0,
            10
        );
}

function getUserStats(
    userId
) {

    const leaderboard =
        loadLeaderboard();

    return (

        leaderboard[userId]

        ||

        {

            score: 0,

            streak: 0,

            bestStreak: 0
        }
    );
}

module.exports = {
    addWin,
    breakStreak,
    getLeaderboard,
    getUserStats
};
