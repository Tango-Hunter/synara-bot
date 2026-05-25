/**
 * Title: leaderboard.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Prompt for the !leaderboard command.
 */

const {
    buildEmbed
} = require('../services/embed-builder');

const {
    getLeaderboard,
    getUserStats
} = require('../trivia/leaderboard-service');

async function handleLeaderboardCommand({

    userId
}) {

    const leaderboard =
        await getLeaderboard();

    const userStats =
        await getUserStats(

            userId
        );

    const leaderboardText =

        leaderboard.length === 0

            ?

            'No trivia scores recorded yet.'

            :

            leaderboard

                .map(
                    (
                        entry,
                        index
                    ) => {

                        return `${

                            index + 1

                        }. <@${entry.user_id}> — ${

                            entry.score

                        } points`;
                    }
                )

                .join(
                    '\n'
                );

    const embed =
        buildEmbed({

            type:
                'status',

            title:
                'Trivia Leaderboard',

            description:
`
${leaderboardText}

Your Current Streak:
${userStats.streak}

Your Best Streak:
${userStats.bestStreak}
`
        });

        return {
            embed
        };
}

module.exports = {
    name:
        'leaderboard',
    execute:
        handleLeaderboardCommand
};
