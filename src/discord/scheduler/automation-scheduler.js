/**
 * Title: automation-scheduler.js
 * Author: Tango Hunter
 * Date Created: 6/21/26
 * Description: Scheduled event automation system.
 */


const crypto =
    require('crypto');

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
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


/*
====================================
SCHEDULER CONFIGURATION
====================================
*/

const AUTOMATION_SCHEDULE = '* * * * *';

/*
====================================
RUN LOCK
====================================

Prevents a second scheduler execution
from starting while the previous execution
is still running.

The scheduler runs every minute, but some
Discord/database operations can take longer
than one minute.

Without this lock, two executions could
process the same event simultaneously.
*/

let automationRunning = false;


/*
====================================
ERROR DETAILS
====================================
*/

function getErrorDetails(
    error
) {

    if (
        !error
    ) {

        return {

            name:
                'UnknownError',

            message:
                'Unknown error'

        };
    }

    return {

        name:
            error.name,

        message:
            error.message,

        code:
            error.code,

        status:
            error.status,

        statusCode:
            error.statusCode,

        stack:
            error.stack

    };
}


/*
====================================
RUN ID
====================================
*/

function createRunId() {
    return crypto.randomUUID();
}


/*
====================================
PHASE ERROR LOGGER
====================================
*/

function logAutomationError({

    runId,

    phase,

    error,

    details = {}

}) {

    logError({

        type:
            ERROR_TYPES.SCHEDULER_ERROR,

        source:
            'automation-scheduler',

        message:
            `Automation scheduler failed during ${phase}.`,

        details: {

            runId,

            phase,

            ...details,

            error:
                getErrorDetails(
                    error
                )

        }
    });
}


/*
====================================
START AUTOMATION SCHEDULER
====================================
*/

