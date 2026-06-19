/**
 * Title: birthday-handler.js
 * Author: Tango Hunter
 * Date Created: 6/15/26
 * Description: Birthday interactions.
 */

const {
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

const {
    getBirthday,
    updateBirthday
} = require('../../core/database/birthday-repository');

const {
    formatBirthday
} = require('../utils/birthday-utils');


/*
============================
BIRTHDAY MODAL
============================
*/
function buildBirthdayModal() {

    const input =

        new TextInputBuilder()

            .setCustomId(
                'birthday_date'
            )

            .setLabel(
                'Birthday (MM/DD)'
            )

            .setPlaceholder(
                '06/15'
            )

            .setRequired(
                true
            )

            .setStyle(
                TextInputStyle.Short
            );

    const row =

        new ActionRowBuilder()

            .addComponents(
                input
            );

    return new ModalBuilder()

        .setCustomId(
            'birthday_submit'
        )

        .setTitle(
            'Birthday Registration'
        )

        .addComponents(
            row
        );
}

async function handleBirthdayInteraction(
    interaction
) {

    /*
    ============================
    BUTTON
    ============================
    */

    if (
        interaction.isButton()

        &&

        interaction.customId ===
        'birthday_modal'

    ) {
        return await interaction.showModal(

            buildBirthdayModal()
        );
    }

    /*
    ============================
    MODAL SUBMIT
    ============================
    */

    if (

        interaction.isModalSubmit()

        &&

        interaction.customId ===
        'birthday_submit'

    ) {
        const value =
            interaction.fields.getTextInputValue(
                'birthday_date'
            );

        const match =
            value.match(

                /^(\d{1,2})\/(\d{1,2})$/
            );

        if (
            !match
        ) {
            return await interaction.reply({

                content:
                    'Invalid date format. Use MM/DD.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        const month =
            Number(
                match[1]
            );

        const day =
            Number(
                match[2]
            );

        if (

            month < 1

            ||

            month > 12

            ||

            day < 1

            ||

            day > 31

        ) {
            return await interaction.reply({

                content:
                    'Invalid date. Use MM/DD.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        const existingBirthday =
            await getBirthday({

                guildId:
                    interaction.guild.id,

                userId:
                    interaction.user.id
            });

        await updateBirthday({

            guildId:
                interaction.guild.id,

            userId:
                interaction.user.id,

            month,

            day
        });

        const formattedDate =
            formatBirthday(

                month,

                day
            );

        const response =

            existingBirthday

                ?

`🎂 Birthday Updated

Your birthday has been updated to ${formattedDate}.`

                :

`🎂 Birthday Registered

Your birthday has been set for ${formattedDate}.

SYNARA will remember this date for future celebrations.`;

        return await interaction.reply({

            content:
                response,

            flags:
                MessageFlags.Ephemeral
        });
    }

    return false;
}

module.exports = {
    handleBirthdayInteraction
};
