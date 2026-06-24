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
    embedThemes
} = require('../../core/config/embed-themes');

const {
    getDueEvents,
    updateNextRun,
    deleteScheduledEvent,
    mark24HourReminderSent,
    mark1HourReminderSent,
    getEventsNeeding24HourReminder,
    getEventsNeeding1HourReminder
} = require('../../core/database/scheduled-events-repository');

const {
    getDueDiscordEvents,
    deleteDiscordEventAnnouncement
} = require('../../core/database/discord-event-announcements-repository');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

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
                                        embedThemes.eventStartingSoon.color
                                    )

                                    .setTitle(`${embedThemes.eventStartingSoon.icon} Upcoming Event`
                                    )

                                    .setFooter({

                                        text:
                                            embedThemes.eventStartingSoon.footer
                                    })

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
                                        embedThemes.eventStartingSoon.color
                                    )

                                    .setTitle(`${embedThemes.eventStartingSoon.icon} Event Starting Soon`
                                    )

                                    .setFooter({

                                        text:
                                            embedThemes.eventStartingSoon.footer
                                    })

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
                                        embedThemes.scheduledEvent.color
                                    )

                                    .setTitle(`${embedThemes.scheduledEvent.icon} ${event.title}`
                                    )

                                    .setFooter({

                                        text:
                                            embedThemes.scheduledEvent.footer
                                    })

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

                /*
                ============================
                DISCORD EVENTS
                ============================
                */

                const discordEvents =

                    await getDueDiscordEvents();

                for (

                    const event

                    of

                    discordEvents
                ) {

                    const announcementChannelId =

                        await getGuildSetting({

                            guildId:
                                event.guild_id,

                            settingName:
                                'channel_announcements'
                        });

                    const verifiedRoleId =

                        await getGuildSetting({

                            guildId:
                                event.guild_id,

                            settingName:
                                'role_verified'
                        });

                    const channel =

                        await client.channels.fetch(
                            announcementChannelId
                        );

                    if (
                        channel
                    ) {

                        await channel.send({

                            content:
                                `<@&${verifiedRoleId}>`,

                            embeds: [

                                new EmbedBuilder()

                                    .setColor(
                                        embedThemes.eventStartingNow.color
                                    )

                                    .setTitle(`${embedThemes.eventStartingNow.icon} ${event.title} Starting Now`
                                    )

                                    .setFooter({

                                        text:
                                            embedThemes.eventStartingNow.footer
                                    })

                                    .setDescription(

                                        event.description ||

                                        'Event is beginning.'
                                    )

                                    .addFields(

                                        {

                                            name:
                                                'Location',

                                            value:

                                                event.location ||

                                                'Discord'
                                        }
                                    )
                            ]
                        });
                    }

                    await deleteDiscordEventAnnouncement(
                        event.event_id
                    );
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

        details: {

            cron:
                '* * * * *',

            services: [

                'scheduled_events',

                'discord_events'
            ]
        }
        
    });
}

module.exports = {
    startAutomationScheduler
};
