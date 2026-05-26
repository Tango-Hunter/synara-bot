/**
 * Title: onboarding-embed.js
 * Author: Tango Hunter
 * Date Created: 5/26/26
 * Date Modified: 5/26/26
 * Description: Manages embed for onboarding.
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');


function buildWelcomeEmbed(
    member
) {

    const embed =
        new EmbedBuilder()

            .setColor(
                0x5865F2
            )

            .setTitle(
                '◉ Welcome to the Server'
            )

            .setDescription(
`
Welcome <@${member.id}>.

Access to the server requires verification.

Press the button below to begin onboarding.
`
            )

            .setFooter({

                text:
                    'SYNARA • Onboarding'
            });

    const buttonRow =

        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(

                        `begin_onboarding_${member.id}`
                    )

                    .setLabel(
                        'Begin Onboarding'
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )
            );

    return {

        embed,

        buttonRow
    };
}

function buildRulesEmbed() {

    const embed =
        new EmbedBuilder()

            .setColor(
                0x7289DA
            )

            .setTitle(
                '⬢ Community Rules'
            )

            .setDescription(
`
• Be respectful to all members
• No spam or flooding
• Use channels appropriately
• Respect privacy
• Follow Discord Terms of Service
• Respect moderator decisions
• No religious arguments/discussions

This community is intended to remain:
welcoming,
creative,
and collaborative.
`
            )

            .setFooter({

                text:
                    'SYNARA • Verification'
            });

    const buttonRow =

        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        'open_verification_modal'
                    )

                    .setLabel(
                        'Acknowledge Rules'
                    )

                    .setStyle(
                        ButtonStyle.Success
                    )
            );

    return {
        embed,
        buttonRow
    };
}

module.exports = {
    buildWelcomeEmbed,
    buildRulesEmbed
};
