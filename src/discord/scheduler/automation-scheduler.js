/**
 * Title: automation-scheduler.js
 * Author: Tango Hunter
 * Date Created: 6/21/26
 * Description: Scheduled event automation system.
 */

const cron =
    require('node-cron');

const {
    EmbedBuilder
} = require('discord.js');

const {
    getDueEvents,
    updateNextRun,
    deleteScheduledEvent,
    mark24HourReminderSent,
    mark1HourReminderSent,
    getEventsNeeding24HourReminder,
    getEventsNeeding1HourReminder
} = require(
    '../../core/database/scheduled-events-repository'
);

const {
    calculateNextRun
} = require('../utils/event-recurrence');

const {
    logFeature
} = require('../../core/logging/logger');


function startAutomationScheduler(
    client
) {

    cron.schedule(

        '* * * * *',

        async () => {

            try {

                /*
                ============================
                24 HOUR REMINDERS
                ============================
                */

                const dayEvents =
                    await getEventsNeeding24HourReminder();

                for (

                    const event

                    of

                    dayEvents
                ) {

                    const channel =
                        await client.channels.fetch(
                            event.channel_id
                        );

                    if (
                        channel
                    ) {
                        await channel.send({

                            embeds: [

                                new EmbedBuilder()

                                    .setColor(
                                        0x8B5CF6
                                    )

                                    .setTitle(
                                        'Upcoming Event'
                                    )

                                    .setDescription(

`${event.title}

Begins in approximately 24 hours.`
                                    )
                            ]
                        });
                    }

                    await mark24HourReminderSent(
                        event.event_id
                    );
                }

                /*
                ============================
                1 HOUR REMINDERS
                ============================
                */

                const hourEvents =
                    await getEventsNeeding1HourReminder();

                for (

                    const event

                    of

                    hourEvents
                ) {

                    const channel =
                        await client.channels.fetch(
                            event.channel_id
                        );

                    if (
                        channel
                    ) {
                        await channel.send({

                            embeds: [

                                new EmbedBuilder()

                                    .setColor(
                                        0x8B5CF6
                                    )

                                    .setTitle(
                                        'Event Starting Soon'
                                    )

                                    .setDescription(

`${event.title}

Begins in approximately 1 hour.`
                                    )
                            ]
                        });
                    }

                    await mark1HourReminderSent(
                        event.event_id
                    );
                }

                /*
                ============================
                DUE EVENTS
                ============================
                */

                const dueEvents =
                    await getDueEvents();

                for (

                    const event

                    of

                    dueEvents
                ) {

                    const channel =
                        await client.channels.fetch(
                            event.channel_id
                        );

                    if (
                        channel
                    ) {
                        await channel.send({

                            embeds: [

                                new EmbedBuilder()

                                    .setColor(
                                        0x8B5CF6
                                    )

                                    .setTitle(
                                        event.title
                                    )

                                    .setDescription(
                                        event.description
                                    )
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

                    if (
                        nextRun
                    ) {
                        await updateNextRun({

                            eventId:
                                event.event_id,

                            nextRun
                        });
                    }

                    else {
                        await deleteScheduledEvent(
                            event.event_id
                        );
                    }
                }
            }

            catch (
                error
            ) {

                logFeature({

                    category:
                        'AUTOMATION',

                    message:
                        'Automation scheduler failed',

                    details: {

                        error:
                            error.message
                    }
                });
            }
        }
    );

    logFeature({

        category:
            'AUTOMATION',

        message:
            'Automation scheduler started',

        details: 
            'Details'
        
    });
}

module.exports = {
    startAutomationScheduler
};
