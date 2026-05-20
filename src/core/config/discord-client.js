/**
 * Title: discord-client.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/19/26
 * Description: Centralized Discord client instance.
 */

const {

    Client,

    GatewayIntentBits

} = require('discord.js');

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.MessageContent
    ]
});

module.exports = client;
