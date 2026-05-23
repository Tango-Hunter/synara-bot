/**
 * Title: efficiency-manager.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 * Description: Handles SYNARA efficiency evaluations.
 */

const {
    loadEfficiencyData,
    saveEfficiencyData
} = require('./efficiency-store');

function getEfficiencyScore(
    userId
) {

    const data =
        loadEfficiencyData();

    if (
        !data[userId]
    ) {

        data[userId] = {

            score:
                randomStartingScore(),
            lastUpdated:
                new Date().toISOString()
        };

        saveEfficiencyData(
            data
        );
    }

    return data[userId].score;
}

function adjustEfficiency({

    userId,
    amount
}) {

    const data =
        loadEfficiencyData();

    if (
        !data[userId]
    ) {

        data[userId] = {

            score:
                randomStartingScore(),
            lastUpdated:
                new Date().toISOString()
        };
    }

    let newScore =

        data[userId].score
        +
        amount;

    newScore =
        Math.max(
            0,
            Math.min(
                100,
                newScore
            )
        );

    data[userId].score =
        newScore;

    data[userId].lastUpdated =
        new Date().toISOString();

    saveEfficiencyData(
        data
    );

    return newScore;
}

function randomStartingScore() {

    return Math.floor(
        Math.random() * 41
    ) + 30;
}

module.exports = {
    getEfficiencyScore,
    adjustEfficiency
};
