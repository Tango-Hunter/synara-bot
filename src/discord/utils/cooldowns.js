/**
 * Title: cooldowns.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/16/26
 * Description: Handles user cooldown tracking.
 */

const cooldownSettings =
    require('../../core/config/role-cooldowns');

const cooldowns = new Map();

function getCooldownSeconds(member) {

    let cooldown =
        cooldownSettings.defaultCooldown;

    for (
        const [roleId, seconds]
        of Object.entries(
            cooldownSettings.roleCooldowns
        )
    ) {

        if (
            member.roles.cache.has(roleId)
        ) {

            cooldown = Math.min(
                cooldown,
                seconds
            );
        }
    }

    return cooldown;
}

function isCooldownActive(
    userId
) {

    const now = Date.now();

    if (!cooldowns.has(userId)) {

        return false;
    }

    return now < cooldowns.get(userId);
}

function updateCooldown(
    userId,
    cooldownSeconds
) {

    const expiration =
        Date.now() +
        cooldownSeconds * 1000;

    cooldowns.set(
        userId,
        expiration
    );
}

module.exports = {
    getCooldownSeconds,
    isCooldownActive,
    updateCooldown
};