function startAutomationScheduler(
    client
) {

    cron.schedule(

        AUTOMATION_SCHEDULE,

        async () => {

            /*
            ====================================
            PREVENT OVERLAPPING RUNS
            ====================================
            */
            if (
                automationRunning
            ) {

                logFeature({

                    category:
                        'AUTOMATION',

                    message:
                        'Automation scheduler run skipped because the previous run is still active.',

                    details: {

                        cron:
                            AUTOMATION_SCHEDULE

                    }
                });

                return;
            }

            automationRunning = true;

            const runId = createRunId();

            try {

                /*
                ====================================
                24 HOUR REMINDERS
                ====================================
                */
                try {

                    const dayEvents =
                        await getEventsNeeding24HourReminder();

                    for (
                        const event
                        of
                        dayEvents
                    ) {

                        try {

                            const channel =
                                await client.channels.fetch(
                                    event.channel_id
                                );

                            if (
                                !channel
                            ) {

                                logFeature({

                                    category:
                                        'AUTOMATION',

                                    message:
                                        '24-hour reminder skipped because the Discord channel could not be found.',

                                    details: {

                                        runId,

                                        eventId:
                                            event.event_id,

                                        channelId:
                                            event.channel_id

                                    }
                                });

                                continue;
                            }

                            await channel.send({

                                embeds: [

                                    new EmbedBuilder()

                                        .setColor(
                                            embedThemes
                                                .eventStartingSoon
                                                .color
                                        )

                                        .setTitle(
                                            `${embedThemes.eventStartingSoon.icon} Upcoming Event`
                                        )

                                        .setFooter({

                                            text:
                                                embedThemes
                                                    .eventStartingSoon
                                                    .footer

                                        })

                                        .setDescription(

                                            `${event.title}

Begins in approximately 24 hours.`

                                        )
                                ]
                            });

                            await mark24HourReminderSent(
                                event.event_id
                            );

                            logFeature({

                                category:
                                    'AUTOMATION',

                                message:
                                    '24-hour reminder sent.',

                                details: {

                                    runId,

                                    eventId:
                                        event.event_id,

                                    channelId:
                                        event.channel_id

                                }
                            });
                        }

                        catch (
                            error
                        ) {

                            logAutomationError({

                                runId,

                                phase:
                                    '24-hour reminder',

                                error,

                                details: {

                                    eventId:
                                        event.event_id,

                                    channelId:
                                        event.channel_id

                                }
                            });
                        }
                    }
                }

                catch (
                    error
                ) {

                    logAutomationError({

                        runId,

                        phase:
                            '24-hour reminder query',

                        error

                    });
                }

                /*
                ====================================
                1 HOUR REMINDERS
                ====================================
                */
                try {

                    const hourEvents =
                        await getEventsNeeding1HourReminder();

                    for (
                        const event
                        of
                        hourEvents
                    ) {

                        try {

                            const channel =
                                await client.channels.fetch(
                                    event.channel_id
                                );


                            if (
                                !channel
                            ) {

                                logFeature({

                                    category:
                                        'AUTOMATION',

                                    message:
                                        '1-hour reminder skipped because the Discord channel could not be found.',

                                    details: {

                                        runId,

                                        eventId:
                                            event.event_id,

                                        channelId:
                                            event.channel_id

                                    }
                                });

                                continue;
                            }

                            await channel.send({

                                embeds: [

                                    new EmbedBuilder()

                                        .setColor(
                                            embedThemes
                                                .eventStartingSoon
                                                .color
                                        )

                                        .setTitle(
                                            `${embedThemes.eventStartingSoon.icon} Event Starting Soon`
                                        )

                                        .setFooter({

                                            text:
                                                embedThemes
                                                    .eventStartingSoon
                                                    .footer

                                        })

                                        .setDescription(

                                            `${event.title}

Begins in approximately 1 hour.`

                                        )
                                ]
                            });

                            await mark1HourReminderSent(
                                event.event_id
                            );

                            logFeature({

                                category:
                                    'AUTOMATION',

                                message:
                                    '1-hour reminder sent.',

                                details: {

                                    runId,

                                    eventId:
                                        event.event_id,

                                    channelId:
                                        event.channel_id

                                }
                            });
                        }

                        catch (
                            error
                        ) {

                            logAutomationError({

                                runId,

                                phase:
                                    '1-hour reminder',

                                error,

                                details: {

                                    eventId:
                                        event.event_id,

                                    channelId:
                                        event.channel_id

                                }
                            });
                        }
                    }
                }

                catch (
                    error
                ) {

                    logAutomationError({

                        runId,

                        phase:
                            '1-hour reminder query',

                        error

                    });
                }

                /*
                ====================================
                DUE SCHEDULED EVENTS
                ====================================
                */
                try {

                    const dueEvents =
                        await getDueEvents();

                    for (
                        const event
                        of
                        dueEvents
                    ) {

                        try {

                            const channel =
                                await client.channels.fetch(
                                    event.channel_id
                                );

                            if (
                                !channel
                            ) {

                                logFeature({

                                    category:
                                        'AUTOMATION',

                                    message:
                                        'Scheduled event skipped because the Discord channel could not be found.',

                                    details: {

                                        runId,

                                        eventId:
                                            event.event_id,

                                        channelId:
                                            event.channel_id

                                    }
                                });

                                continue;

                            }

                            await channel.send({

                                embeds: [

                                    new EmbedBuilder()

                                        .setColor(
                                            embedThemes
                                                .scheduledEvent
                                                .color
                                        )

                                        .setTitle(
                                            `${embedThemes.scheduledEvent.icon} ${event.title}`
                                        )

                                        .setFooter({

                                            text:
                                                embedThemes
                                                    .scheduledEvent
                                                    .footer

                                        })

                                        .setDescription(
                                            event.description
                                        )
                                ]
                            });

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

                                logFeature({

                                    category:
                                        'AUTOMATION',

                                    message:
                                        'Scheduled event broadcast completed and next run calculated.',

                                    details: {

                                        runId,

                                        eventId:
                                            event.event_id,

                                        nextRun

                                    }
                                });
                            }

                            else {

                                await deleteScheduledEvent(
                                    event.event_id
                                );

                                logFeature({

                                    category:
                                        'AUTOMATION',

                                    message:
                                        'One-time scheduled event broadcast completed and event removed.',

                                    details: {

                                        runId,

                                        eventId:
                                            event.event_id

                                    }
                                });
                            }
                        }

                        catch (
                            error
                        ) {

                            logAutomationError({

                                runId,

                                phase:
                                    'scheduled event',

                                error,

                                details: {

                                    eventId:
                                        event.event_id,

                                    guildId:
                                        event.guild_id,

                                    channelId:
                                        event.channel_id

                                }
                            });
                        }
                    }
                }

                catch (
                    error
                ) {

                    logAutomationError({

                        runId,

                        phase:
                            'scheduled event query',

                        error

                    });
                }

                /*
                ====================================
                DISCORD EVENT ANNOUNCEMENTS
                ====================================
                */
                try {

                    const discordEvents =
                        await getDueDiscordEvents();

                    for (
                        const event
                        of
                        discordEvents
                    ) {

                        try {

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

                            if (
                                !announcementChannelId
                            ) {

                                logFeature({

                                    category:
                                        'AUTOMATION',

                                    message:
                                        'Discord event announcement skipped because no announcement channel is configured.',

                                    details: {

                                        runId,

                                        eventId:
                                            event.event_id,

                                        guildId:
                                            event.guild_id

                                    }
                                });

                                continue;
                            }

                            const channel =

                                await client.channels.fetch(
                                    announcementChannelId
                                );

                            if (
                                !channel
                            ) {

                                logFeature({

                                    category:
                                        'AUTOMATION',

                                    message:
                                        'Discord event announcement skipped because the configured announcement channel could not be found.',

                                    details: {

                                        runId,

                                        eventId:
                                            event.event_id,

                                        guildId:
                                            event.guild_id,

                                        channelId:
                                            announcementChannelId

                                    }
                                });

                                continue;

                            }

                            const content =
                                verifiedRoleId

                                    ? `<@&${verifiedRoleId}>`

                                    : undefined;

                            await channel.send({

                                content,

                                embeds: [

                                    new EmbedBuilder()

                                        .setColor(
                                            embedThemes
                                                .eventStartingNow
                                                .color
                                        )

                                        .setTitle(
                                            `${embedThemes.eventStartingNow.icon} ${event.title} Starting Now`
                                        )

                                        .setFooter({

                                            text:
                                                embedThemes
                                                    .eventStartingNow
                                                    .footer

                                        })

                                        .setDescription(

                                            event.description ||

                                            'Event is beginning.'

                                        )

                                        .addFields({

                                            name:
                                                'Location',

                                            value:
                                                event.location ||

                                                'Discord'

                                        })
                                ]
                            });

                            await deleteDiscordEventAnnouncement(
                                event.event_id
                            );

                            logFeature({

                                category:
                                    'AUTOMATION',

                                message:
                                    'Discord event announcement broadcast completed.',

                                details: {

                                    runId,

                                    eventId:
                                        event.event_id,

                                    guildId:
                                        event.guild_id,

                                    channelId:
                                        announcementChannelId

                                }
                            });
                        }

                        catch (
                            error
                        ) {

                            logAutomationError({

                                runId,

                                phase:
                                    'Discord event announcement',

                                error,

                                details: {

                                    eventId:
                                        event.event_id,

                                    guildId:
                                        event.guild_id

                                }
                            });
                        }
                    }
                }

                catch (
                    error
                ) {

                    logAutomationError({

                        runId,

                        phase:
                            'Discord event announcement query',

                        error

                    });
                }
            }

            finally {

                /*
                ====================================
                RUN COMPLETE
                ====================================
                */

                automationRunning = false;

            }
        }
    );

    /*
    ====================================
    SCHEDULER REGISTERED
    ====================================
    */
    logFeature({

        category:
            'AUTOMATION',

        message:
            'Automation scheduler registered',

        details: {

            cron:
                AUTOMATION_SCHEDULE,

            services: [

                'scheduled_events',

                'discord_events',

                '24_hour_reminders',

                '1_hour_reminders'

            ]
        }
    });
}


module.exports = {
    startAutomationScheduler
};
