/**
 * Title: register-admin-commands.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/24/26
 * Description: Registers admin slash commands.
 */

/**
 * IMPORTANT NOTE: 
 * THIS TERMINAL COMMAND MUST BE LAUNCHED EACH TIME COMMANDS ARE CREATED, UPDATED, OR DELETED:
 * npm run register-commands
 */

const {
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');

require('dotenv').config();

const {
    getFeatureChoices
} = require('../../core/database/default-feature-flags');

const {
    getChannelSettings,
    getRoleSettings
} = require('../../core/database/default-guild-settings');

const {
    logFeature
} = require('../../core/logging/logger');


const channelChoices =
    getChannelSettings()
        .map(
            setting => ({

                name:
                    setting.displayName,

                value:
                    setting.displayName
            })
        );

const roleChoices =
    getRoleSettings()
        .map(
            setting => ({

                name:
                    setting.displayName,

                value:
                    setting.displayName
            })
        );


const commands = [

    /*
    ============================
    MOD APPS
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'modapps'
        )
        .setDescription(
            'Moderator application controls.'
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'open'
                    )
                    .setDescription(
                        'Open moderator applications.'
                    )
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'close'
                    )
                    .setDescription(
                        'Close moderator applications.'
                    )
        ),

    /*
    ============================
    COMMAND LIST
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'commands'
        )

        .setDescription(
            'View available admin commands.'
        ),

    /*
    ============================
    FEATURES LIST
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'features'
        )

        .setDescription(
            'View all guild feature flags.'
        ),

    /*
    ============================
    FEATURE ENABLE/DISABLE
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'feature'
        )

        .setDescription(
            'Enable or disable a feature.'
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'enable'
                    )

                    .setDescription(
                        'Enable a feature.'
                    )

                    .addStringOption(

                        option => {

                            option

                                .setName(
                                    'feature'
                                )

                                .setDescription(
                                    'Feature name'
                                )

                                .setRequired(
                                    true
                                );

                            option.addChoices(

                                ...getFeatureChoices()
                            );

                            return option;
                        }
                    )
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'disable'
                    )

                    .setDescription(
                        'Disable a feature.'
                    )

                    .addStringOption(

                        option => {

                            option

                                .setName(
                                    'feature'
                                )

                                .setDescription(
                                    'Feature name'
                                )

                                .setRequired(
                                    true
                                );

                            option.addChoices(

                                ...getFeatureChoices()
                            );

                            return option;
                        }
                    )
        ),
    
    /*
    ============================
    SETTINGS LIST
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'settings'
        )

        .setDescription(
            'View guild settings.'
        ),

    /*
    ============================
    SET CHANNEL
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'setchannel'
        )

        .setDescription(
            'Configure a channel setting.'
        )

        .addStringOption(

            option =>

                option

                    .setName(
                        'setting'
                    )

                    .setDescription(
                        'Channel setting'
                    )

                    .setRequired(
                        true
                    )

                    .addChoices(
                        ...channelChoices
                    )
        ),

    /*
    ============================
    IGNORE CHANNEL
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'ignorechannel'
        )

        .setDescription(
            'Manage ignored channels.'
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'add'
                    )

                    .setDescription(
                        'Ignore the current channel.'
                    )
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'remove'
                    )

                    .setDescription(
                        'Remove the current channel from ignored channels.'
                    )
        ),

    /*
    ============================
    SET ROLE
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'setrole'
        )

        .setDescription(
            'Add a role setting.'
        )

        .addStringOption(

            option =>

                option

                    .setName(
                        'setting'
                    )

                    .setDescription(
                        'Role type'
                    )

                    .setRequired(
                        true
                    )

                    .addChoices(

                        {
                            name: 'Admin',
                            value: 'Admin'
                        },

                        {
                            name: 'Moderator',
                            value: 'Moderator'
                        },

                        {
                            name: 'Verified',
                            value: 'Verified'
                        }
                    )
        )

        .addRoleOption(

            option =>

                option

                    .setName(
                        'role'
                    )

                    .setDescription(
                        'Role'
                    )

                    .setRequired(
                        true
                    )
        ),

    /*
    ============================
    REMOVE ROLE
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'removerole'
        )

        .setDescription(
            'Remove an admin or moderator role.'
        )

        .addStringOption(

            option =>

                option

                    .setName(
                        'setting'
                    )

                    .setDescription(
                        'Role type'
                    )

                    .setRequired(
                        true
                    )

                    .addChoices(

                        {
                            name: 'Admin',
                            value: 'Admin'
                        },

                        {
                            name: 'Moderator',
                            value: 'Moderator'
                        }
                    )
        )

        .addRoleOption(

            option =>

                option

                    .setName(
                        'role'
                    )

                    .setDescription(
                        'Role'
                    )

                    .setRequired(
                        true
                    )
        ),
];

const rest =
    new REST({

        version: '10'

    }).setToken(
        process.env.DISCORD_TOKEN
    );

(async () => {

    try {

        logFeature({

            category:
                'SYSTEM',

            message:
                'Registering admin commands',

            details: {

                commandCount:
                    commands.length
            }
        });

        await rest.put(

            Routes.applicationCommands(
                process.env.CLIENT_ID
            ),

            {

                body:
                    commands.map(
                        command => command.toJSON()
                    )
            }
        );

        logFeature({

            category:
                'SYSTEM',

            message:
                'Admin commands registered',

            details: {

                commandCount:
                    commands.length
            }
        });

    } catch (error) {

        console.error(
            error
        );
    }
})();
