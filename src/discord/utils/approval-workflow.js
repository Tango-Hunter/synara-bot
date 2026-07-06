/**
 * Title: approval-workflow.js
 * Author: Tango Hunter
 * Date Created: 7/5/26
 * Description: Shared approval workflow utilities.
 * This utility standardizes approval buttons and approval helpers used throughout SYNARA.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

/*
============================
BUTTON ROW
============================
*/

function createApprovalButtons({

    approveId,

    cancelId,

    approveLabel = "Approve",

    cancelLabel = "Cancel"

}) {

    return new ActionRowBuilder()

        .addComponents(

            new ButtonBuilder()

                .setCustomId(

                    approveId

                )

                .setLabel(

                    approveLabel

                )

                .setStyle(

                    ButtonStyle.Success

                ),

            new ButtonBuilder()

                .setCustomId(

                    cancelId

                )

                .setLabel(

                    cancelLabel

                )

                .setStyle(

                    ButtonStyle.Danger

                )

        );

}

/*
============================
HELPERS
============================
*/

function isApproval(

    interaction,

    approveId

) {

    return (

        interaction.isButton()

        &&

        interaction.customId ===

        approveId

    );

}

function isCancellation(

    interaction,

    cancelId

) {

    return (

        interaction.isButton()

        &&

        interaction.customId ===

        cancelId

    );

}

/*
============================
FOOTER
============================
*/

function buildApprovalFooter() {

    return (
        "Review this preview carefully before approving."
    );

}

module.exports = {
    createApprovalButtons,
    isApproval,
    isCancellation,
    buildApprovalFooter
};
