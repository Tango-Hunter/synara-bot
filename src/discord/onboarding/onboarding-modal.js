/**
 * Title: onboarding-modal.js
 * Author: Tango Hunter
 * Date Created: 5/26/26
 * Date Modified: 5/26/26
 * Description: Manages modal for onboarding.
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');


function buildVerificationModal() {

    const modal =
        new ModalBuilder()

            .setCustomId(
                'verification_modal'
            )

            .setTitle(
                'Rule Verification'
            );

    const input =
        new TextInputBuilder()

            .setCustomId(
                'verification_response'
            )

            .setLabel(
                'Type: I understand'
            )

            .setPlaceholder(
                'I understand'
            )

            .setRequired(
                true
            )

            .setStyle(
                TextInputStyle.Short
            );

    modal.addComponents(

        new ActionRowBuilder()

            .addComponents(
                input
            )
    );

    return modal;
}

module.exports = {
    buildVerificationModal
};
