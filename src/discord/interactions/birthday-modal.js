/**
 * Title: birthday-modal.js
 * Author: Tango Hunter
 * Date Created: 6/15/26
 * Description: Birthday modal creation.
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');


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

module.exports = {
    buildBirthdayModal
};
