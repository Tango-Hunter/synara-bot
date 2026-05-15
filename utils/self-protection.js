/**
 * Title: self-protection.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Prevents bot from responding to bots, itself, mass mentions, and role pings.
 */

function shouldIgnoreMessage(message, client) {

    // Ignore all bots
    if (message.author.bot) {
        return true;
    }

    // Ignore self
    if (message.author.id === client.user.id) {
        return true;
    }

    // Ignore @everyone and @here
    if (message.mentions.everyone) {
        return true;
    }

    // Ignore role mentions
    if (message.mentions.roles.size > 0) {
        return true;
    }

    return false;
}

module.exports = {
    shouldIgnoreMessage
};
