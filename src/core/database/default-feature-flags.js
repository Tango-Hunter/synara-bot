/**
 * Title: default-feature-flags.js
 * Author: Tango Hunter
 * Date Created: 6/6/26
 * Description: Default feature set for new guilds.
 */

const DEFAULT_FEATURE_FLAGS = [

    {

        name:
            'onboarding',

        description:
            'Member onboarding and verification'
    },

    {

        name:
            'modApplications',

        description:
            'Moderator applications'
    },

    {

        name:
            'observations',

        description:
            'AI observations'
    },

    {

        name:
            'qotdScheduler',

        description:
            'Question of the Day'
    },

    {

        name:
            'motivationalScheduler',

        description:
            'Nightly motivational messages'
    },

    {

        name:
            'twitchMonitoring',

        description:
            'Twitch live notifications'
    }
];

function getFeatureNames() {

    return DEFAULT_FEATURE_FLAGS.map(

        feature => feature.name
    );
}

function getFeatureChoices() {

    return DEFAULT_FEATURE_FLAGS.map(

        feature => ({

            name:
                feature.name,

            value:
                feature.name
        })
    );
}

module.exports = {
    DEFAULT_FEATURE_FLAGS,
    getFeatureNames,
    getFeatureChoices
};
