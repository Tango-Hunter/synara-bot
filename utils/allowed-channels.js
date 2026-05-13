/**
 * Title: cooldowns.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Permits Bot responses on only allowed channels.
 */

function isAllowedChannel(channelId, allowedChannels) {

    return allowedChannels.includes(channelId);
}

module.exports = {
    isAllowedChannel
};
