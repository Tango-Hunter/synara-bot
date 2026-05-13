/**
 * Title: self-protection.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Prevents bot from responding to its own messages.
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

    return false;
}

module.exports = {
    shouldIgnoreMessage
};
