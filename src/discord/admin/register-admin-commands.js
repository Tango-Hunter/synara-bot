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

const userChoices = [

    {
        name: 'Counting Bot',
        value: 'Counting Bot'
    },

    {
        name: 'Server Leader',
        value: 'Server Leader'
    }
];


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
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'blacklist-add'
                    )

                    .setDescription(
                        'Add a user to the moderator application blacklist.'
                    )

                    .addUserOption(

                        option =>

                            option

                                .setName(
                                    'user'
                                )

                                .setDescription(
                                    'User to blacklist'
                                )

                                .setRequired(
                                    true
                                )
                    )
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'blacklist-remove'
                    )

                    .setDescription(
                        'Remove a user from the moderator application blacklist.'
                    )

                    .addUserOption(

                        option =>

                            option

                                .setName(
                                    'user'
                                )

                                .setDescription(
                                    'User to remove'
                                )

                                .setRequired(
                                    true
                                )
                    )
        )

        .addSubcommand(

            subcommand =>

                subcommand

                    .setName(
                        'blacklist-list'
                    )

                    .setDescription(
                        'View blacklisted moderator applicants.'
                    )
        ),

    /*
    ============================
    CUSTOM EMBED
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'embed'
        )

        .setDescription(
            'Create a custom SYNARA embed.'
        ),

    /*
    ============================
    CUSTOM EVENT
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'event'
        )

        .setDescription(
            'Create and manage events.'
        )

        .addStringOption(

            option =>

                option

                    .setName(
                        'type'
                    )

                    .setDescription(
                        'Event type'
                    )

                    .setRequired(
                        true
                    )

                    .addChoices(

                        {

                            name:
                                'Scheduled Event',

                            value:
                                'scheduled'
                        },

                        {

                            name:
                                'Manage Scheduled Event',

                            value:
                                'manage'
                        }
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
                        ...roleChoices
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

                        ...roleChoices.filter(

                            choice =>

                                choice.value === 'Admin'

                                ||

                                choice.value === 'Moderator'
                        )
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
    SET USER
    ============================
    */
    new SlashCommandBuilder()

        .setName(
            'setuser'
        )

        .setDescription(
            'Configure a user setting.'
        )

        .addStringOption(

            option =>

                option

                    .setName(
                        'setting'
                    )

                    .setDescription(
                        'User setting'
                    )

                    .setRequired(
                        true
                    )

                    .addChoices(
                        ...userChoices
                    )
        )

        .addUserOption(

            option =>

                option

                    .setName(
                        'user'
                    )

                    .setDescription(
                        'User'
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
