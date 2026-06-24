/**
 * Title: setuser.js
 * Author: Tango Hunter
 * Date Created: 6/12/26
 * Description: Sets user-based guild settings.
 */

const {
    setGuildSetting
} = require('../../../core/database/guild-settings-repository');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleSetUserCommand(
    interaction
) {

    const setting =
        interaction.options.getString(
            'setting'
        );

    const user =
        interaction.options.getUser(
            'user'
        );

    let settingName;

    switch (
        setting
    ) {

        case 'Server Leader':

            settingName =
                'server_leader';

            break;

        case 'Counting Bot':

            settingName =
                'counting_bot';

            break;

        default:

            return await interaction.reply({

                content:
                    'Invalid user setting.'
            });
    }

    await setGuildSetting({

        guildId:
            interaction.guild.id,

        guildName:
            interaction.guild.name,

        settingName,

        settingValue:
            user.id
    });

    logFeature({

        category:
            'GUILD_SETTINGS',

        message:
            'User setting updated',

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            settingName,

            userId:
                user.id,

            username:
                user.username,

            updatedBy:
                interaction.user.username
        }
    });

    await interaction.reply({

        content:
            `✅ ${setting} updated to ${user}`
    });
}

module.exports = {
    handleSetUserCommand
};
