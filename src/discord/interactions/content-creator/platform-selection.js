/**
 * Title: platform-selection.js
 * Author: Tango Hunter
 * Date Created: 7/17/26
 * Description: Supported Content Creator platform definitions.
 * Updates to this file must include updates to the corresponding platform file AND the registry and content-creator.md in the docs.
 */

const CONTENT_PLATFORMS = [

    {

        id:
            'youtube',

        label:
            'YouTube',

        emoji:
            '📺'

    },

    {

        id:
            'tiktok',

        label:
            'TikTok',

        emoji:
            '🎵'

    }
];

/*
====================================
GETTERS
====================================
*/

function getSupportedPlatforms() {

    return CONTENT_PLATFORMS;

}

function getPlatformOptions() {

    return CONTENT_PLATFORMS.map(

        platform => ({

            label:

                platform.label,

            value:

                platform.id,

            emoji:

                platform.emoji

        })
    );
}

function getPlatform(

    platformId

) {

    return (

        CONTENT_PLATFORMS.find(

            platform =>

                platform.id ===

                platformId

        )

        ||

        null

    );
}

function getPlatformLabel(

    platformId

) {

    return (

        getPlatform(

            platformId

        )?.label

        ??

        platformId

    );
}

/*
====================================
EXPORTS
====================================
*/

module.exports = {
    CONTENT_PLATFORMS,
    getSupportedPlatforms,
    getPlatformOptions,
    getPlatform,
    getPlatformLabel
};
