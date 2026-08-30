/**
 * Title: stream-notifications.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Description: Service that checks roles, guilds, and promo channels to post live links.
 */

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    buildLiveEmbed
} = require('../embeds/live-embed-builder');

const {
    getFeatureFlag
} = require('../../core/database/feature-flags-repository');

const {
    logFeature
} = require('../../core/logging/logger');


async function postLiveNotifications({
    client,
    guildIds,
    discordUserId,
    twitchLogin,
    profileImageUrl,
    streamTitle,
    streamCategory,
    thumbnailUrl
}) {

    const messageIds = {};

    logFeature({
        category:
            'TWITCH',

        message:
            'Beginning live notification delivery.',

        details: {
            discordUserId,
            twitchLogin,
            guildCount:
                guildIds.length,
            guildIds
        }
    });

    for (
        const guildId of guildIds
    ) {

        /*
        ====================================
        GUILD LOOKUP
        ====================================
        */

        const guild =
            client.guilds.cache.get(
                guildId
            );

        if (
            !guild
        ) {

            logFeature({
                category:
                    'TWITCH',

                message:
                    'Live notification skipped: guild not found.',

                details: {
                    guildId,
                    discordUserId,
                    twitchLogin
                }
            });

            continue;
        }

        logFeature({
            category:
                'TWITCH',

            message:
                'Live notification guild resolved.',

            details: {
                guildId,
                guildName:
                    guild.name,
                discordUserId
            }
        });


        /*
        ====================================
        MEMBER LOOKUP
        ====================================
        */

        const member =
            await guild.members.fetch(
                discordUserId
            )
            .catch(
                error => {

                    logFeature({
                        category:
                            'TWITCH',

                        message:
                            'Live notification member lookup failed.',

                        details: {
                            guildId,
                            guildName:
                                guild.name,
                            discordUserId,
                            error:
                                error.message
                        }
                    });

                    return null;
                }
            );

        if (
            !member
        ) {

            logFeature({
                category:
                    'TWITCH',

                message:
                    'Live notification skipped: Discord member not found.',

                details: {
                    guildId,
                    guildName:
                        guild.name,
                    discordUserId,
                    twitchLogin
                }
            });

            continue;
        }


        /*
        ====================================
        FEATURE FLAG
        ====================================
        */

        const twitchEnabled =
            await getFeatureFlag({
                guildId,
                featureName:
                    'twitchMonitoring'
            });

        logFeature({
            category:
                'TWITCH',

            message:
                'Twitch monitoring feature flag checked.',

            details: {
                guildId,
                guildName:
                    guild.name,
                enabled:
                    twitchEnabled
            }
        });

        if (
            !twitchEnabled
        ) {

            logFeature({
                category:
                    'TWITCH',

                message:
                    'Live notification skipped: Twitch monitoring disabled.',

                details: {
                    guildId,
                    guildName:
                        guild.name,
                    discordUserId
                }
            });

            continue;
        }


        /*
        ====================================
        LOAD GUILD SETTINGS
        ====================================
        */

        const adminRoles =
            await getGuildSetting({
                guildId,
                settingName:
                    'roles_admin'
            })
            || [];

        const modRoles =
            await getGuildSetting({
                guildId,
                settingName:
                    'roles_moderator'
            })
            || [];

        const leadershipChannelId =
            await getGuildSetting({
                guildId,
                settingName:
                    'channel_stream_leadership'
            });

        const selfPromoChannelId =
            await getGuildSetting({
                guildId,
                settingName:
                    'channel_stream_selfpromo'
            });

        const verifiedRoleId =
            await getGuildSetting({
                guildId,
                settingName:
                    'role_verified'
            });


        logFeature({
            category:
                'TWITCH',

            message:
                'Live notification channel settings resolved.',

            details: {
                guildId,
                guildName:
                    guild.name,
                selfPromoChannelId,
                leadershipChannelId,
                verifiedRoleId,
                adminRoleCount:
                    adminRoles.length,
                moderatorRoleCount:
                    modRoles.length
            }
        });


        /*
        ====================================
        DETERMINE LEADERSHIP
        ====================================
        */

        const leadershipRoles = [
            ...adminRoles,
            ...modRoles
        ];

        const matchedLeadershipRoles =
            leadershipRoles.filter(
                roleId =>
                    member.roles.cache.has(
                        roleId
                    )
            );

        const isLeadership =
            matchedLeadershipRoles.length > 0;


        /*
        ====================================
        SELECT CHANNEL
        ====================================
        */

        let channelId =
            selfPromoChannelId;

        if (
            isLeadership
        ) {
            channelId =
                leadershipChannelId;
        }


        logFeature({
            category:
                'TWITCH',

            message:
                'Live notification destination determined.',

            details: {
                guildId,
                guildName:
                    guild.name,
                discordUserId,
                twitchLogin,
                isLeadership,
                matchedLeadershipRoles,
                destinationType:
                    isLeadership
                        ? 'leadership'
                        : 'self-promo',
                selectedChannelId:
                    channelId,
                selfPromoChannelId,
                leadershipChannelId
            }
        });


        /*
        ====================================
        VALIDATE CHANNEL ID
        ====================================
        */

        if (
            !channelId
        ) {

            logFeature({
                category:
                    'TWITCH',

                message:
                    'Live notification skipped: no destination channel configured.',

                details: {
                    guildId,
                    guildName:
                        guild.name,
                    discordUserId,
                    destinationType:
                        isLeadership
                            ? 'leadership'
                            : 'self-promo',
                    selfPromoChannelId,
                    leadershipChannelId
                }
            });

            continue;
        }


        /*
        ====================================
        CHANNEL LOOKUP
        ====================================
        */

        const channel =
            guild.channels.cache.get(
                channelId
            );

        if (
            !channel
        ) {

            logFeature({
                category:
                    'TWITCH',

                message:
                    'Live notification skipped: destination channel not found in guild cache.',

                details: {
                    guildId,
                    guildName:
                        guild.name,
                    discordUserId,
                    channelId,
                    destinationType:
                        isLeadership
                            ? 'leadership'
                            : 'self-promo'
                }
            });

            continue;
        }


        logFeature({
            category:
                'TWITCH',

            message:
                'Live notification destination channel resolved.',

            details: {
                guildId,
                guildName:
                    guild.name,
                channelId,
                channelName:
                    channel.name,
                channelType:
                    channel.type,
                destinationType:
                    isLeadership
                        ? 'leadership'
                        : 'self-promo'
            }
        });


        /*
        ====================================
        BUILD EMBED
        ====================================
        */

        const embed =
            buildLiveEmbed({
                user:
                    `<@${discordUserId}>`,

                streamTitle,

                streamCategory,

                profileImageUrl,

                twitchLogin,

                thumbnailUrl
            });


        /*
        ====================================
        SEND NOTIFICATION
        ====================================
        */

        try {

            const sentMessage =
                await channel.send({
                    content:
                        isLeadership
                            ? `<@&${verifiedRoleId}>`
                            : null,

                    embeds: [
                        embed
                    ]
                });


            messageIds[
                guildId
            ] = sentMessage.id;


            logFeature({
                category:
                    'TWITCH',

                message:
                    'Live notification sent successfully.',

                details: {
                    guildId,
                    guildName:
                        guild.name,
                    channelId,
                    channelName:
                        channel.name,
                    discordUserId,
                    twitchLogin,
                    messageId:
                        sentMessage.id,
                    destinationType:
                        isLeadership
                            ? 'leadership'
                            : 'self-promo'
                }
            });

        }
        catch (
            error
        ) {

            logError({
                type:
                    ERROR_TYPES.TWITCH_ERROR,

                source:
                    'stream-notifications',

                message:
                    'Failed to send Twitch live notification.',

                details: {
                    guildId,
                    guildName:
                        guild.name,
                    channelId,
                    channelName:
                        channel.name,
                    discordUserId,
                    twitchLogin,
                    destinationType:
                        isLeadership
                            ? 'leadership'
                            : 'self-promo',
                    error:
                        error.message,
                    stack:
                        error.stack
                }
            });

            /*
            IMPORTANT:
            Preserve the existing behavior of continuing
            delivery to other guilds rather than aborting
            the entire notification operation.
            */

            continue;
        }
    }


    /*
    ====================================
    DELIVERY SUMMARY
    ====================================
    */

    logFeature({
        category:
            'TWITCH',

        message:
            'Live notification delivery finished.',

        details: {
            discordUserId,
            twitchLogin,
            guildsAttempted:
                guildIds.length,
            messagesPosted:
                Object.keys(
                    messageIds
                ).length,
            messageIds
        }
    });


    return messageIds;
}

