/**
 * Title: modapps.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/28/26
 * Description: Opens/closes moderator applications.
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const {
    getGuildSetting,
    setGuildSetting
} = require('../../../core/database/guild-settings-repository');

const {
    getFeatureFlag
} = require('../../../core/database/feature-flags-repository');

const {
    logFeature
} = require('../../../core/logging/logger');

const {
    discordLog
} = require('../../../core/logging/discord-logger');


async function getApplicationMessage(
    interaction
) {

    const applyChannelId =
        await getGuildSetting({

            guildId:
                interaction.guild.id,

            settingName:
                'channel_modapps_apply'
        });

    const submissionsChannelId =
        await getGuildSetting({

            guildId:
                interaction.guild.id,

            settingName:
                'channel_modapps_submissions'
        });

    if (
        !applyChannelId
    ) {

        logFeature({

            category:
                'MOD_APP',

            message:
                'Missing Mod applications channel configuration',

            details: {

                guildId:
                    interaction.guild.id,

                guildName:
                    interaction.guild.name
            }
        });

        return await interaction.reply({

            content:
                'Moderator applications channel has not been configured. Use `/setchannel Mod Applications` in the channel where applications should be posted.',

            flags:
                MessageFlags.Ephemeral
        });
    }

    if (
        !submissionsChannelId
    ) {

        logFeature({

            category:
                'MOD_APP',

            message:
                'Missing Mod applications submissions channel configuration',

            details: {

                guildId:
                    interaction.guild.id,

                guildName:
                    interaction.guild.name
            }
        });

        return await interaction.reply({

            content:
                'Moderator application submissions channel has not been configured. Use `/setchannel Mod App Submissions` in the channel where completed applications should be sent.',

            flags:
                MessageFlags.Ephemeral
        });
    }

    const messageId =
        await getGuildSetting({

            guildId:
                interaction.guild.id,

            settingName:
                'message_modapps_apply'
        });

    let channel;

    try {

        channel =

            await interaction.client.channels.fetch(
                applyChannelId
            );
    }

    catch {

        logFeature({

            category:
                'MOD_APP',

            message:
                'Deleted Mod applications channel configuration',

            details: {

                guildId:
                    interaction.guild.id,

                guildName:
                    interaction.guild.name
            }
        });

        return await interaction.reply({

            content:
                `The configured moderator applications channel no longer exists.\n\nConfigured Channel ID: ${applyChannelId}\n\nRun \`/setchannel Mod Applications\` in the correct channel to repair this setting.`,

            flags:
                MessageFlags.Ephemeral
        });
    }

    try {

        await interaction.client.channels.fetch(
            submissionsChannelId
        );
    }

    catch {

        logFeature({

            category:
                'MOD_APP',

            message:
                'Deleted  Mod applications submissions channel configuration',

            details: {

                guildId:
                    interaction.guild.id,

                guildName:
                    interaction.guild.name
            }
        });

        return await interaction.reply({

            content:
                `The configured moderator application submissions channel no longer exists.\n\nConfigured Channel ID: ${submissionsChannelId}\n\nRun \`/setchannel Mod App Submissions\` in the correct channel to repair this setting.`,

            flags:
                MessageFlags.Ephemeral
        });
    }

    /*
    ============================
    EXISTING MESSAGE
    ============================
    */
    if (
        messageId
    ) {

        try {

            const message =
                await channel.messages.fetch(
                    messageId
                );

            return {

                channel,

                message
            };
        }

        catch {

            logFeature({

                category:
                    'MOD_APP',

                message:
                    'Application message missing, creating replacement',

                details: {

                    guildName:
                        interaction.guild.name,

                    guildId:
                        interaction.guild.id,

                    missingMessageId:
                        messageId
                }
            });
        }
    }

    /*
    ============================
    CREATE NEW MESSAGE
    ============================
    */

    const placeholderMessage =

        await channel.send({

            content:
                'Initializing moderator applications...'
        });

    await setGuildSetting({

        guildId:
            interaction.guild.id,

        guildName:
            interaction.guild.name,

        settingName:
            'message_modapps_apply',

        settingValue:
            placeholderMessage.id
    });

    logFeature({

        category:
            'MOD_APP',

        message:
            'Replacement application message created',

        details: {

            guildName:
                interaction.guild.name,

            guildId:
                interaction.guild.id,

            messageId:
                placeholderMessage.id
        }
    });

    return {

        channel,

        message:
            placeholderMessage
    };
}

