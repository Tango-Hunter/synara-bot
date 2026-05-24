/**
 * Title: commands.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/24/26
 * Description: Displays available admin slash commands.
 */

async function handleAdminCommands(
    interaction
) {

    return await interaction.reply({

        content:
`
Available Administrative Commands:

/modapps open
Open moderator applications.

/modapps close
Close moderator applications.

/commands
Display available administrative commands.
`,

        ephemeral:
            true
    });
}

module.exports = {
    handleAdminCommands
};
