/**
 * Title: broadcast-handler.js
 * Author: Tango Hunter
 * Date Created: 7/7/26
 * Description: Handles all interactions for the SYNARA Broadcast workflow.
 */

const {
    ActionRowBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} = require("discord.js");

const {
    embedThemes
} = require("../../core/config/embed-themes");

const {
    createApprovalButtons,
    isApproval,
    isCancellation,
    buildApprovalFooter
} = require("../utils/approval-workflow");

const {
    resolveBroadcastTargets,
    broadcastEmbeds
} = require("../services/broadcast-service");

const {
    logFeature,
    logError
} = require("../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../core/logging/error-types");


/*
====================================
HELPERS
====================================
*/

const broadcastDrafts = new Map();

function getBroadcastTheme() {

    return embedThemes.broadcast;

}

function createBroadcastEmbed({

    subtitle,

    message

}) {

    const theme =

        getBroadcastTheme();

    return new EmbedBuilder()

        .setColor(

            theme.color

        )

        .setTitle(

            "SYNARA Broadcast"

        )

        .setDescription(

`${theme.icon} **${subtitle}**

${message}`

        )

        .setFooter({

            text:

                theme.footer

        });
}

function createBroadcastPreview({

    subtitle,
    message,
    totalServers,
    totalChannels

}) {

    const theme = getBroadcastTheme();

    return new EmbedBuilder()

        .setColor(
            theme.color
        )

        .setTitle(
            "SYNARA Broadcast"
        )

        .setDescription(

`${theme.icon} **${subtitle}**

${message}`

        )

        .addFields({

            name:
                "Recipients",

            value:

`Servers: **${totalServers}**
Configured Channels: **${totalChannels}**`

        })

        .setFooter({

            text:
                buildApprovalFooter()

        });
}

/*
====================================
MAIN HANDLER
====================================
*/

