/**
 * Title: onboarding-config.js
 * Author: Tango Hunter
 * Date Created: 5/26/26
 * Date Modified: 5/26/26
 * Description: Configures server settings for onboarding.
 */

const onboardingConfig = {

    /*
    ============================
    SERVER 1 Hunter's Lodge
    ============================
    */

    '1416462287341883477': {

        verifiedRoleId:
            '1429898326370816020',

        welcomeChannelId:
            '1416462288575135746'
    },

    /*
    ============================
    SERVER 2 Void Army
    ============================
    */

    '1430018484775030919': {

        verifiedRoleId:
            '1431758489784684693',

        welcomeChannelId:
            '1430018485408366740'
    }
};

function getGuildOnboardingConfig(
    guildId
) {

    return onboardingConfig[
        guildId
    ];
}

module.exports = {
    getGuildOnboardingConfig
};
