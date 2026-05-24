/**
 * Title: fact.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/19/26
 * Description: Prompt for the !commands command.
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
                'Available Commands',

            description:
`
!commands
Display available SYNARA commands.

!fact
Get a neat fact.

!joke
SYNARA's version of humor.

!motivate
Motivational Message.

!observe
SYNARA's current observations of chat.

!points
View your current efficiency assessment.

!status
View current SYNARA system status.


`
        });

    return {
        embed
    };
}

module.exports = {
    runCommandsCommand
};
