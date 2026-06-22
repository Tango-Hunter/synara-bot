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
    getScheduledEvent,
    setScheduledEventActive,
    deleteScheduledEvent,
    skipScheduledEvent
} = require(
    '../../core/database/scheduled-events-repository'
);

const {
    calculateNextRun
} = require('../utils/event-recurrence');

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
async function showScheduledEventModal({

    interaction,

    customId =
        'scheduled_event_modal',

    titleValue = '',

    descriptionValue = '',

    dateValue = '',

    timeValue = ''
}) {

    const modal =
        new ModalBuilder()

            .setCustomId(
                customId
            )

            .setTitle(
                'Scheduled Event'
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

                            .setValue(
                                titleValue
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

                            .setValue(
                                descriptionValue
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

                            .setValue(
                                dateValue
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

                            .setValue(
                                timeValue
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

        await showScheduledEventModal({
            interaction
        });

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

        await showScheduledEventModal({
            interaction
        });

        return;
    }

    /*
    ============================
    MANAGE EVENT SELECT
    ============================
    */
    if (

        interaction.isStringSelectMenu()

        &&

        interaction.customId ===
        'event_manage_select'

    ) {

        const eventId =
            interaction.values[0];

        const menu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `event_action_${eventId}`
                )

                .setPlaceholder(
                    'Select Action'
                )

                .addOptions(

                    {

                        label:
                            'Pause',

                        value:
                            'pause'
                    },

                    {

                        label:
                            'Resume',

                        value:
                            'resume'
                    },

                    {

                        label:
                            'Skip',

                        value:
                            'skip'
                    },

                    {

                        label:
                            'Delete',

                        value:
                            'delete'
                    },

                    {

                        label:
                            'Edit',

                        value:
                            'edit'
                    }
                );

        return await interaction.update({

            content:
                'Select an action.',

            components: [

                new ActionRowBuilder()

                    .addComponents(
                        menu
                    )
            ]
        });
    }

    /*
    ============================
    EVENT ACTION
    ============================
    */
    if (

        interaction.isStringSelectMenu()

        &&

        interaction.customId.startsWith(
            'event_action_'
        )

    ) {

        const eventId =

            interaction.customId.replace(
                'event_action_',
                ''
            );

        const action =
            interaction.values[0];

        const event =

            await getScheduledEvent(
                eventId
            );

        if (
            !event
        ) {

            return await interaction.reply({

                content:
                    'Event not found.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        switch (
            action
        ) {

            // PAUSE
            case 'pause':

                await setScheduledEventActive({

                    eventId,

                    active:
                        false
                });

                return await interaction.update({

                    content:
                        'Event paused.',

                    components: []
                });

            // RESUME
            case 'resume':

                await setScheduledEventActive({

                    eventId,

                    active:
                        true
                });

                return await interaction.update({

                    content:
                        'Event resumed.',

                    components: []
                });

            // SKIP
            case 'skip':

                if (
                    event.recurrence === 'NONE'
                ) {

                    const row =
                        new ActionRowBuilder()

                            .addComponents(

                                new ButtonBuilder()

                                    .setCustomId(
                                        `event_delete_confirm_${eventId}`
                                    )

                                    .setLabel(
                                        'Delete Event'
                                    )

                                    .setStyle(
                                        ButtonStyle.Danger
                                    ),

                                new ButtonBuilder()

                                    .setCustomId(
                                        `event_delete_cancel_${eventId}`
                                    )

                                    .setLabel(
                                        'Cancel'
                                    )

                                    .setStyle(
                                        ButtonStyle.Secondary
                                    )
                            );

                    return await interaction.update({

                        content:

            `This is a one-time event and cannot be skipped.

            Would you like to delete it instead?`,

                        components: [
                            row
                        ]
                    });
                }

                const nextRun =
                    calculateNextRun({

                        currentDate:
                            event.next_run,

                        recurrence:
                            event.recurrence
                    });

                await skipScheduledEvent({

                    eventId,

                    nextRun
                });

                return await interaction.update({

                    content:
                        'Event skipped.',

                    components: []
                });

            // DELETE
            case 'delete':

                await deleteScheduledEvent(
                    eventId
                );

                return await interaction.update({

                    content:
                        'Event deleted.',

                    components: []
                });

            // EDIT
            case 'edit':

                const date =
                    new Date(
                        event.next_run
                    );

                const dateValue =
                    `${String(
                        date.getMonth() + 1
                    ).padStart(2, '0')}/${
                        String(
                            date.getDate()
                        ).padStart(2, '0')
                    }/${
                        date.getFullYear()
                    }`;

                const timeValue =
                    `${String(
                        date.getHours()
                    ).padStart(2, '0')}:${
                        String(
                            date.getMinutes()
                        ).padStart(2, '0')
                    }`;

                return await showScheduledEventModal({

                    interaction,

                    customId:
                        `scheduled_event_edit_${eventId}`,

                    titleValue:
                        event.title,

                    descriptionValue:
                        event.description,

                    dateValue,

                    timeValue
                });
        }
    }

    /*
    ============================
    DELETE CONFIRM
    ============================
    */
    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(
            'event_delete_confirm_'
        )

    ) {

        const eventId =

            interaction.customId.replace(
                'event_delete_confirm_',
                ''
            );

        await deleteScheduledEvent(
            eventId
        );

        return await interaction.update({

            content:
                'Event deleted.',

            components: []
        });
    }

    /*
    ============================
    DELETE CANCEL
    ============================
    */
    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(
            'event_delete_cancel_'
        )

    ) {

        return await interaction.update({

            content:
                'Deletion cancelled.',

            components: []
        });
    }

    return false;
}

module.exports = {
    handleEventInteraction
};
