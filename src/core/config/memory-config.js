/**
 * Title: memory-config.js
 * Author: Tango Hunter
 * Date Created: 5/21/26
 * Date Modified: 5/22/26
 * Description: Centralized conversational memory configuration.
 */

const memoryConfig = {

    enabled: true,

    maxMemoriesPerUser: 15,

    maxMemoryLength: 500,

    recentConversationLimit: 15,

    supportedPlatforms: [

        'discord',
        'twitch'
    ]
};

module.exports = {
    memoryConfig
};
