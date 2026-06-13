/**
 * Title: removerole.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Date Modified: 6/12/26
 * Description: Removes a role from Guild Settings.
 */

const {
    getGuildSetting,
    setGuildSetting
} = require('../../../core/database/guild-settings-repository');

const {
    getRoleSettings
} = require('../../../core/database/default-guild-settings');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleRemoveRoleCommand(
    interaction
) {

    const selectedSetting =
        interaction.options.getString(
            'setting'
        );

    const role =
        interaction.options.getRole(
            'role'
        );

    const roleSetting =
        getRoleSettings().find(

            setting =>

                setting.displayName ===
                selectedSetting
        );

    if (
        !roleSetting
    ) {
        return await interaction.reply({

            content:
                'Invalid role setting.'
        });
    }

    /*
    ===============================
    Multi Role Only
    ===============================
    */
    if (
        !roleSetting.name.startsWith(
            'roles_'
        )
    ) {
        return await interaction.reply({

            content:
                `${selectedSetting} does not support role removal. Use /setrole instead.`
        });
    }

    const currentRoles =
        await getGuildSetting({

            guildId:
                interaction.guild.id,

            settingName:
                roleSetting.name
        })

        || [];

    const updatedRoles =
        currentRoles.filter(

            roleId =>

                roleId !== role.id
        );

    await setGuildSetting({

        guildId:
            interaction.guild.id,

        guildName:
            interaction.guild.name,

        settingName:
            roleSetting.name,

        settingValue:
            updatedRoles
    });

    logFeature({

        category:
            'GUILD_SETTINGS',

        message:
            'Role removed',

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            setting:
                roleSetting.name,

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
            `✅ ${role} removed from ${selectedSetting}`
    });
}

module.exports = {
    handleRemoveRoleCommand
};
