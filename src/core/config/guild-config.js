/**
 * Title: guild-config.js
 * Author: Tango Hunter
 * Date Created: 5/26/26
 * Date Modified: 5/26/26
 * Description: Centralized configuration for server features.
 */

const guildConfig = {

    // ============================
    // Hunter's Lodge
    // ============================

    '1416462287341883477': {

        name:
            "Hunter's Lodge",

        onboarding: {

            verifiedRoleId:
                '1429898326370816020', // Member

            welcomeChannelId:
                '1416462288575135746', // #general
            
            rolesChannelId:
                '1429878832327950397', // #roles

            introChannelId:
                '1430195687953268746'  // #introductions
        },

        moderation: {

            modappApplyChannelId:
                '1429878832327950397', // #roles

            modappApplyMessageId:
                '1509947114581659828',

            modappSubmissionsChannelId:
                '1508895532444291282', // #mod-submissions

            adminRoleIds: [

                '1419382716931248431'  // Admin
            ],

            moderatorRoleIds: [

                '1429896603136823509'  // Mod
            ]
        },

        streaming: {

            leadershipLiveChannelId:
                '1429842283984851026',

            selfPromoChannelId:
                '1429853723789889618'
        },

        schedulers: {

            qotdChannelId:
                '1416462288575135746', // #general

            nightlyChannelId:
                '1416462288575135746', // #general

            logsChannelId:
                '1508895479335878866' // #synara-logs
        }
    },

    // ============================
    // Void Army
    // ============================

    '1430018484775030919': {

        name:
            'Void Army',

        onboarding: {

            verifiedRoleId:
                '1431758489784684693', // Void Soldiers

            welcomeChannelId:
                '1430018485408366740', // #general
            
            rolesChannelId:
                '1440738723171143743', // #roles

            introChannelId:
                '1440381569356529815'  // #introductions
        },

        moderation: {

            modappApplyChannelId:
                '1504828980161810442', // #mod-applications

            modappApplyMessageId:
                '1507825511676641372',

            modappSubmissionsChannelId:
                '1507747532808388659', // #mod-submissions

            adminRoleIds: [

                '1432358756376645632', // Owner
                '1433485270472331335', // Co-Owners / Void Commanders
                '1430210622242689147'  // Admins / Void Captains
            ],

            moderatorRoleIds: [

                '1433452708106338447'  // Mods / Void Sergeants
            ]
        },

        streaming: {

            leadershipLiveChannelId:
                '1431762127936557066',

            selfPromoChannelId:
                '1432706292811694110'
        },

        schedulers: {

            qotdChannelId:
                '1430018485408366740',  // #general

            nightlyChannelId:
                '1430018485408366740',  // #general

            logsChannelId:
                '1508898030060044471'  // #synara-logs
        }
    },
    
    // ============================
    // Ghosty's Clubhouse
    // ============================
    
    '1365571082387722380': {

        name:
            "Ghosty's Clubhouse",

        onboarding: {

            verifiedRoleId:
                '1365763423920717986', // Club Members

            welcomeChannelId:
                '1365717743562788874', // #welcome
            
            rolesChannelId:
                '1365717818909135000', // #roles

            introChannelId:
                '1365887878327959614'  // #introductions
        },

        moderation: {

            modappApplyChannelId:
                '1448483511467114589', // #mod-applications

            modappApplyMessageId:
                '1511429367228796970',

            modappSubmissionsChannelId:
                '1511404977153900655', // #mod-submissions

            adminRoleIds: [

                '1365572568806985819'  // Admins
            ],

            moderatorRoleIds: [

                '1438929415194017944'  // Mods
            ]
        },

        streaming: {

            leadershipLiveChannelId:
                '1365831678869897257',

            selfPromoChannelId:
                '1365832165211766857'
        },

        schedulers: {

            qotdChannelId:
                '1511430822002036877',  // #qotd

            nightlyChannelId:
                '1365883797454717019',  // #positivity-boost

            logsChannelId:
                '1365733928685797568'  // #server-updates
        }
    }
};

function getGuildConfig(
    guildId
) {

    return guildConfig[
        guildId
    ];
}

module.exports = {
    guildConfig,
    getGuildConfig
};
