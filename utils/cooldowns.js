/**
 * Title: cooldowns.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/16/26
 * Description: Handles user cooldown tracking.
 */

const settings =
    require('../config/settings');

const cooldowns = new Map();

function isCooldownActive(userId) {

    const now = Date.now();

    if (!cooldowns.has(userId)) {

        return false;
    }

    return now < cooldowns.get(userId);
}

function updateCooldown(userId) {

    const expiration =
        Date.now() +
        settings.cooldownSeconds * 1000;

    cooldowns.set(
        userId,
        expiration
    );
}

module.exports = {
    isCooldownActive,
    updateCooldown
};
