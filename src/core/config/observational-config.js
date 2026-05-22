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

        '1429854951378518198', // Hunter's Lodge announcements
        '1429842283984851026', // Hunter's Lodge stream-updates
        '1429853679229341868', // Hunter's Lodge scheduled-events
        '1502334185531113754', // Hunter's Lodge schedule-updates
        '1472682346854482033', // Hunter's Lodge tech-streams
        '1429853723789889618', // Hunter's Lodge self-promo
        '1429887231782551712', // Hunter's Lodge bot-logs
        '1504828980161810442', // Void Army mod-application
        '1431762127936557066', // Void Army streaming-is-happening
        '1432372596367822858', // Void Army stream-schedule
        '1432387780377317589', // Void Army announcements
        '1432886666367991930', // Void Army dbd-codes
        '1440421462086520963'  // Void Army bot-logs
    ]
};

module.exports = {
    observationConfig
};
