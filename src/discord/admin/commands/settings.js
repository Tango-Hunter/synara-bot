/**
 * Title: settings.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Displays guild settings.
 */

const {
    EmbedBuilder
} = require('discord.js');

const {
    getAllGuildSettings
} = require('../../../core/database/guild-settings-repository');

const {
    getIgnoredChannels
} = require('../../../core/database/ignored-channels-repository');

const {
    logFeature
} = require('../../../core/logging/logger');


function formatSettingLabel(
    settingName
) {

    return settingName

        .replace(
            /^channel_/,
            ''
        )

        .replace(
            /^role_/,
            ''
        )

        .replace(
            /^roles_/,
            ''
        )

        .replace(
            /^message_/,
            ''
        )

        .replaceAll(
            '_',
            ' '
        )

        .replace(
            /\b\w/g,

            character =>

                character.toUpperCase()
        );
}

async function handleSettingsCommand(
    interaction
) {

    const settings =
        await getAllGuildSettings(
            interaction.guild.id
        );

    const ignoredChannels =
        await getIgnoredChannels(
            interaction.guild.id
        );

    const channels = [];
    const roles = [];

    for (
        const setting
        of
        settings
    ) {

        const {

            setting_name,

            setting_value

        } = setting;

        if (
            !setting_value
        ) {
            continue;
        }

        const label =
            formatSettingLabel(
                setting_name
            );

        // ============================
        // Channels
        // ============================

        if (

            setting_name.startsWith(
                'channel_'
            )
        ) {

            const channel =
                await interaction.guild.channels.fetch(
                    setting_value
                )

                .catch(
                    () => null
                );

            channels.push(
                `**${label}**\n${
                    channel
                        ? channel.toString()
                        : `⚠ Missing Channel (${setting_value})`
                }`
            );

            continue;
        }

        // ============================
        // Single Role
        // ============================

        if (

            setting_name.startsWith(
                'role_'
            )
        ) {

            const role =
                await interaction.guild.roles.fetch(
                    setting_value
                )

                .catch(
                    () => null
                );

            roles.push(
                `**${label}**\n${
                    role
                        ? role.toString()
                        : `⚠ Missing Role (${setting_value})`
                }`
            );

            continue;
        }

        // ============================
        // Multiple Roles
        // ============================

        if (

            setting_name.startsWith(
                'roles_'
            )
        ) {

            const roleMentions = [];

            for (
                const roleId
                of
                setting_value
            ) {

                const role =
                    await interaction.guild.roles.fetch(
                        roleId
                    )

                    .catch(
                        () => null
                    );

                roleMentions.push(
                    role
                        ? role.toString()
                        : `⚠ Missing Role (${roleId})`
                );
            }

            roles.push(
                `**${label}**\n${roleMentions.join(', ')}`
            );

            continue;
        }
    }

    const ignoredChannelList =
        ignoredChannels.length

            ? ignoredChannels

                .map(

                    channel => {

                        const guildChannel =
                            interaction.guild.channels.cache.get(
                                channel.channel_id
                            );

                        return guildChannel

                            ? guildChannel.toString()

                            : `⚠ Missing Channel (${channel.channel_id})`;
                    }
                )

                .join('\n')

            : 'No ignored channels configured.';

    const embed =

        new EmbedBuilder()

            .setColor(
                0x5865F2
            )

            .setTitle(
                'Guild Settings'
            )

            .addFields(

                {

                    name:
                        'Channels',

                    value:

                        channels.length

                            ? channels.join(
                                '\n\n'
                            )

                            : 'None Configured'
                },

                {

                    name:
                        'Roles',

                    value:

                        roles.length

                            ? roles.join(
                                '\n\n'
                            )

                            : 'None Configured'
                }
            )

            .setFooter({

                text:
                    interaction.guild.name
            })

            .setTimestamp();

    const ignoredEmbed =

        new EmbedBuilder()

            .setColor(
                0x5865F2
            )

            .setTitle(
                'Ignored Channels'
            )

            .setDescription(
                ignoredChannelList
            )

            .setFooter({

                text:
                    interaction.guild.name
            })

            .setTimestamp();

    logFeature({

        category:
            'GUILD_SETTINGS',

        message:
            'Settings viewed',

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            userId:
                interaction.user.id,

            username:
                interaction.user.username
        }
    });

    await interaction.reply({

        embeds: [

            embed,

            ignoredEmbed
        ]
    });
}

module.exports = {
    handleSettingsCommand
};
