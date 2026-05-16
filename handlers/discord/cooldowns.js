/**
 * Title: cooldowns.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Only sends message if user is not on cooldown.
 */

const {
    getCooldownSeconds,
    isCooldownActive,
    updateCooldown
} = require('../../utils/cooldowns');

async function handleCooldown(message) {

    const cooldownSeconds =
        getCooldownSeconds(
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
    handleCooldown
};
