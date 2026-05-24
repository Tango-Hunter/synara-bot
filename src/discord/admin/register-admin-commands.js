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
      )
];

const rest =
    new REST({

        version: '10'

    }).setToken(
        process.env.DISCORD_TOKEN
    );

(async () => {

    try {

        console.log(
            'Registering admin slash commands...'
        );

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

        console.log(
            'Admin slash commands registered.'
        );

    } catch (error) {

        console.error(
            error
        );
    }
})();
