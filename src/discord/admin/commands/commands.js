/**
 * Title: commands.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 6/11/26
 * Description: Displays available admin slash commands.
 */


const {
    EmbedBuilder
} = require('discord.js');


async function handleAdminCommands(
    interaction
) {

    const embed =
        new EmbedBuilder()

            .setColor(
                0x5865F2
            )

            .setTitle(
                'SYNARA Administration Guide'
            )

            .setDescription(
                'Administrative commands used to configure and manage SYNARA.'
            )

            .addFields(

                {
                    name:
                        '\u200B',

                    value:
                        '\u200B'
                },

                {

                    name:
                        '⚙️ Feature Management',

                    value:
`
/features
View all feature flags and their status.

/feature enable
Enable a feature.

/feature disable
Disable a feature.
`
                },

                {
                    name:
                        '\u200B',

                    value:
                        '\u200B'
                },

                {

                    name:
                        '🏗 Server Configuration',

                    value:
`
/settings
View current server configuration.

/setchannel
Assign the current channel to a SYNARA feature.

/setrole
Add an Admin, Moderator, or Verified role to SYNARA settings.

/removerole
Remove an Admin or Moderator role from SYNARA settings.

/setuser
Set a user/bot account for SYNARA to track.

/ignorechannel add
Ignore the current channel for observations and activity tracking.

/ignorechannel remove
Remove the current channel from ignored channels for observations and activity tracking.
`
                },

                {
                    name:
                        '\u200B',

                    value:
                        '\u200B'
                },

                {

                    name:
                        '🛡 Moderator Applications',

                    value:
`
/modapps open
Open moderator applications.

/modapps close
Close moderator applications.
`
                }

            )

            .setFooter({

                text:
                    'Run commands in the channel you wish to configure whenever applicable.'
            })

            .setTimestamp();

    return await interaction.reply({

        embeds: [
            embed
        ]
    });
}

module.exports = {
    handleAdminCommands
};
