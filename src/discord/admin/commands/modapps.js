/**
 * Title: modapps.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/24/26
 * Description: Opens/closes moderator applications.
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const APPLICATION_CHANNEL_ID = '1504828980161810442';

const APPLICATION_MESSAGE_ID = '1507825511676641372';

const VOID_SOLDIERS_ROLE_ID = '1431758489784684693';

async function handleModAppsCommand(
    interaction
) {

    const subcommand =
        interaction.options.getSubcommand();

    const channel =
        await interaction.client.channels.fetch(
            APPLICATION_CHANNEL_ID
        );

    const message =
        await channel.messages.fetch(
            APPLICATION_MESSAGE_ID
        );

    /*
    ============================
    OPEN APPLICATIONS
    ============================
    */

    if (
        subcommand === 'open'
    ) {

        const embed =
            new EmbedBuilder()

                .setColor(
                    0x5865F2
                )

                .setTitle(
                    'Void Army Moderator Applications'
                )

                .setDescription(`

Moderator applications are currently OPEN.

Please answer carefully and thoughtfully.

⚠ Once submitted, responses cannot be edited.

Application Sections:

🔹 Identity & Availability
🔸 Moderation Philosophy
⚪ Perspective & Judgment

Press the button below to begin.
`)

                .setFooter({

                    text:
                        'SYNARA • Moderator Recruitment'
                })

                .setTimestamp();

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'start_mod_application'
                        )
                        .setLabel(
                            'Apply'
                        )
                        .setStyle(
                            ButtonStyle.Primary
                        )
                );

        await message.edit({

            embeds: [embed],
            components: [row]
        });

        await channel.send({

            content:
                `<@&${VOID_SOLDIERS_ROLE_ID}> Moderator applications are now OPEN.`
        });

        return await interaction.reply({

            content:
                'Moderator applications opened successfully.',
            ephemeral:
                true
        });
    }

    /*
    ============================
    CLOSE APPLICATIONS
    ============================
    */

    if (
        subcommand === 'close'
    ) {

        const embed =
            new EmbedBuilder()

                .setColor(
                    0x2F3136
                )

                .setTitle(
                    'Void Army Moderator Applications'
                )

                .setDescription(`

Moderator applications are currently CLOSED.

Applications are not being accepted at this time.

Please monitor future announcements for reopening information.
`)

                .setFooter({

                    text:
                        'SYNARA • Moderator Recruitment'
                })

                .setTimestamp();

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'applications_closed'
                        )
                        .setLabel(
                            'Applications Closed'
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                        .setDisabled(
                            true
                        )
                );

        await message.edit({

            embeds: [embed],
            components: [row]
        });

        return await interaction.reply({

            content:
                'Moderator applications closed successfully.',
            ephemeral:
                true
        });
    }
}

module.exports = {
    handleModAppsCommand
};
