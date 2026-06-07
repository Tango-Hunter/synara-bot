/**
 * Title: register-admin-commands.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/24/26
 * Description: Registers admin slash commands.
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
    logFeature
} = require('../../core/logging/logger');


const commands = [

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

    new SlashCommandBuilder()

        .setName(
            'commands'
        )

        .setDescription(
            'View available admin commands.'
        ),

    new SlashCommandBuilder()

        .setName(
            'features'
        )

        .setDescription(
            'View all guild feature flags.'
        ),

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
