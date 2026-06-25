/**
 * Title: observation-manager.js
 * Author: Tango Hunter
 * Date Created: 5/22/26
 * Description: Tracks passive environmental activity.
 */

const {
    observationConfig
} = require('../config/observational-config');

const {
    getUserDisplayName
} = require('../../discord/utils/user-display-name');

const {
    isIgnoredChannel
} = require('../database/ignored-channels-repository');

const {
    getFeatureFlag
} = require('../database/feature-flags-repository');


const activityMap = new Map();

let lastObservation =
    0;

async function trackMessage(
    message
) {

    const observationsEnabled =
        await getFeatureFlag({

            guildId:
                message.guild.id,

            featureName:
                'observations'
        });

    if (
        !observationsEnabled
    ) {
        return;
    }

    if (
        await isIgnoredChannel({

            guildId:
                message.guild.id,

            channelId:
                message.channel.id
        })
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

    const displayName =
        await getUserDisplayName(
            message.member
        );

    messages.push({

        author:
            displayName,
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
