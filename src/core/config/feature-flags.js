/**
 * Title: feature-flags.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 5/20/26
 * Description: Centralized feature enable/disable flags.
 */

const featureFlags = {

    aiResponses: true,

    qotdScheduler: true,

    nightlyScheduler: true,

    embeds: false,

    twitchMonitoring: false
};

module.exports = {
    featureFlags
};
