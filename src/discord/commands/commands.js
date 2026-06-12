/**
 * Title: commands.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 6/11/26
 * Description: Displays available user commands.
 */

const {
    buildEmbed
} = require('../services/embed-builder');


async function runCommandsCommand() {

    const embed =
        buildEmbed({

            type:
                'status',

            title:
                'SYNARA Command Directory',

            description:
                'Available user commands and interactions.'

        });

    embed.addFields(

        {

            name:
                '🎲 Fun Commands',

            value:
`
!bonk @user
Bonk another user.

!fact
Receive an interesting fact.

!joke
Request SYNARA's interpretation of humor.

!points
View your efficiency score.

!trivia
Play a round of trivia.

!leaderboard
View trivia rankings and statistics.
`
        },

        {

            name:
                '🔗 Twitch Integration',

            value:
`
!linktwitch
Link your Twitch account.

!mytwitch
View your linked Twitch account.

!unlinktwitch
Remove your Twitch account link.

!twitchstats
View Twitch statistics.
`
        },

        {

            name:
                '🤖 Interacting With SYNARA',

            value:
`
@SYNARA <message>
--- OR ---
Direct Reply to SYNARA
Mention/Reply to SYNARA directly to ask questions, brainstorm ideas, or have a conversation.
SYNARA may also occasionally react to conversations in chat too.
`
        }

    );

    return {
        embed
    };
}

module.exports = {
    runCommandsCommand
};
