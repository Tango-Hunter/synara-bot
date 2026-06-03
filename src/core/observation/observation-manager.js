/**
 * Title: observation-manager.js
 * Author: Tango Hunter
 * Date Created: 5/22/26
 * Date Modified: 5/22/26
 * Description: Tracks passive environmental activity.
 */

const {
    observationConfig
} = require('../config/observational-config');

const {
    getGuildConfig
} = require('../config/guild-config');

const activityMap = new Map();

let lastObservation =
    0;

function trackMessage(
    message
) {

    const guildConfig =
        getGuildConfig(
            message.guild.id
        );

    if (
        !guildConfig?.features?.observations
    ) {
        return;
    }

    if (

        observationConfig.ignoredChannels.includes(
            message.channel.id
        )
    ) {

        return;
    }

    const channelId =
        message.channel.id;

    if (
        !activityMap.has(
            channelId
        )
    ) {

        activityMap.set(
            channelId,
            []
        );
    }

    const messages =
        activityMap.get(
            channelId
        );

    messages.push({

        author:
            message.author.username,
        content:
            message.content,
        timestamp:
            Date.now()
    });

    while (
        messages.length >
        observationConfig.minimumMessages
    ) {

        messages.shift();
    }
}

function canObserve() {

    const now =
        Date.now();

    const cooldown =
        observationConfig.cooldownMinutes
        * 60
        * 1000;

    return (
        now - lastObservation >
        cooldown
    );
}

function updateObservationTime() {

    lastObservation =
        Date.now();
}

function getChannelActivity(
    channelId
) {

    return (
        activityMap.get(
            channelId
        ) || []
    );
}

module.exports = {
    trackMessage,
    canObserve,
    updateObservationTime,
    getChannelActivity
};
