/**
 * Title: embed.js
 * Author: Tango Hunter
 * Date Created: 6/15/26
 * Description: Custom embed creator.
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');


async function handleEmbedCommand(
    interaction
) {

    const embed =
        new EmbedBuilder()

            .setColor(
                0x8B5CF6
            )

            .setTitle(
                'Custom Embed Creator'
            )

            .setDescription(

`Create a custom SYNARA announcement.

The finished embed will be posted in this channel.

Fields:

• Title (Required)
• Body (Required)
• Footer (Optional)
• Thumbnail URL (Optional)
• Image URL (Optional)

Press **Create Embed** to continue.`
            );

    const row =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        'custom_embed_create'
                    )

                    .setLabel(
                        'Create Embed'
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )
            );

    await interaction.reply({

        embeds: [
            embed
        ],

        components: [
            row
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

module.exports = {
    handleEmbedCommand
};
