/**
 * Title: birthday.js
 * Author: Tango Hunter
 * Date Created: 6/15/26
 * Description: Birthday registration command.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const {
    getBirthday
} = require('../../core/database/birthday-repository');

const {
    formatBirthday
} = require('../utils/birthday-utils');


async function runBirthdayCommand({

    message
}) {

    const birthday =

        await getBirthday({

            guildId:
                message.guild.id,

            userId:
                message.author.id
        });

    const hasBirthday =
        !!birthday;

    const embed =
        new EmbedBuilder()

            .setTitle(
                'Birthday Registration'
            )

            .setColor(
                0x00FF78
            );

    if (
        hasBirthday
    ) {

        embed.setDescription(

`Your birthday is currently set to:

**${formatBirthday(

    birthday.month,

    birthday.day
)}**

Would you like to update it?`
        );

    } else {

        embed.setDescription(

`No birthday has been registered.

Would you like to add one?`
        );
    }

    const row =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        'birthday_modal'
                    )

                    .setLabel(

                        hasBirthday

                            ? 'Update Birthday'

                            : 'Set Birthday'
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )
            );

    return {

        embed,

        components: [
            row
        ]
    };
}

module.exports = {
    runBirthdayCommand
};
