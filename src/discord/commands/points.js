/**
 * Title: points.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 * Description: Returns SYNARA efficiency assessment.
 */

const {
    getEfficiencyScore
} = require('../../core/efficiency/efficiency-manager');

async function runPointsCommand({
    username,
    userId
}) {

    const score =
        getEfficiencyScore(
            userId
        );

    return `Current efficiency assessment for ${username}: ${score}%`;
}

module.exports = {
    runPointsCommand
};
