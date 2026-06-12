/**
 * Title: observation-config.js
 * Author: Tango Hunter
 * Date Created: 5/22/26
 * Description: Controls autonomous observation behavior.
 */

const {
    ChannelType
} = require('discord.js');


const observationConfig = {

    enabled: true,
    minimumMessages: 12,
    observationChance: 0.10, // Update this after feature flags
    cooldownMinutes: 10,
}

module.exports = {
    observationConfig
};
