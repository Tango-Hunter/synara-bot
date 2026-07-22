/**
 * Title: discord-logger.js
 * Author: Tango Hunter
 * Date Created: 6/2/26
 * Date Modified: 6/40/26
 * Description: Centralized Discord logging service.
 */

const {
    EmbedBuilder
} = require('discord.js');

const client =
    require('../config/discord-client');

const {
    getGuildSetting
} = require('../database/guild-settings-repository');


const CRITICAL_LOGS_CHANNEL_ID =
    process.env.SYNARA_CRITICAL_LOGS_ID;


// ===============================
// Status settings
// ===============================
const STATUS_COLORS = {

    SUCCESS:
        0x2ECC71,

    WARNING:
        0xF1C40F,

    ERROR:
        0xE74C3C,

    INFO:
        0x3498DB
};

const STATUS_ICONS = {

    SUCCESS:
        '◉',

    WARNING:
        '⚠',

    ERROR:
        '✖',

    INFO:
        '☾'
};

// ===============================
// Main Logging function within Discord
// ===============================
async function discordLog({

    guildId,

    title,

    category,

    details,

    status = 'INFO'
}) {

    try {

        const logsChannelId =
            await getGuildSetting({

                guildId,

                settingName:
                    'channel_logs'
            });

        if (
            !logsChannelId
        ) {
            return;
        }

        const channel =
            await client.channels.fetch(
                logsChannelId
            );

        if (
            !channel
        ) {
            return;
        }

        const embed =

            new EmbedBuilder()

                .setColor(

                    STATUS_COLORS[
                        status
                    ]

                    ||

                    STATUS_COLORS.INFO
                )

                .setTitle(

                    `${

                        STATUS_ICONS[
                            status
                        ]

                        ||

                        STATUS_ICONS.INFO

                    } ${title}`
                )

                .addFields(

                    {

                        name:
                            'Category',

                        value:
                            category,

                        inline:
                            false
                    },

                    {

                        name:
                            'Details',

                        value:
                            details,

                        inline:
                            false
                    },

                    {

                        name:
                            'Status',

                        value:
                            status,

                        inline:
                            false
                    }
                )

                .setFooter({

                    text:

                        `SYNARA • ${
                            new Date()
                                .toLocaleString(
                                    'en-US',
                                    {
                                        timeZone:
                                            'America/New_York'
                                    }
                                )
                        }`
                })

                .setTimestamp();

        await channel.send({

            embeds: [
                embed
            ]
        });

    } catch (error) {

        console.error(

            '[DISCORD LOGGER ERROR]',

            error
        );
    }
}

// ===============================
// Critical SYNARA logging
// ===============================
async function criticalLog({

    title,

    category,

    details,

    status = 'ERROR'

}) {

    try {

        if (
            !CRITICAL_LOGS_CHANNEL_ID
        ) {
            return;
        }

        const channel =

            await client.channels.fetch(

                CRITICAL_LOGS_CHANNEL_ID

            );

        if (
            !channel
        ) {
            return;
        }

        const embed =

            new EmbedBuilder()

                .setColor(

                    STATUS_COLORS[status]

                    ||

                    STATUS_COLORS.ERROR

                )

                .setTitle(

                    `${

                        STATUS_ICONS[status]

                        ||

                        STATUS_ICONS.ERROR

                    } ${title}`

                )

                .addFields(

                    {

                        name:

                            'Category',

                        value:

                            category,

                        inline:

                            false

                    },

                    {

                        name:

                            'Details',

                        value:

                            `\`\`\`json\n${JSON.stringify(

                                details,

                                null,

                                2

                            )}\n\`\`\``,

                        inline:

                            false

                    }
                )

                .setFooter({

                    text:

                        `SYNARA • ${
                            new Date()

                                .toLocaleString(

                                    'en-US',

                                    {

                                        timeZone:

                                            'America/New_York'

                                    }
                                )
                        }`
                })

                .setTimestamp();

        await channel.send({

            embeds: [

                embed

            ]
        });
    }

    catch (
        error
    ) {

        console.error(

            '[CRITICAL LOGGER ERROR]',

            error

        );
    }
}

module.exports = {
    discordLog,
    criticalLog
};
