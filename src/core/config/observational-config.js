/**
 * Title: observation-config.js
 * Author: Tango Hunter
 * Date Created: 5/22/26
 * Date Modified: 5/22/26
 * Description: Controls autonomous observation behavior.
 */

const observationConfig = {

    enabled: true,
    minimumMessages: 12,
    observationChance: 0.1,
    cooldownMinutes: 10,
    ignoredChannels: [

        //Hunter's Lodge
        '1429854951378518198', // announcements
        '1429842283984851026', // stream-updates
        '1429853679229341868', // scheduled-events
        '1502334185531113754', // schedule-updates
        '1472682346854482033', // tech-streams
        '1429853723789889618', // self-promo
        '1429887231782551712', // bot-logs

        // Void Army
        '1432372252237631520', // admin-team
        '1440421462086520963', // server-updates
        '1465723909302255789', // owners
        '1440430211618308116', // mee6
        '1458250077901557862', // dont-put-in-poll
        '1507206503445299410', // mod-team
        '1507213922934063196', // mod-rules
        '1507747532808388659', // mod-applications-moderator channel
        '1504828980161810442', // mod-application
        '1431762127936557066', // streaming-is-happening
        '1432372596367822858', // stream-schedule
        '1432387780377317589', // announcements
        '1432886666367991930', // dbd-codes
        
    ]
};

module.exports = {
    observationConfig
};
