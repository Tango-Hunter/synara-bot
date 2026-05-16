/**
 * Title: cooldowns.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Permits Bot responses on only allowed channels.
 */

const settings =
    require('../config/settings');

function isAllowedChannel(channelId) {

    return settings.allowedChannels.includes(channelId);
}

module.exports = {
    isAllowedChannel
};
