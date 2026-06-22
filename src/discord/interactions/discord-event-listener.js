/**
 * Title: discord-event-listeners.js
 * Author: Tango Hunter
 * Date Created: 6/22/26
 * Description: Discord scheduled event announcements.
 */

const {
    EmbedBuilder
} = require('discord.js');

const {
    embedThemes
} = require('../../core/config/embed-themes');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    createDiscordEventAnnouncement,
    updateDiscordEventAnnouncement,
    deleteDiscordEventAnnouncement
} = require('../../core/database/discord-event-announcements-repository');

const {
    logFeature
} = require('../../core/logging/logger');


function registerDiscordEventListeners(
    client
) {

    /*
    ====================================
    EVENT CREATED
    ====================================
    */

    client.on(

        'guildScheduledEventCreate',

        async event => {

            try {

                const startTime =
                    event.scheduledStartAt;

                const now =
                    new Date();

                const minutesUntilStart =

                    Math.floor(

                        (
                            startTime - now
                        )

                        /

                        60000
                    );

                const announcementChannelId =
                    await getGuildSetting({

                        guildId:
                            event.guild.id,

                        settingName:
                            'channel_announcements'
                    });

                const verifiedRoleId =
                    await getGuildSetting({

                        guildId:
                            event.guild.id,

                        settingName:
                            'role_verified'
                    });

                const channel =

                    event.guild.channels.cache.get(
                        announcementChannelId
                    );

                /*
                ============================
                CREATE ANNOUNCEMENT
                ============================
                */

                if (

                    channel

                    &&

                    minutesUntilStart > 30

                ) {

                    await channel.send({

                        content:
                            `<@&${verifiedRoleId}>`,

                        embeds: [

                            new EmbedBuilder()

                                .setColor(
                                    embedThemes.eventCreated.color
                                )

                                .setTitle(`${embedThemes.eventCreated.icon} ${event.name}`
                                )

                                .setFooter({

                                    text:
                                        embedThemes.eventCreated.footer
                                })

                                .setDescription(

                                    event.description ||

                                    'No description provided.'
                                )

                                .addFields(

                                    {

                                        name:
                                            'Location',

                                        value:

                                            event.entityMetadata?.location ||

                                            'Discord'
                                    },

                                    {

                                        name:
                                            'Start Time',

                                        value:
                                            `<t:${Math.floor(startTime.getTime() / 1000)}:F>`
                                    }
                                )
                        ]
                    });
                }

                /*
                ============================
                STORE EVENT
                ============================
                */

                await createDiscordEventAnnouncement({

                    eventId:
                        event.id,

                    guildId:
                        event.guild.id,

                    title:
                        event.name,

                    description:
                        event.description,

                    location:

                        event.entityMetadata?.location ||

                        null,

                    startTime
                });

                logFeature({

                    category:
                        'DISCORD_EVENT',

                    message:
                        'Discord event created',

                    details: {

                        eventId:
                            event.id,

                        guildId:
                            event.guild.id
                    }
                });
            }

            catch (
                error
            ) {

                logFeature({

                    category:
                        'DISCORD_EVENT',

                    message:
                        'Discord event create failed',

                    details: {

                        error:
                            error.message
                    }
                });
            }
        }
    );

    /*
    ====================================
    EVENT UPDATED
    ====================================
    */

    client.on(

        'guildScheduledEventUpdate',

        async (

            oldEvent,

            newEvent

        ) => {

            try {

                await updateDiscordEventAnnouncement({

                    eventId:
                        newEvent.id,

                    title:
                        newEvent.name,

                    description:
                        newEvent.description,

                    location:

                        newEvent.entityMetadata?.location ||

                        null,

                    startTime:
                        newEvent.scheduledStartAt
                });
            }

            catch (
                error
            ) {

                logFeature({

                    category:
                        'DISCORD_EVENT',

                    message:
                        'Discord event update failed',

                    details: {

                        error:
                            error.message
                    }
                });
            }
        }
    );

    /*
    ====================================
    EVENT DELETED
    ====================================
    */

    client.on(

        'guildScheduledEventDelete',

        async event => {

            try {

                await deleteDiscordEventAnnouncement(
                    event.id
                );
            }

            catch (
                error
            ) {

                logFeature({

                    category:
                        'DISCORD_EVENT',

                    message:
                        'Discord event delete failed',

                    details: {

                        error:
                            error.message
                    }
                });
            }
        }
    );
}

module.exports = {
    registerDiscordEventListeners
};
