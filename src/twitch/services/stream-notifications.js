/**
 * Title: stream-notifications.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 5/30/26
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

    for (
        const guildId of guildIds
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

        const member =
            await guild.members.fetch(
                discordUserId
            )
            .catch(
                () => null
            );

        if (
            !member
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

        const adminRoles =
            await getGuildSetting({

                guildId,

                settingName:
                    'roles_admin'
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

        let channelId =
            selfPromoChannelId;

        const isLeadership =
            adminRoles.some(
                roleId =>
                    member.roles.cache.has(
                        roleId
                    )
                );

        if (
            isLeadership
        ) {
            channelId =
                leadershipChannelId;
        }

        const channel =
            guild.channels.cache.get(
                channelId
            );

        if (
            !channel
        ) {
            continue;
        }

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

            logFeature({

                category:
                    'TWITCH',

                message:
                    'Live notification sent',

                details: {

                    guildId,

                    channelId,

                    discordUserId
                }
            });

        messageIds[
            guildId
        ] = sentMessage.id;
    }

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
