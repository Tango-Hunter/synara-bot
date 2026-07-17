/**
 * Title: default-feature-flags.js
 * Author: Tango Hunter
 * Date Created: 6/6/26
 * Description: Default feature set for new guilds.
 */

const DEFAULT_FEATURE_FLAGS = [

    {
        id:
            'birthdays',
        name:
            'birthdays',
        description:
            'Birthday tracking and announcements'
    },

    {
        id:
            'bonks',
        name:
            'bonks',
        description:
            'Community bonk system'
    },

    {
        id:
            'content_creator',
        name:
            'contentCreatorAnnouncements',
        description:
            'Content Creator Announcements'
    },

    {
        id:
            'counting_penalties',
        name:
            'countingPenalties',
        description:
            'Counting game failure tracking'
    },

    {
        id:
            'modapps',
        name:
            'modApplications',
        description:
            'Moderator applications'
    },

    {
        id:
            'nightly_motivation',
        name:
            'motivationalScheduler',
        description:
            'Nightly motivational messages'
    },

    {
        id:
            'observations',
        name:
            'observations',
        description:
            'AI observations'
    },

    {
        id:
            'onboarding',
        name:
            'onboarding',
        description:
            'Member onboarding and verification'
    },

    {
        id:
            'qotd',
        name:
            'qotdScheduler',
        description:
            'Question of the Day'
    },

    {
        id:
            'scheduled_events',
        name:
            'scheduledEvents',
        description:
            'Recurring events and automation framework'
    },

    {
        id:
            'twitch_monitoring',
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

/*
====================================
FEATURE LOOKUPS
====================================
*/

function getFeatureFlagName(
    registryId
) {

    return (

        DEFAULT_FEATURE_FLAGS.find(

            feature =>

                feature.id ===

                registryId

        )

        ||

        {}

    ).name ?? null;

}

function getRegistryId(
    featureName
) {

    return (

        DEFAULT_FEATURE_FLAGS.find(

            feature =>

                feature.name ===

                featureName

        )

        ||

        {}

    ).id ?? null;

}

module.exports = {
    DEFAULT_FEATURE_FLAGS,
    getFeatureNames,
    getFeatureChoices,
    getFeatureFlagName,
    getRegistryId
};
