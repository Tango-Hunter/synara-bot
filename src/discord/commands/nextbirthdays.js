/**
 * Title: nextbirthdays.js
 * Author: Tango Hunter
 * Date Created: 6/15/26
 * Description: Displays upcoming birthdays.
 */

const {
    EmbedBuilder
} = require('discord.js');

const {
    getUpcomingBirthdays
} = require('../../core/database/birthday-repository');

const {
    MONTHS
} = require('../utils/birthday-utils');


async function runNextBirthdaysCommand({

    message
}) {

    const now = new Date();

    const currentMonth =
        now.getUTCMonth() + 1;

    const allowedMonths =
        [];

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        allowedMonths.push(

            (
                (
                    currentMonth - 1
                )

                + i
            )

            % 12

            + 1
        );
    }

    const birthdays =
        await getUpcomingBirthdays({

            guildId:
                message.guild.id
        });

    const filteredBirthdays =
        birthdays.filter(

            birthday =>

                allowedMonths.includes(
                    birthday.month
                )
        );

    const grouped =
        {};

    for (
        const birthday of filteredBirthdays
    ) {

        if (

            !grouped[
                birthday.month
            ]

        ) {

            grouped[
                birthday.month
            ] = [];
        }

        grouped[
            birthday.month
        ]

        .push(
            birthday
        );
    }

    const embed =
        new EmbedBuilder()

            .setTitle(
                'Upcoming Birthdays'
            )

            .setColor(
                0x00FF78
            );

    for (
        const month of allowedMonths
    ) {

        const entries =
            grouped[
                month
            ];

        if (
            !entries?.length
        ) {

            continue;
        }

        const value =
            entries

                .map(

                    birthday =>

`${birthday.day} - <@${birthday.user_id}>`
                )

                .join(
                    '\n'
                );

        embed.addFields({

            name:
                MONTHS[
                    month - 1
                ],

            value
        });
    }

    if (
        embed.data.fields?.length
        === 0
    ) {

        embed.setDescription(
            'No upcoming birthdays found.'
        );
    }

    return {
        embed
    };
}

module.exports = {
    runNextBirthdaysCommand
};
