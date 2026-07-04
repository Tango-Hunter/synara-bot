/**
 * Title: admin-command-router.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/24/26
 * Description: Routes admin slash commands.
 */

/**
 * IMPORTANT NOTE: 
 * THIS TERMINAL COMMAND MUST BE LAUNCHED EACH TIME COMMANDS ARE CREATED, UPDATED, OR DELETED:
 * npm run register-commands
 */

const {
    MessageFlags
} = require('discord.js');

const {
    handleDocsCommand
} = require("./commands/docs");

const {
    handleModAppsCommand
} = require('./commands/modapps');

const {
    handleAdminCommands
} = require('./commands/commands');

const {
    handleFeatureCommand
} = require('./commands/feature');

const {
    handleFeaturesCommand
} = require('./commands/features');

const {
    handleSettingsCommand
} = require('./commands/settings');

const {
    handleEmbedCommand
} = require('./commands/embed');

const {
    handleStickyCommand
} = require('./commands/sticky');

const {
    handleEventCommand
} = require('./commands/event');

const {
    handleSetChannelCommand
} = require('./commands/setchannel');

const {
    handleSetRoleCommand
} = require('./commands/setrole');

const {
    handleRemoveRoleCommand
} = require('./commands/removerole');

const {
    handleSetUserCommand
} = require('./commands/setuser');

const {
    handleIgnoreChannelCommand
} = require('./commands/ignorechannel');

const {
    hasAdminPermissions
} = require('./permission-check');

const {
    logFeature
} = require('../../core/logging/logger');


async function routeAdminCommand(
    interaction
) {

    /*
    ============================
    ONLY SLASH COMMANDS
    ============================
    */

    if (
        !interaction.isChatInputCommand()
    ) {

        return;
    }

    /*
    ============================
    ADMIN PERMISSION CHECK
    ============================
    */

    if (
        !await hasAdminPermissions(
            interaction
        )
    ) {

        logFeature({

            category:
                'ADMIN',

            message:
                'Administrative command denied',

            details: {

                guildName:
                    interaction.guild.name,

                guildId:
                    interaction.guild.id,

                userId:
                    interaction.user.id,

                username:
                    interaction.user.username,

                command:
                    interaction.commandName
            }
        });

        return await interaction.reply({

            content:
                'You do not have permission to use administrative commands.',

            flags:
                MessageFlags.Ephemeral
        });
    }

    /*
    ============================
    DOCUMENTATION
    ============================
    */

    if (
        interaction.commandName ===
        "docs"
    ) {

        return await handleDocsCommand(
            interaction
        );
    }

    /*
    ============================
    MOD APPS
    ============================
    */

    if (
        interaction.commandName ===
        'modapps'
    ) {

        return await handleModAppsCommand(
            interaction
        );
    }

    /*
    ============================
    COMMAND LIST
    ============================
    */

    if (
        interaction.commandName ===
        'commands'
    ) {

        return await handleAdminCommands(
            interaction
        );
    }

    /*
    ============================
    FEATURE ENABLE/DISABLE
    ============================
    */

    if (
        interaction.commandName ===
        'feature'
    ) {

        return await handleFeatureCommand(
            interaction
        );
    }

    /*
    ============================
    FEATURES LIST
    ============================
    */

    if (
        interaction.commandName ===
        'features'
    ) {

        return await handleFeaturesCommand(
            interaction
        );
    }

    /*
    ============================
    SETTINGS LIST
    ============================
    */
    if (
        interaction.commandName ===
        'settings'
    ) {
        return await handleSettingsCommand(
            interaction
        );
    }

    /*
    ============================
    CUSTOM EMBED
    ============================
    */
    if (

        interaction.commandName ===
        'embed'

    ) {

        return await handleEmbedCommand(
            interaction
        );
    }

    /*
    ============================
    STICKY
    ============================
    */
    if (

        interaction.commandName ===
        'sticky'

    ) {

        return await handleStickyCommand(
            interaction
        );
    }

    /*
    ============================
    EVENT
    ============================
    */
    if (
        interaction.commandName ===
        'event'
    ) {

        return await handleEventCommand(
            interaction
        );
    }

    /*
    ============================
    SET CHANNEL
    ============================
    */
    if (
        interaction.commandName ===
        'setchannel'
    ) {

        return await handleSetChannelCommand(
            interaction
        );
    }

    /*
    ============================
    IGNORE CHANNEL
    ============================
    */
    if (
        interaction.commandName ===
        'ignorechannel'
    ) {

        return await handleIgnoreChannelCommand(
            interaction
        );
    }

    /*
    ============================
    SET ROLE
    ============================
    */
    if (
        interaction.commandName ===
        'setrole'
    ) {

        return await handleSetRoleCommand(
            interaction
        );
    }

    /*
    ============================
    REMOVE ROLE
    ============================
    */
    if (
        interaction.commandName ===
        'removerole'
    ) {

        return await handleRemoveRoleCommand(
            interaction
        );
    }

    /*
    ============================
    SET USER
    ============================
    */
    if (
        interaction.commandName ===
        'setuser'
    ) {

        return await handleSetUserCommand(
            interaction
        );
    }
}

module.exports = {
    routeAdminCommand
};
