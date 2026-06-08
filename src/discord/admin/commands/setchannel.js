/**
 * Title: setchannel.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Sets guild channel settings.
 */

const {
    setGuildSetting
} = require('../../../core/database/guild-settings-repository');

const {
    getChannelSettings
} = require('../../../core/database/default-guild-settings');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleSetChannelCommand(
    interaction
) {

    const selectedSetting =
        interaction.options.getString(
            'setting'
        );

    const channelSetting =
        getChannelSettings().find(
            setting =>
                setting.displayName ===
                selectedSetting
        );

    if (
        !channelSetting
    ) {
        return await interaction.reply({
            content:
                'Invalid channel setting.'
        });
    }

    await setGuildSetting({

        guildId:
            interaction.guild.id,

        guildName:
            interaction.guild.name,

        settingName:
            channelSetting.name,

        settingValue:
            interaction.channel.id
    });

    logFeature({

        category:
            'GUILD_SETTINGS',

        message:
            'Channel setting updated',

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            setting:
                channelSetting.name,

            channelId:
                interaction.channel.id,

            channelName:
                interaction.channel.name,

            updatedBy:
                interaction.user.username
        }
    });

    await interaction.reply({

        content:

            `✅ ${selectedSetting} updated to ${interaction.channel}`
    });
}

module.exports = {
    handleSetChannelCommand
};
