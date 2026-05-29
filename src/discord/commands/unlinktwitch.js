/**
 * Title: unlinktwitch.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Date Modified: 5/29/26
 * Description: Prompt for the !unlinktwitch command.
 */

const {
    disableNotifications
} = require('../../core/database/twitch-repository');


async function handleUnlinkTwitch(
    message
) {

    await disableNotifications(

        message.author.id
    );

    return {
        message:
            'Twitch notifications disabled.'
    };
}

module.exports = {
    handleUnlinkTwitch
};
