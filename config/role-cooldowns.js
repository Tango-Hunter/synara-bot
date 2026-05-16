/**
 * Title: role-cooldowns.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Sets cooldown for SYNARA responses based upon role.
 */

module.exports = {

    defaultCooldown: 20,

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
};
