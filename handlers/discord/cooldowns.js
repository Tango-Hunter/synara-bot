/**
 * Title: cooldowns.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Only sends message if user is not on cooldown.
 */

const {
    isCooldownActive,
    updateCooldown
} = require('../../utils/cooldowns');

async function handleCooldown(message) {

    if (
        isCooldownActive(
            message.author.id
        )
    ) {

        return true;
    }

    updateCooldown(
        message.author.id
    );

    return false;
}

module.exports = {
    handleCooldown
};
