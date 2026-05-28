/**
 * Title: permission-check.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/26/26
 * Description: Verifies admin/mod permissions.
 */

const {
    getGuildConfig
} = require('../../core/config/guild-config');

function hasAdminPermissions(
    interaction
) {

    const guildConfig =

        getGuildConfig(
            interaction.guild.id
        );

    if (
        !guildConfig
    ) {

        return false;
    }

    const allowedRoles = [

        ...guildConfig
            .moderation
            .adminRoleIds,

        ...guildConfig
            .moderation
            .moderatorRoleIds
    ];

    return interaction.member.roles.cache.some(

        role => allowedRoles.includes(
            role.id
        )
    );
}

module.exports = {
    hasAdminPermissions
};
