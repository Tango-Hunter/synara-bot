/**
 * Title: admin-command-router.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/24/26
 * Description: Routes admin slash commands.
 */

/**
 * IMPORTANT NOTE: 
 * THIS FILE MUST BE LAUNCHED TO NODE EACH TIME COMMANDS ARE CREATED, UPDATED, OR DELETED
 * npm run register-commands
 */

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
        !hasAdminPermissions(
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

            ephemeral:
                true
        });
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
}

module.exports = {
    routeAdminCommand
};
