/**
 * Title: birthday-scheduler.js
 * Author: Tango Hunter
 * Date Created: 6/15/26
 * Description: Birthday announcements.
 */

const cron =
    require('node-cron');

const {
    registerScheduler
} = require('../../core/scheduler/schedule-guard');

const {
    schedulerConfig
} = require('../../core/config/scheduler-config');

const {
    getEnabledGuilds
} = require('../../core/database/feature-flags-repository');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    getBirthdaysForDate
} = require('../../core/database/birthday-repository');

const {
    sendDiscordMessage
} = require('../services/post-message');

const {
    discordLog
} = require('../../core/logging/discord-logger');

const {
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


async function runBirthdayScheduler() {

    try {

        const now = new Date();

        const month = now.getUTCMonth() + 1;

        const day = now.getUTCDate();

        const guildIds =
            await getEnabledGuilds(
                'birthdays'
            );

        for (
            const guildId
            of guildIds
        ) {

            const birthdays =
                await getBirthdaysForDate({

                    guildId,

                    month,

                    day
                });

            if (
                birthdays.length === 0
            ) {

                continue;
            }

            const channelId =
                await getGuildSetting({

                    guildId,

                    settingName:
                        'channel_birthdays'
                });

            if (
                !channelId
            ) {
                continue;
            }

            const roleId =
                await getGuildSetting({

                    guildId,

                    settingName:
                        'role_birthday'
                });

            let message =
                '🎂 **Birthday Alert**\n\n';

            for (
                const birthday
                of birthdays
            ) {

                message +=

                    `Happy Birthday <@${birthday.user_id}>!\n`;
            }

            await sendDiscordMessage({

                channelId,

                message
            });

            /*
            ============================
            ROLE ASSIGNMENT
            ============================
            */

            if (
                roleId
            ) {

                const channel =

                    await global.client.channels.fetch(
                        channelId
                    );

                const guild =
                    channel.guild;

                const role =
                    guild.roles.cache.get(
                        roleId
                    );

                if (
                    role
                ) {

                    for (

                        const member

                        of

                        role.members.values()

                    ) {

                        await member.roles.remove(
                            role
                        );
                    }

                    for (

                        const birthday

                        of birthdays

                    ) {

                        const member =

                            await guild.members.fetch(
                                birthday.user_id
                            );

                        await member.roles.add(
                            role
                        );
                    }
                }
            }

            await discordLog({

                guildId,

                title:
                    'Birthday Announcement',

                category:
                    'Automated Announcement',

                details:
                    'Birthday Role Assigned for the day and Birthday Announcement sent',

                status:
                    'SUCCESS'
            });

            logFeature({

                category:
                    'BIRTHDAY',

                message:
                    'Birthday announcements posted',

                details: {

                    guildId,

                    month,

                    day
                }
            });
        }

    } catch (error) {

        logError({

            type:
                ERROR_TYPES.SCHEDULER_ERROR,

            source:
                'birthday-scheduler',

            message:
                error.message
        });
    }
}

function startBirthdayScheduler() {

    const schedulerRegistered =
        registerScheduler(
            'birthday-scheduler'
        );

    if (
        !schedulerRegistered
    ) {
        return;
    }

    cron.schedule(

        schedulerConfig.schedules.birthdays,

        async () => {

            await runBirthdayScheduler();
        },

        {
            timezone:
                schedulerConfig.timezone
        }
    );
}

module.exports = {
    startBirthdayScheduler,
    runBirthdayScheduler
};
