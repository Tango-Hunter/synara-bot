/**
 * Title: sticky-handler.js
 * Author: Tango Hunter
 * Date Created: 6/27/26
 * Description: Handles sticky message interactions.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const {
    embedThemes
} = require('../../core/config/embed-themes');

const {
    discordLog
} = require('../../core/logging/discord-logger');

const {
    refreshSticky,
    deleteSticky
} = require('../utils/sticky-manager');


const stickyDrafts = new Map();

/*
====================================
SHOW CREATE MODAL
====================================
*/

async function showStickyCreateModal({

    interaction,

    existingMessage

}) {

    const modal =
        new ModalBuilder()

            .setCustomId(
                'sticky_create_modal'
            )

            .setTitle(
                'Create Sticky Message'
            );

    const bodyInput =
        new TextInputBuilder()

            .setCustomId(
                'body'
            )

            .setLabel(
                'Sticky Message'
            )

            .setStyle(
                TextInputStyle.Paragraph
            )

            .setRequired(
                true
            );

    modal.addComponents(

        new ActionRowBuilder()

            .addComponents(
                bodyInput
            )

    );

    return interaction.showModal(
        modal
    );

}

/*
====================================
DELETE CONFIRMATION
====================================
*/

async function showStickyDeleteConfirmation({

    interaction,

    existingMessage

}) {

    const embed =
        new EmbedBuilder()

            .setColor(
                embedThemes.sticky.color
            )

            .setTitle(
                `${embedThemes.sticky.icon} Delete Sticky Message`
            )

            .setDescription(

                existingMessage.content

            )

            .setFooter({

                text:

                    embedThemes.sticky.footer

            });

    const row =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        'sticky_delete_confirm'
                    )

                    .setLabel(
                        'Delete'
                    )

                    .setStyle(
                        ButtonStyle.Danger
                    ),

                new ButtonBuilder()

                    .setCustomId(
                        'sticky_delete_cancel'
                    )

                    .setLabel(
                        'Cancel'
                    )

                    .setStyle(
                        ButtonStyle.Secondary
                    )

            );

    return interaction.reply({

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

/*
====================================
HANDLE INTERACTION
====================================
*/

async function handleStickyInteraction(

    interaction

) {

    /*
    ====================================
    CREATE MODAL SUBMIT
    ====================================
    */

    if (

        interaction.isModalSubmit()

        &&

        interaction.customId ===

        'sticky_create_modal'

    ) {

        const content =
            interaction.fields.getTextInputValue(
                'body'
            );

        stickyDrafts.set(

            interaction.user.id,

            {

                guild:

                    interaction.guild,

                guildId:

                    interaction.guild.id,

                channel:

                    interaction.channel,

                channelId:
                
                    interaction.channel.id,

                authorId:

                    interaction.user.id,

                content

            }

        );

        const embed =
            new EmbedBuilder()

                .setColor(

                    embedThemes.sticky.color

                )

                .setTitle(

                    `${embedThemes.sticky.icon} Sticky Preview`

                )

                .setDescription(

                    content

                )

                .setFooter({

                    text:

                        embedThemes.sticky.footer

                });

        /*
        Existing sticky warning.
        */

        const warning =
            new EmbedBuilder()

                .setColor(

                    0xF59E0B

                )

                .setTitle(

                    '⚠ Existing Sticky'

                )

                .setDescription(

                    'This channel already has a sticky message configured. Approving will replace the existing sticky.'

                );

        const buttons =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'sticky_approve'
                        )

                        .setLabel(
                            'Approve'
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'sticky_cancel'
                        )

                        .setLabel(
                            'Cancel'
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        )

                );

        const embeds = [

            embed

        ];

        /*
        Check whether this channel already has a sticky.
        */

        if (

            interaction.message?.existingMessage

        ) {

            embeds.unshift(

                warning

            );

        }

        return interaction.reply({

            embeds,

            components: [

                buttons

            ],

            flags:

                MessageFlags.Ephemeral

        });

    }

    /*
    ====================================
    APPROVE BUTTON
    ====================================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===

        'sticky_approve'

    ) {

        const draft =
            stickyDrafts.get(

                interaction.user.id

            );

        if (

            !draft

        ) {

            return interaction.reply({

                content:

                    'The sticky draft no longer exists. Please create it again.',

                flags:

                    MessageFlags.Ephemeral

            });

        }

        await refreshSticky({

            guild:

                draft.guild,

            channel:

                draft.channel,

            content:

                draft.content,

            authorId:

                draft.authorId

        });

        stickyDrafts.delete(

            interaction.user.id

        );

        await discordLog({

            guildId:

                draft.guild,

            title:
                'Sticky Message Created',

            category:

                'Administrative Workflow',
                    
            details:

                `${draft.authorId} created a sticky message for channel: <#${draft.channelId}>`,

            status:
                    
                'INFO'

        });

        return interaction.update({

            content:

                '✅ Sticky message has been created successfully.',

            embeds: [],

            components: []

        });

    }

    /*
    ====================================
    CANCEL BUTTON
    ====================================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===

        'sticky_cancel'

    ) {

        stickyDrafts.delete(

            interaction.user.id

        );

        return interaction.update({

            content:

                'Sticky creation cancelled.',

            embeds: [],

            components: []

        });

    }

    /*
    ====================================
    DELETE CONFIRM
    ====================================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===

        'sticky_delete_confirm'

    ) {

        await deleteSticky({

            guild:

                interaction.guild,

            channel:

                interaction.channel,

            authorId:

                interaction.user.id

        });

        return interaction.update({

            content:

                '✅ Sticky message deleted.',

            embeds: [],

            components: []

        });

    }

    /*
    ====================================
    DELETE CANCEL
    ====================================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===

        'sticky_delete_cancel'

    ) {

        return interaction.update({

            content:

                'Sticky deletion cancelled.',

            embeds: [],

            components: []

        });

    }

    return false;

}

/*
====================================
EXPORTS
====================================
*/

module.exports = {
    handleStickyInteraction,
    showStickyCreateModal,
    showStickyDeleteConfirmation
};