async function handleModAppsCommand(
    interaction
) {

    const modApplicationsEnabled =
        await getFeatureFlag({
    
            guildId:
                interaction.guild.id,
    
            featureName:
                'modApplications'
        });
    
    if (
    
        !modApplicationsEnabled
    ) {
    
        return await interaction.reply({
    
            content:
                'Moderator applications are disabled for this server.',
    
            flags:
                MessageFlags.Ephemeral
        });
    }

    const subcommand =
        interaction.options.getSubcommand();

    const {
        channel,
        message
    } = await getApplicationMessage(

        interaction
    );

    const guildName =
        interaction.guild.name;

    /*
    ============================
    OPEN APPLICATIONS
    ============================
    */

    if (
        subcommand === 'open'
    ) {

        const embed =
            new EmbedBuilder()

                .setColor(
                    0x5865F2
                )

                .setTitle(
                    `${guildName} Moderator Applications`
                )

                .setDescription(`

Moderator applications are currently OPEN.

Please answer carefully and thoughtfully.

⚠ Once submitted, responses cannot be edited.

Application Sections:

🔹 Identity & Availability
🔸 Moderation Philosophy
🔺 Perspective & Judgment

Press the button below to begin.
`)

                .setFooter({

                    text:
                        'SYNARA • Moderator Recruitment'
                })

                .setTimestamp();

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'start_mod_application'
                        )

                        .setLabel(
                            'Apply'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        )
                );

        await message.edit({

            embeds: [
                embed
            ],

            components: [
                row
            ],

            content: null
        });

        const verifiedRoleId =
            await getGuildSetting({

                guildId:
                    interaction.guild.id,

                settingName:
                    'role_verified'
            });

        await channel.send({

            content:
                `<@&${verifiedRoleId}> Moderator applications are now OPEN.`
        });

        await discordLog({

            guildId:
                interaction.guild.id,

            category:
                'MOD_APP',

            details:
                `Moderator applications opened by <@${interaction.user.id}>`,

            status:
                'SUCCESS'
        });

        logFeature({

            category:
                'MOD_APP',

            message:
                'Applications opened',

            details: {

                guildName:
                    interaction.guild.name,

                guildId:
                    interaction.guild.id,

                userId:
                    interaction.user.id,

                username:
                    interaction.user.username
            }
        });

        return await interaction.reply({

            content:
                'Moderator applications opened successfully.',

            flags:
                MessageFlags.Ephemeral
        });
    }

    /*
    ============================
    CLOSE APPLICATIONS
    ============================
    */

    if (
        subcommand === 'close'
    ) {

        const embed =
            new EmbedBuilder()

                .setColor(
                    0x2F3136
                )

                .setTitle(
                    `${guildName} Moderator Applications`
                )

                .setDescription(`

Moderator applications are currently CLOSED.

Applications are not being accepted at this time.

Please monitor future announcements for reopening information.
`)

                .setFooter({

                    text:
                        'SYNARA • Moderator Recruitment'
                })

                .setTimestamp();

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'applications_closed'
                        )

                        .setLabel(
                            'Applications Closed'
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        )

                        .setDisabled(
                            true
                        )
                );

        await message.edit({

            embeds: [
                embed
            ],

            components: [
                row
            ],

            content: null
        });

        await discordLog({

            guildId:
                interaction.guild.id,

            category:
                'MOD_APP',

            details:
                `Moderator applications closed by <@${interaction.user.id}>`,

            status:
                'SUCCESS'
        });

        logFeature({

            category:
                'MOD_APP',

            message:
                'Applications closed',

            details: {

                guildName:
                    interaction.guild.name,

                guildId:
                    interaction.guild.id,

                    userId:
                        interaction.user.id,

                    username:
                        interaction.user.username
            }
        });

        return await interaction.reply({

            content:
                'Moderator applications closed successfully.',

            flags:
                MessageFlags.Ephemeral
        });
    }
}

module.exports = {
    handleModAppsCommand
};
