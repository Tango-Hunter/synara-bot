/**
 * Title: post-mod-application.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 * Description: Posts the moderator application panel.
 */

const {

    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder

} = require('discord.js');

async function postModApplication(
    channel
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

Applications for moderator positions are currently open.

Please answer carefully and thoughtfully.

⚠ Once submitted, answers cannot be edited.

Application Sections:

🔹 Identity & Availability
🔸 Moderation Philosophy
⚪ Perspective & Judgment

The application consists of 3 short modal forms.

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

    await channel.send({

        embeds: [embed],
        components: [row]
    });
}

module.exports = {
    postModApplication
};
