/**
 * Title: permission-check.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/26/26
 * Description: Verifies admin/mod permissions.
 */

const {
    PermissionsBitField
} = require('discord.js');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    logFeature
} = require('../../core/logging/logger');


async function hasAdminPermissions(
    interaction
) {

    const adminRoles =
        await getGuildSetting({

            guildId:
                interaction.guild.id,

            settingName:
                'roles_admin'
        })

        || [];

    const moderatorRoles =
        await getGuildSetting({

            guildId:
                interaction.guild.id,

            settingName:
                'roles_moderator'
        })

        || [];

    const allowedRoles = [

        ...adminRoles,

        ...moderatorRoles
    ];

    const hasConfiguredRole =

        interaction.member.roles.cache.some(

            role =>

                allowedRoles.includes(
                    role.id
                )
        );

    if (
        hasConfiguredRole
    ) {

        return true;
    }

    if (
        interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ) {

        logFeature({

            category:
                'PERMISSIONS',

            message:
                'Using Discord Administrator fallback',

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

        return true;
    }
    
    // Explicitly denies access if access has not been configured or if the user does not have admin permissions
    return false;
}

module.exports = {
    hasAdminPermissions
};
