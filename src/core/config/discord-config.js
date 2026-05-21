/**
 * Title: discord-config.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 5/20/26
 * Description: Centralized Discord platform configuration.
 */

const discordConfig = {

    channels: {

        qotd: [

            '1430018485408366740', // Void Army #general
            '1416462288575135746'  // Hunter's Lodge #general
        ],

        nightlyMessages: [

            '1430018485408366740', // Void Army #general
            '1416462288575135746'  // Hunter's Lodge #general
        ],

        allowedResponses: [

            //'1500545498745147482', // SYNARA test channel
            '1430018485408366740', // Void Army #general
            '1416462288575135746', // Hunter's Lodge #general
            '1429854951378518198', // Hunter's Lodge #announcements
            '1429842283984851026', // Hunter's Lodge #stream-updates
            '1429853679229341868', // Hunter's Lodge #scheduled-events
            '1472682346854482033', // Hunter's Lodge #tech-streams
            '1500567172055957667', // Hunter's Lodge #synara
            '1429853723789889618'  // Hunter's Lodge #self-promo
        ]
    },

    cooldowns: {

        commands: 10,
        mentions: 15,
        defaultResponse: 20,

        roleCooldowns: {

            // Admin
            '1419382716931248431': 0, // Hunter's Lodge
            '1433485270472331335': 0, // Void Army

            // Moderator
            '1429896603136823509': 5, // Hunter's Lodge
            '1430210622242689147': 5, // Void Army

            // Supporter
            '1429898326370816020': 10, // Hunter's Lodge
            '1431758489784684693': 10  // Void Army
        }
    },

    embeds: {

        enabled: true
    }
};

module.exports = {
    discordConfig
};
