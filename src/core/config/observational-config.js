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
        '1434233508942975049', // vent

        // Ghosty's Clubhouse
        '1365712014411825152', // cool-kids-only
        '1416113719540318339', // warning-logs
        '1416116166132367492', // ban-reports
        '1365733928685797568', // server-updates
        '1426397724756148294', // stream-commands
        '1511404977153900655', // mod-app-submissions
        '1511405031826653315', // synara-logs
        '1365711291796291675', // tickets
        '1365717743562788874', // welcome
        '1507577354216542390', // stream-schedule
        '1365711678955589705', // announcements
        '1365711609313497171', // rules
        '1365717818909135000', // roles
        '1448483511467114589', // mod-applications
        '1400930206906322944', // glory-polls
        '1491976557252841572', // levels
        '1365571432775680070', // counting
        '1365834230118088867', // woodsboro
        '1365831678869897257', // important-streams
        '1365832165211766857', // self-promo
        '1365832251614564453', // promo-others
        '1365713907125063723', // venting
        '1365883797454717019', // positivity boosts
        '1365884134689607731'  // mh-resources
        
    ]
};

module.exports = {
    observationConfig
};
