/**
 * Title: removerole.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Removes a role from the Guild Settings.
 */

const {
    getGuildSetting,
    setGuildSetting
} = require('../../../core/database/guild-settings-repository');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleRemoveRoleCommand(
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

    const settingName =
        setting === 'Admin'
            ? 'roles_admin'
            : 'roles_moderator';

    const currentRoles =
        await getGuildSetting({
            guildId:
                interaction.guild.id,
            settingName
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

        settingName,

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

            `✅ ${role} removed from ${setting}`
    });
}

module.exports = {
    handleRemoveRoleCommand
};