async function handleBroadcastInteraction(
    interaction
) {

    try {

        /*
        ====================================
        BUTTON INTERACTIONS
        ====================================
        */

        if (

            interaction.isButton()

        ) {

            /*
            ----------------------------
            CREATE BROADCAST
            ----------------------------
            */

            if (

                interaction.customId ===
                "broadcast_create"

            ) {

                const modal =

                    new ModalBuilder()

                        .setCustomId(
                            "broadcast_modal"
                        )

                        .setTitle(
                            "Compose Broadcast"
                        );

                const subtitle =

                    new TextInputBuilder()

                        .setCustomId(
                            "broadcast_subtitle"
                        )

                        .setLabel(
                            "Subtitle"
                        )

                        .setStyle(
                            TextInputStyle.Short
                        )

                        .setRequired(
                            true
                        )

                        .setMaxLength(
                            256
                        );

                const message =

                    new TextInputBuilder()

                        .setCustomId(
                            "broadcast_message"
                        )

                        .setLabel(
                            "Message"
                        )

                        .setStyle(
                            TextInputStyle.Paragraph
                        )

                        .setRequired(
                            true
                        )

                        .setMaxLength(
                            4000
                        );

                modal.addComponents(

                    new ActionRowBuilder()

                        .addComponents(
                            subtitle
                        ),

                    new ActionRowBuilder()

                        .addComponents(
                            message
                        )

                );

                await interaction.showModal(
                    modal
                );

                return true;

            }

        }

        /*
        ====================================
        MODAL SUBMISSION
        ====================================
        */

        if (

            interaction.isModalSubmit()

            &&

            interaction.customId ===
            "broadcast_modal"

        ) {

            await interaction.deferReply({

                flags:
                    MessageFlags.Ephemeral

            });

            const subtitle =
                interaction.fields.getTextInputValue(

                    "broadcast_subtitle"

                ).trim();

            const message =
                interaction.fields.getTextInputValue(

                    "broadcast_message"

                ).trim();

            /*
            ====================================
            RESOLVE RECIPIENTS
            ====================================
            */

            const {

                totalServers,

                targets

            } = await resolveBroadcastTargets(

                interaction.client

            );

            /*
            ====================================
            VALIDATION
            ====================================
            */

            if (
                totalServers === 0
            ) {

                await interaction.editReply({

                    content:
                        "No servers are currently configured to receive broadcasts."

                });

                return true;

            }

            /*
            ====================================
            CREATE DRAFT
            ====================================
            */

            const preview =

                createBroadcastPreview({

                    subtitle,

                    message,

                    totalServers,

                    totalChannels:
                        targets.length

                });

            const draft = {

                subtitle,

                message,

                embeds: [

                    createBroadcastEmbed({

                        subtitle,

                        message

                    })

                ],

                targets

            };

            broadcastDrafts.set(

                interaction.user.id,

                draft

            );

            /*
            ====================================
            APPROVAL BUTTONS
            ====================================
            */

            const row =

                createApprovalButtons({

                    approveId:

                        "broadcast_publish",

                    cancelId:

                        "broadcast_cancel",

                    approveLabel:

                        "Publish"

                });

            /*
            ====================================
            PREVIEW
            ====================================
            */

            await interaction.editReply({

                embeds: [

                    preview

                ],

                components: [

                    row

                ]

            });

            logFeature({

                category:
                    "BROADCAST",

                message:
                    "Broadcast preview created.",

                details: {

                    userId:
                        interaction.user.id,

                    servers:
                        totalServers

                }
            });

            return true;

        }

        /*
        ====================================
        APPROVE BROADCAST
        ====================================
        */

        if (

            isApproval(

                interaction,

                "broadcast_publish"

            )

        ) {

            const draft =
                broadcastDrafts.get(

                    interaction.user.id

                );

            if (
                !draft
            ) {

                await interaction.reply({

                    content:
                        "Broadcast draft not found.",

                    flags:
                        MessageFlags.Ephemeral

                });

                return true;

            }

            await interaction.deferUpdate();

            const results =

                await broadcastEmbeds({

                    embeds:
                        draft.embeds,

                    targets:
                        draft.targets

                });

            broadcastDrafts.delete(

                interaction.user.id

            );

            await interaction.editReply({

                content:

`✅ Broadcast completed successfully.

Servers Attempted: **${results.attempted}**
Successful: **${results.successful}**
Failed: **${results.failed.length}**`,

                embeds: [],

                components: []

            });

            logFeature({

                category:
                    "BROADCAST",

                message:
                    "Broadcast published.",

                details: {

                    userId:
                        interaction.user.id,

                    attempted:
                        results.attempted,

                    successful:
                        results.successful,

                    failed:
                        results.failed.length

                }
            });

            return true;

        }

        /*
        ====================================
        CANCEL BROADCAST
        ====================================
        */

        if (

            isCancellation(

                interaction,

                "broadcast_cancel"

            )

        ) {

            broadcastDrafts.delete(

                interaction.user.id

            );

            await interaction.update({

                content:
                    "Broadcast cancelled.",

                embeds: [],

                components: []

            });

            logFeature({

                category:
                    "BROADCAST",

                message:
                    "Broadcast cancelled.",

                details: {

                    userId:
                        interaction.user.id

                }
            });

            return true;

        }

        return false;

    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.SYSTEM_ERROR,

            source:
                "broadcast-handler",

            message:
                error.message,

            details: {

                error:
                    error.message,

                stack:
                    error.stack,

                guildId:
                    interaction.guild?.id,

                userId:
                    interaction.user?.id,

                interactionId:
                    interaction.customId

            }
        });

        if (

            interaction.deferred ||

            interaction.replied

        ) {

            await interaction.editReply({

                content:
                    "An unexpected error occurred while processing the broadcast.",

                embeds: [],

                components: []

            });

        }

        else {

            await interaction.reply({

                content:
                    "An unexpected error occurred while processing the broadcast.",

                flags:
                    MessageFlags.Ephemeral

            });
        }

        return true;

    }
}

module.exports = {
    handleBroadcastInteraction
};
