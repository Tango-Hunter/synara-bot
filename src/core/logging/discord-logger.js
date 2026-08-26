/**
 * Title: discord-logger.js
 * Author: Tango Hunter
 * Date Created: 6/2/26
 * Date Modified: 6/40/26
 * Description: Centralized Discord logging service.
 */

const {
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');

const client =
    require('../config/discord-client');

const {
    getGuildSetting
} = require('../database/guild-settings-repository');

const {
    findWelcomeChannel
} = require('../../discord/welcome/welcome-channel');


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


/*
====================================
CHECK CHANNEL PERMISSIONS
====================================
*/

function canUseLoggingChannel(
    channel
) {

    if (
        !channel
    ) {
        return false;
    }


    /*
    ====================================
    BOT MEMBER
    ====================================
    */

    const guild =
        channel.guild;

    if (
        !guild
    ) {
        return false;
    }


    const botMember =
        guild.members.me;

    if (
        !botMember
    ) {
        return false;
    }


    /*
    ====================================
    PERMISSIONS
    ====================================
    */

    const permissions =
        channel.permissionsFor(
            botMember
        );

    if (
        !permissions
    ) {
        return false;
    }


    return (

        permissions.has(
            PermissionsBitField.Flags.ViewChannel
        )

        &&

        permissions.has(
            PermissionsBitField.Flags.SendMessages
        )

        &&

        permissions.has(
            PermissionsBitField.Flags.EmbedLinks
        )
    );
}


/*
====================================
FIND FALLBACK CHANNEL
====================================
*/

function findFallbackChannel(
    guildId
) {

    const guild =
        client.guilds.cache.get(
            guildId
        );

    if (
        !guild
    ) {

        return null;

    }


    return findWelcomeChannel(
        guild
    );

}


/*
====================================
MAIN DISCORD LOGGING FUNCTION
====================================
*/

async function discordLog({

    guildId,

    title,

    category,

    details,

    status = 'INFO'

}) {

    try {

        /*
        ====================================
        VALIDATE GUILD
        ====================================
        */
        const guild =
            client.guilds.cache.get(
                guildId
            );

        if (
            !guild
        ) {

            console.error(
                '[DISCORD LOGGER] Guild not found.',
                {
                    guildId,
                    title,
                    category
                }
            );

            return;
        }

        /*
        ====================================
        GET CONFIGURED LOGGING CHANNEL
        ====================================
        */
        let logsChannelId =
            await getGuildSetting({

                guildId,

                settingName:
                    'channel_logs'

            });

        let channel = null;

        let usingFallback = false;

        let fallbackReason = null;

        /*
        ====================================
        CONFIGURED CHANNEL
        ====================================
        */
        if (
            logsChannelId
        ) {

            try {
                channel =
                    await client.channels.fetch(
                        logsChannelId
                    );
            }

            catch (
                error
            ) {

                fallbackReason =
                    'The configured logging channel could not be accessed. It may have been deleted or SYNARA may no longer have permission to access it.';

                console.error(

                    '[DISCORD LOGGER] Configured logging channel could not be fetched.',

                    {

                        guildId,

                        channelId:
                            logsChannelId,

                        error:
                            error.message

                    }
                );
            }

            /*
            ====================================
            VERIFY CHANNEL
            ====================================
            */
            if (
                channel
                &&
                !canUseLoggingChannel(
                    channel
                )
            ) {
                fallbackReason =
                    'The configured logging channel exists, but SYNARA cannot use it. Please verify View Channel, Send Messages, and Embed Links permissions.';

                channel =
                    null;

            }
        }

        else {
            fallbackReason =
                'No logging channel has been configured for this server.';
        }

        /*
        ====================================
        FALLBACK CHANNEL
        ====================================
        */
        if (
            !channel
        ) {

            channel =
                findFallbackChannel(
                    guildId
                );

            usingFallback =
                Boolean(
                    channel
                );
        }

        /*
        ====================================
        NO CHANNEL AVAILABLE
        ====================================
        */
        if (
            !channel
        ) {
            console.error(

                '[DISCORD LOGGER] No logging channel or fallback channel is available.',

                {

                    guildId,

                    title,

                    category,

                    fallbackReason

                }
            );

            return;
        }

        /*
        ====================================
        PREPARE DETAILS
        ====================================
        */
        let displayDetails =
            details;

        if (
            usingFallback
        ) {

            displayDetails = {

                loggingNotice:
                    'SYNARA is currently using a fallback channel because the server logging channel is not configured or is unavailable. An administrator should run /setup and configure the logging channel.',

                fallbackReason,

                fallbackChannel:
                    channel.name,

                fallbackChannelId:
                    channel.id,

                originalDetails:
                    details

            };
        }

        /*
        ====================================
        FORMAT DETAILS
        ====================================
        */
        let detailsText;

        if (
            typeof displayDetails ===
            'string'
        ) {
            detailsText =
                displayDetails;
        }

        else {
            detailsText =
                JSON.stringify(
                    displayDetails,
                    null,
                    2
                );
        }

        /*
        ====================================
        CREATE EMBED
        ====================================
        */
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
                            category
                            ||
                            'Uncategorized',

                        inline:
                            false
                    },
                    {
                        name:
                            'Details',

                        value:

                            detailsText.length >
                            1024

                                ?

                            `${detailsText.slice(
                                0,
                                1021
                            )}...`

                                :

                            detailsText,

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
                );

        /*
        ====================================
        FALLBACK WARNING
        ====================================
        */
        if (
            usingFallback
        ) {

            embed.addFields({

                name:
                    '⚠ Logging Channel Not Configured',

                value:
                    'This message was posted in a fallback channel. Please run `/setup` and configure SYNARA\'s logging channel.',

                inline:
                    false

            });
        }

        embed.setFooter({

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
        });

        embed.setTimestamp();

        /*
        ====================================
        SEND LOG
        ====================================
        */
        await channel.send({
            embeds: [
                embed
            ]
        });

        /*
        ====================================
        LOCAL FALLBACK LOG
        ====================================
        */
        if (
            usingFallback
        ) {

            console.warn(

                '[DISCORD LOGGER] Used fallback channel because the configured logging channel is unavailable.',

                {

                    guildId,

                    fallbackChannelId:
                        channel.id,

                    fallbackChannelName:
                        channel.name,

                    fallbackReason,

                    title,

                    category

                }
            );
        }
    }

    catch (
        error
    ) {

        console.error(

            '[DISCORD LOGGER ERROR]',

            {

                guildId,

                title,

                category,

                error:
                    error.message,

                stack:
                    error.stack

            }
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
