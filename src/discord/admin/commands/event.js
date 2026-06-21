/**
 * Title: event.js
 * Author: Tango Hunter
 * Date Created: 6/15/26
 * Description: Event management command.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    StringSelectMenuBuilder
} = require('discord.js');

const {
    getUserScheduledEvents
} = require('../../../core/database/scheduled-events-repository');


async function handleEventCommand(
    interaction
) {

    const type =
        interaction.options.getString(
            'type'
        );

    /*
    ============================
    DISCORD EVENT
    ============================
    */

    if (
        type ===
        'discord'
    ) {
        return await interaction.reply({

            content:

                'Discord Event creation is not implemented yet.',

            flags:
                MessageFlags.Ephemeral
        });
    }

    /*
    ============================
    MANAGE EVENT
    ============================
    */
    if (
        type ===
        'manage'
    ) {

        const events =

            await getUserScheduledEvents({

                guildId:
                    interaction.guild.id,

                authorId:
                    interaction.user.id
            });

        if (
            events.length === 0
        ) {

            return await interaction.reply({

                content:
                    'You do not have any scheduled events.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        const menu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    'event_manage_select'
                )

                .setPlaceholder(
                    'Select an event'
                )

                .addOptions(

                    events.map(

                        event => ({

                            label:

    `${event.title} (${event.recurrence})`,

                            value:
                                event.event_id
                        })
                    )
                );

        return await interaction.reply({

            content:
                'Select an event to manage.',

            components: [

                new ActionRowBuilder()

                    .addComponents(
                        menu
                    )
            ],

            flags:
                MessageFlags.Ephemeral
        });
    }

    /*
    ============================
    SCHEDULED EVENT
    ============================
    */

    const row =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        'scheduled_event_create'
                    )

                    .setLabel(
                        'Create Scheduled Event'
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )
            );

    return await interaction.reply({

        content:

`Create a recurring scheduled event.

You will be prompted for:

• Title
• Description
• Date
• Time
• Recurrence
• Channel

The event will require approval before activation.`,

        components: [
            row
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

module.exports = {
    handleEventCommand
};
