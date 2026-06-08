/**
 * Title: setrole.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Sets guild role settings.
 */

const {
    getGuildSetting,
    setGuildSetting
} = require('../../../core/database/guild-settings-repository');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleSetRoleCommand(
    interaction
) {

    const setting =
        interaction.options.getString(
            'setting'
        );

    const role =
        interaction.options.getRole(
            'role'
        );

    let settingName;

    switch (
        setting
    ) {

        case 'Admin':

            settingName =
                'roles_admin';

            break;

        case 'Moderator':

            settingName =
                'roles_moderator';

            break;

        case 'Verified':

            settingName =
                'role_verified';

            break;
    }

    if (
        setting === 'Verified'
    ) {

        await setGuildSetting({

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            settingName,

            settingValue:
                role.id
        });
    }

    else {

        const currentRoles =
            await getGuildSetting({
                guildId:
                    interaction.guild.id,
                settingName
            })

            || [];

        if (
            !currentRoles.includes(
                role.id
            )
        ) {
            currentRoles.push(
                role.id
            );
        }

        await setGuildSetting({

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            settingName,

            settingValue:
                currentRoles
        });
    }

    logFeature({

        category:
            'GUILD_SETTINGS',

        message:
            'Role setting updated',

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            setting,

            roleId:
                role.id,

            roleName:
                role.name,

            updatedBy:
                interaction.user.username
        }
    });

    await interaction.reply({
        content:

            `✅ ${role} added to ${setting}`
    });
}

module.exports = {
    handleSetRoleCommand
};
