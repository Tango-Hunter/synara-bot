/**
 * Title: event-handler.js
 * Author: Tango Hunter
 * Date Created: 6/21/26
 * Description: Scheduled event interactions.
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    generateEventId
} = require('../utils/event-id');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    createScheduledEvent
} = require('../../core/database/scheduled-events-repository');

const eventDrafts = new Map();


/*
====================================
OPEN MODAL
====================================
*/
async function showScheduledEventModal(
    interaction
) {

    const modal =
        new ModalBuilder()

            .setCustomId(
                'scheduled_event_modal'
            )

            .setTitle(
                'Create Scheduled Event'
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
                                'description'
                            )

                            .setLabel(
                                'Description'
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
                                'date'
                            )

                            .setLabel(
                                'Date (MM/DD/YYYY)'
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
                                'time'
                            )

                            .setLabel(
                                'Time (HH:MM 24h)'
                            )

                            .setRequired(
                                true
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )
                    )
            );

    await interaction.showModal(
        modal
    );
}

async function handleEventInteraction(
    interaction
) {

    /*
    ============================
    OPEN MODAL
    ============================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===
        'scheduled_event_create'

    ) {

        await showScheduledEventModal(
            interaction
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
        'scheduled_event_modal'

    ) {

        eventDrafts.set(

            interaction.user.id,

            {

                title:

                    interaction.fields.getTextInputValue(
                        'title'
                    ),

                description:

                    interaction.fields.getTextInputValue(
                        'description'
                    ),

                date:

                    interaction.fields.getTextInputValue(
                        'date'
                    ),

                time:

                    interaction.fields.getTextInputValue(
                        'time'
                    )
            }
        );

        const recurrenceMenu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    'scheduled_event_recurrence'
                )

                .setPlaceholder(
                    'Select Recurrence'
                )

                .addOptions(

                    {

                        label:
                            'One Time',

                        value:
                            'NONE'
                    },

                    {

                        label:
                            'Daily',

                        value:
                            'DAILY'
                    },

                    {

                        label:
                            'Weekly',

                        value:
                            'WEEKLY'
                    },

                    {

                        label:
                            'Biweekly',

                        value:
                            'BIWEEKLY'
                    },

                    {

                        label:
                            'Monthly',

                        value:
                            'MONTHLY'
                    },

                    {

                        label:
                            'Yearly',

                        value:
                            'YEARLY'
                    }
                );

        await interaction.reply({

            content:
                'Select recurrence.',

            components: [

                new ActionRowBuilder()

                    .addComponents(
                        recurrenceMenu
                    )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
    ============================
    RECURRENCE SELECT
    ============================
    */
    if (

        interaction.isStringSelectMenu()

        &&

        interaction.customId ===
        'scheduled_event_recurrence'

    ) {

        const draft =

            eventDrafts.get(
                interaction.user.id
            );

        if (
            !draft
        ) {

            return await interaction.reply({

                content:
                    'Event draft not found.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        draft.recurrence =

            interaction.values[0];

        const channels =

            interaction.guild.channels.cache

                .filter(

                    channel =>

                        channel.isTextBased()

                        &&

                        !channel.isThread()
                )

                .first(25);

        const channelMenu =

            new StringSelectMenuBuilder()

                .setCustomId(
                    'scheduled_event_channel'
                )

                .setPlaceholder(
                    'Select Channel'
                )

                .addOptions(

                    channels.map(

                        channel => ({

                            label:
                                channel.name,

                            value:
                                channel.id
                        })
                    )
                );

        return await interaction.update({

            content:
                'Select a channel.',

            components: [

                new ActionRowBuilder()

                    .addComponents(
                        channelMenu
                    )
            ]
        });
    }

    /*
    ============================
    CHANNEL SELECT
    ============================
    */
    if (

        interaction.isStringSelectMenu()

        &&

        interaction.customId ===
        'scheduled_event_channel'

    ) {

        const draft =

            eventDrafts.get(
                interaction.user.id
            );

        if (
            !draft
        ) {

            return await interaction.reply({

                content:
                    'Event draft not found.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        draft.channelId =
            interaction.values[0];

        draft.eventId =
            generateEventId();

        draft.guildId =
            interaction.guild.id;

        draft.authorId =
            interaction.user.id;

        const automationChannelId =

            await getGuildSetting({

                guildId:
                    interaction.guild.id,

                settingName:
                    'channel_automation'
            });

        const approvalChannel =

            interaction.guild.channels.cache.get(
                automationChannelId
            );

        if (
            !approvalChannel
        ) {

            return await interaction.update({

                content:
                    'Automation channel is not configured.',

                components: []
            });
        }

        const embed =
            new EmbedBuilder()

                .setColor(
                    0x8B5CF6
                )

                .setTitle(
                    'Pending Scheduled Event'
                )

                .addFields(

                    {
                        name:
                            'Title',

                        value:
                            draft.title
                    },

                    {
                        name:
                            'Date',

                        value:
                            draft.date
                    },

                    {
                        name:
                            'Time',

                        value:
                            draft.time
                    },

                    {
                        name:
                            'Recurrence',

                        value:
                            draft.recurrence
                    },

                    {
                        name:
                            'Channel',

                        value:
                            `<#${draft.channelId}>`
                    },

                    {
                        name:
                            'Author',

                        value:
                            `<@${draft.authorId}>`
                    }
                );

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            `event_approve_${draft.eventId}`
                        )

                        .setLabel(
                            'Approve'
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `event_edit_${draft.eventId}`
                        )

                        .setLabel(
                            'Edit'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            `event_cancel_${draft.eventId}`
                        )

                        .setLabel(
                            'Cancel'
                        )

                        .setStyle(
                            ButtonStyle.Danger
                        )
                );

        await approvalChannel.send({

            embeds: [
                embed
            ],

            components: [
                row
            ]
        });

        return await interaction.update({

            content:
                'Scheduled event submitted for approval.',

            components: []
        });
    }

    /*
    ============================
    APPROVE EVENT
    ============================
    */
    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(
            'event_approve_'
        )

    ) {

        const eventId =

            interaction.customId.replace(
                'event_approve_',
                ''
            );

        const draft =

            Array.from(
                eventDrafts.values()
            )

                .find(

                    event =>

                        event.eventId ===
                        eventId
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

        await createScheduledEvent({

            eventId:
                draft.eventId,

            guildId:
                draft.guildId,

            title:
                draft.title,

            description:
                draft.description,

            channelId:
                draft.channelId,

            nextRun:

                new Date(
                    `${draft.date} ${draft.time}`
                ),

            recurrence:
                draft.recurrence,

            authorId:
                draft.authorId
        });

        eventDrafts.delete(
            draft.authorId
        );

        return await interaction.update({

            content:
                'Scheduled event approved.',

            embeds: [],

            components: []
        });
    }

    /*
    ============================
    CANCEL EVENT
    ============================
    */
    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(
            'event_cancel_'
        )

    ) {

        const eventId =

            interaction.customId.replace(
                'event_cancel_',
                ''
            );

        const draft =

            Array.from(
                eventDrafts.values()
            )

                .find(

                    event =>

                        event.eventId ===
                        eventId
                );

        if (
            draft
        ) {

            eventDrafts.delete(
                draft.authorId
            );
        }

        return await interaction.update({

            content:
                'Scheduled event cancelled.',

            embeds: [],

            components: []
        });
    }

    /*
    ============================
    EDIT EVENT
    ============================
    */
    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(
            'event_edit_'
        )

    ) {

        const eventId =

            interaction.customId.replace(
                'event_edit_',
                ''
            );

        const draft =

            Array.from(
                eventDrafts.values()
            )

                .find(

                    event =>

                        event.eventId ===
                        eventId
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

        eventDrafts.delete(
            draft.authorId
        );

        await showScheduledEventModal(
            interaction
        );

        return;
    }

    return false;
}

module.exports = {
    handleEventInteraction
};
