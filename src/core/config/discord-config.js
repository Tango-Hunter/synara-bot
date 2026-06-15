/**
 * Title: discord-config.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 5/20/26
 * Description: Centralized Discord platform configuration.
 */

const discordConfig = {

    cooldowns: {

        commands: 10,

        mentions: 15,

        defaultResponse: 20,

        moderatorResponse: 5,

        adminResponse: 0,

        drawUser: 300,

        drawServer: 120
    },

    embeds: {

        enabled: true
    }
};

module.exports = {
    discordConfig
};
