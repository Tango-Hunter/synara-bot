/**
 * Title: sanitize-message.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Removes "@SYNARA" from the prompt sent to workflow.
 */

function sanitizeMessage(message, client) {

    return message
        .replace(`<@${client.user.id}>`, '')
        .trim();
}

module.exports = {
    sanitizeMessage
};
