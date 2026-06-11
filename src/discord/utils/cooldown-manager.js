/**
 * Title: cooldown-manager.js
 * Author: Tango Hunter
 * Date Created: 6/11/26
 * Description: Centralized cooldown management.
 */

const {
    discordConfig
} = require('../../core/config/discord-config');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');


const cooldowns = new Map();


async function getCooldownSeconds(
    member
) {

    const guildId =
        member.guild.id;

    const adminRoles =
        await getGuildSetting({

            guildId,

            settingName:
                'roles_admin'
        })

        || [];

    const moderatorRoles =
        await getGuildSetting({

            guildId,

            settingName:
                'roles_moderator'
        })

        || [];

    const hasAdminRole =
        adminRoles.some(

            roleId =>

                member.roles.cache.has(
                    roleId
                )
        );

    if (
        hasAdminRole
    ) {
        return discordConfig
            .cooldowns
            .adminResponse;
    }

    const hasModeratorRole =
        moderatorRoles.some(

            roleId =>

                member.roles.cache.has(
                    roleId
                )
        );

    if (
        hasModeratorRole
    ) {
        return discordConfig
            .cooldowns
            .moderatorResponse;
    }

    return discordConfig
        .cooldowns
        .defaultResponse;
}

function isCooldownActive(
    userId
) {

    const now =
        Date.now();

    if (
        !cooldowns.has(
            userId
        )
    ) {
        return false;
    }

    return (

        now

        <

        cooldowns.get(
            userId
        )
    );
}

function updateCooldown(

    userId,

    cooldownSeconds
) {

    cooldowns.set(

        userId,

        Date.now()

        +

        cooldownSeconds * 1000
    );
}

async function handleCooldown(
    message
) {

    const cooldownSeconds =
        await getCooldownSeconds(
            message.member
        );

    if (
        cooldownSeconds === 0
    ) {
        return false;
    }

    if (
        isCooldownActive(
            message.author.id
        )
    ) {
        return true;
    }

    updateCooldown(

        message.author.id,

        cooldownSeconds
    );

    return false;
}

module.exports = {
    handleCooldown,
    getCooldownSeconds,
    isCooldownActive,
    updateCooldown
};
