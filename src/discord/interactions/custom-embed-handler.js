/**
 * Title: custom-embed-handler.js
 * Author: Tango Hunter
 * Date Created: 6/15/26
 * Description: Custom embed interactions.
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const {
    logFeature
} = require('../../core/logging/logger');


const embedDrafts = new Map();


async function handleCustomEmbedInteraction(
    interaction
) {

    /*
    ============================
    CREATE BUTTON
    ============================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===
        'custom_embed_create'

    ) {

        const modal =

            new ModalBuilder()

                .setCustomId(
                    'custom_embed_modal'
                )

                .setTitle(
                    'Create Custom Embed'
                )

                .addComponents(

                    new ActionRowBuilder()

                        .addComponents(

                            new TextInputBuilder()

                                .setCustomId(
                                    'title'
                                )

                                .setLabel(
                                    'Title'
                                )

                                .setMaxLength(
                                    200
                                )

                                .setRequired(
                                    true
                                )

                                .setStyle(
                                    TextInputStyle.Short
                                )
                        ),

                    new ActionRowBuilder()

                        .addComponents(

                            new TextInputBuilder()

                                .setCustomId(
                                    'body'
                                )

                                .setLabel(
                                    'Body'
                                )

                                .setMaxLength(
                                    3000
                                )

                                .setRequired(
                                    true
                                )

                                .setStyle(
                                    TextInputStyle.Paragraph
                                )
                        ),

                    new ActionRowBuilder()

                        .addComponents(

                            new TextInputBuilder()

                                .setCustomId(
                                    'footer'
                                )

                                .setLabel(
                                    'Footer'
                                )

                                .setMaxLength(
                                    500
                                )

                                .setRequired(
                                    false
                                )

                                .setStyle(
                                    TextInputStyle.Short
                                )
                        )
                );

        await interaction.showModal(
            modal
        );

        return;
    }

    /*
    ============================
    MODAL SUBMIT
    ============================
    */

    if (

        interaction.isModalSubmit()

        &&

        interaction.customId ===
        'custom_embed_modal'

    ) {

        const draft = {

            title:

                interaction.fields.getTextInputValue(
                    'title'
                ),

            body:

                interaction.fields.getTextInputValue(
                    'body'
                ),

            footer:

                interaction.fields.getTextInputValue(
                    'footer'
                ),

            channelId:
                interaction.channel.id
        };

        embedDrafts.set(

            interaction.user.id,

            draft
        );

        const preview =

            new EmbedBuilder()

                .setColor(
                    0x8B5CF6
                )

                .setTitle(
                    draft.title
                )

                .setDescription(
                    draft.body
                )

                .setFooter({

                    text:

`${draft.footer || ''}

SYNARA Announcement on behalf of ${interaction.user.username}`
                });

        const row =

            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'custom_embed_publish'
                        )

                        .setLabel(
                            'Publish'
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'custom_embed_create'
                        )

                        .setLabel(
                            'Edit Draft'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'custom_embed_cancel'
                        )

                        .setLabel(
                            'Cancel'
                        )

                        .setStyle(
                            ButtonStyle.Danger
                        )
                );

        await interaction.reply({

            content:
                'Preview',

            embeds: [
                preview
            ],

            components: [
                row
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
    ============================
    PUBLISH
    ============================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===
        'custom_embed_publish'

    ) {

        const draft =

            embedDrafts.get(
                interaction.user.id
            );

        if (
            !draft
        ) {

            return await interaction.reply({

                content:
                    'Draft not found.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        const embed =

            new EmbedBuilder()

                .setColor(
                    0x8B5CF6
                )

                .setTitle(
                    draft.title
                )

                .setDescription(
                    draft.body
                )

                .setFooter({

                    text:

`${draft.footer || ''}

SYNARA Announcement on behalf of ${interaction.user.username}`
                });

        await interaction.channel.send({

            embeds: [
                embed
            ]
        });

        embedDrafts.delete(
            interaction.user.id
        );

        logFeature({

            category:
                'CUSTOM_EMBED',

            message:
                'Custom embed published',

            details: {

                guildId:
                    interaction.guild.id,

                channelId:
                    interaction.channel.id,

                userId:
                    interaction.user.id,

                title:
                    draft.title
            }
        });

        await interaction.reply({

            content:
                'Embed successfully posted.',

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
    ============================
    CANCEL
    ============================
    */

    if (
        interaction.isButton()

        &&

        interaction.customId ===
        'custom_embed_cancel'

    ) {

        embedDrafts.delete(
            interaction.user.id
        );

        await interaction.reply({

            content:
                'Embed draft cancelled.',

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    return false;
}

module.exports = {
    handleCustomEmbedInteraction
};
