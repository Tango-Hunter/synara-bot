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
    MessageFlags
} = require('discord.js');

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

    return false;
}

module.exports = {
    handleEventInteraction
};
