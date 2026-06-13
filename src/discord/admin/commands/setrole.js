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
    getRoleSettings
} = require('../../../core/database/default-guild-settings');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleSetRoleCommand(
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
    Single Role Settings
    ===============================
    */
    if (

        roleSetting.name.startsWith(
            'role_'
        )

        &&

        !roleSetting.name.startsWith(
            'roles_'
        )

    ) {

        await setGuildSetting({

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            settingName:
                roleSetting.name,

            settingValue:
                role.id
        });
    }

    /*
    ===============================
    Multi Role Settings
    ===============================
    */
    else {

        const currentRoles =
            await getGuildSetting({

                guildId:
                    interaction.guild.id,

                settingName:
                    roleSetting.name
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

            settingName:
                roleSetting.name,

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
            `✅ ${role} added to ${selectedSetting}`
    });
}

module.exports = {
    handleSetRoleCommand
};