async function deleteLiveNotifications({

    client,

    messageIds
}) {

    for (

        const [

            guildId,

            messageId

        ]

        of Object.entries(
            messageIds
        )
    ) {

        const guild =
            client.guilds.cache.get(
                guildId
            );

        if (
            !guild
        ) {
            continue;
        }

        const twitchEnabled =
            await getFeatureFlag({

                guildId,

                featureName:
                    'twitchMonitoring'
            });

        if (
            !twitchEnabled
        ) {
            continue;
        }

        const selfPromoChannelId =
            await getGuildSetting({

                guildId,

                settingName:
                    'channel_stream_selfpromo'
            });

        const leadershipChannelId =
            await getGuildSetting({

                guildId,

                settingName:
                    'channel_stream_leadership'
            });

        const channels = [
            selfPromoChannelId,

            leadershipChannelId
        ].filter(Boolean);

        for (
            const channelId of channels
        ) {

            const channel =
                guild.channels.cache.get(
                    channelId
                );

            if (
                !channel
            ) {
                continue;
            }

            try {

                const message =
                    await channel.messages.fetch(
                        messageId
                    );

                await message.delete();

                logFeature({

                    category:
                        'TWITCH',

                    message:
                        'Live notification removed',

                    details: {

                        guildId,

                        messageId
                    }
                });

            } catch {
                continue;
            }
        }
    }
}

module.exports = {
    postLiveNotifications,
    deleteLiveNotifications
};
