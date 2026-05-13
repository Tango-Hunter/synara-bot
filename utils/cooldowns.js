/**
 * Title: cooldowns.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Sets cooldown timer per user.
 */

const cooldowns = new Map();

function isOnCooldown(userId, cooldownSeconds) {

    const now = Date.now();

    if (cooldowns.has(userId)) {

        const expiration = cooldowns.get(userId);

        if (now < expiration) {
            return true;
        }
    }

    cooldowns.set(
        userId,
        now + cooldownSeconds * 1000
    );

    return false;
}

module.exports = {
    isOnCooldown
};
