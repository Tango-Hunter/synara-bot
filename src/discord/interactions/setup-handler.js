/**
 * Title: setup-handler.js
 * Author: Tango Hunter
 * Date Created: 7/10/26
 * Description: Handles all interactions for the SYNARA Setup Wizard.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const {
    getSession,
    deleteSession,
    hasRemainingFeatures
} = require("./setup/setup-session");

const {
    beginRequiredSetup,
    buildRequiredSettings,
    formatSelection
} = require("./setup/setup-required");

const {
    beginFeatureSetup,
    enableFeature,
    disableFeature,
    configureFeature,
    approveFeature,
    cancelFeature
} = require("./setup/setup-features");

const {
    renderDocument,
    getDocument
} = require("../utils/registry-renderer");

const {
    DEFAULT_GUILD_SETTINGS
} = require("../../core/database/default-guild-settings");

const {
    setGuildSetting
} = require("../../core/database/guild-settings-repository");

const {
    setFeatureFlag
} = require("../../core/database/feature-flags-repository");

const {
    buildApprovalFooter,
    createApprovalButtons,
    isApproval,
    isCancellation
} = require("../utils/approval-workflow");

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

function buildSettingsSummaryEmbed(
    interaction,
    session
) {

    const embed =

        new EmbedBuilder()

            .setColor(

                0x5865F2

            )

            .setTitle(

                "Server Configuration"

            )

            .setDescription(

                "The following server settings will be applied."

            );

    for (

        const [

            setting,
            value

        ]

        of

        Object.entries(

            session.settings

        )

    ) {

        const definition =

            DEFAULT_GUILD_SETTINGS.find(

                item =>

                    item.name ===

                    setting

            );

        embed.addFields({

            name:

                definition?.displayName ??

                setting,

            value:

                formatSelection(

                    interaction.guild,

                    definition,

                    value

                ),

            inline:

                false

        });

    }

    return embed;

}


function buildFeatureSummaryEmbed(
    session
) {

    const enabled =

    session.enabledFeatures

        .map(

            featureId =>

                `🟢 ${

                    getDocument(

                        featureId

                    ).name

                }`

        )

        .join(

            "\n"

        )

        ||

        "*None*";

const disabled =

    session.disabledFeatures

        .map(

            featureId =>

                `🔴 ${

                    getDocument(

                        featureId

                    ).name

                }`

        )

        .join(

            "\n"

        )

        ||

        "*None*";

return new EmbedBuilder()

    .setColor(

        0x5865F2

    )

    .setTitle(

        "Feature Configuration"

    )

    .addFields(

        {

            name:

                "Enabled",

            value:

                enabled

        },

        {

            name:

                "Disabled",

            value:

                disabled

        }

    );

}


function buildConfirmationEmbed() {

    return new EmbedBuilder()

        .setColor(

            0xFEE75C

        )

        .setTitle(

            "Confirm Setup"

        )

        .setDescription(

            "Please review your server configuration before completing the setup wizard."

        )

        .setFooter({

            text:

                buildApprovalFooter()

        });

}


/*
====================================
SETUP SUMMARY
====================================
*/

async function beginSetupSummary(
    interaction
) {

    const session =

        getSession(

            interaction.guild.id

        );

    if (

        !session

    ) {

        return;

    }

    await interaction.update({

        embeds: [

            buildSettingsSummaryEmbed(

                interaction,

                session

            ),

            buildFeatureSummaryEmbed(

                session

            ),

            buildConfirmationEmbed()

        ],

        components: [

            createApprovalButtons({

                approveId:

                    "setup_complete",

                cancelId:

                    "setup_cancel"

            })

        ]

    });

    logFeature({

        category:

            "SETUP",

        message:

            "Displaying setup summary.",

        details: {

            guildId:

                interaction.guild.id,

            guildName:

                interaction.guild.name

        }

    });

}

/*
====================================
SETUP INTERACTIONS
====================================
*/

async function handleSetupInteraction(
    interaction
) {

    /*
    ====================================
    BUTTONS / SELECT MENUS ONLY
    ====================================
    */

    if (

        !interaction.isButton()

        &&

        !interaction.isAnySelectMenu()

    ) {

        return false;

    }

    /*
    ====================================
    BEGIN SETUP
    ====================================
    */

    if (

        interaction.customId ===

        "setup_begin"

    ) {

        await beginRequiredSetup(

            interaction

        );

        return true;

    }

    /*
    ====================================
    REQUIRED SETTINGS
    ====================================
    */

    if (

        interaction.customId ===

        "setup_required_select"

    ) {

        await buildRequiredSettings(

            interaction

        );

        return true;

    }

    /*
    ====================================
    REQUIRED SETTINGS APPROVED
    ====================================
    */

    if (

        interaction.customId ===

        "setup_required_approve"

    ) {

        await beginFeatureSetup(

            interaction

        );

        return true;

    }

    /*
    ====================================
    REQUIRED SETTINGS CANCELLED
    ====================================
    */

    if (

        interaction.customId ===

        "setup_required_cancel"

    ) {

        deleteSession(

            interaction.guild.id

        );

        await interaction.update({

            content:

                "Setup has been cancelled. Run **/setup** to begin again.",

            embeds: [],

            components: []

        });

        return true;

    }

    /*
    ====================================
    ENABLE FEATURE
    ====================================
    */

    if (

        interaction.customId ===

        "setup_feature_enable"

    ) {

        await enableFeature(

            interaction

        );

        return true;

    }

    /*
    ====================================
    DISABLE FEATURE
    ====================================
    */

    if (

        interaction.customId ===

        "setup_feature_disable"

    ) {

        await disableFeature(

            interaction

        );

        const session =

            getSession(

                interaction.guild.id

            );

        if (

            hasRemainingFeatures(

                session.guildId

            )

        ) {

            await beginFeatureSetup(

                interaction

            );

        }

        else {

            await beginSetupSummary(

                interaction

            );

        }

        return true;

    }

    /*
    ====================================
    FEATURE SELECTOR
    ====================================
    */

    if (

        interaction.customId ===

        "setup_feature_select"

    ) {

        await configureFeature(

            interaction

        );

        return true;

    }

    /*
    ====================================
    FEATURE APPROVED
    ====================================
    */

    if (

        interaction.customId ===

        "setup_feature_approve"

    ) {

        await approveFeature(

            interaction

        );

        const session =

            getSession(

                interaction.guild.id

            );

        if (

            hasRemainingFeatures(

                session.guildId

            )

        ) {

            await beginFeatureSetup(

                interaction

            );

        }

        else {

            await beginSetupSummary(

                interaction

            );

        }

        return true;

    }

    /*
    ====================================
    FEATURE CANCELLED
    ====================================
    */

    if (

        interaction.customId ===

        "setup_feature_cancel"

    ) {

        await cancelFeature(

            interaction

        );

        await beginFeatureSetup(

            interaction

        );

        return true;

    }

    /*
    ====================================
    COMPLETE SETUP
    ====================================
    */

    if (

        isApproval(

            interaction,

            "setup_complete"

        )

    ) {

        const session =

            getSession(

                interaction.guild.id

            );

        if (

            !session

        ) {

            await interaction.update({

                content:

                    "The setup session no longer exists. Please run **/setup** again.",

                embeds: [],

                components: []

            });

            return true;

        }

        /*
        ====================================
        SAVE GUILD SETTINGS
        ====================================
        */

        for (

            const [

                settingName,
                settingValue

            ]

            of

            Object.entries(

                session.settings

            )

        ) {

            await setGuildSetting({

                guildId:

                    interaction.guild.id,

                guildName:

                    interaction.guild.name,

                settingName,

                settingValue

            });

        }

        /*
        ====================================
        ENABLE FEATURES
        ====================================
        */

        for (

            const featureId

            of

            session.enabledFeatures

        ) {

            await setFeatureFlag({

                guildId:

                    interaction.guild.id,

                guildName:

                    interaction.guild.name,

                featureId,

                enabled:

                    true

            });

        }

        /*
        ====================================
        CLEANUP
        ====================================
        */

        deleteSession(

            interaction.guild.id

        );

        /*
        ====================================
        FINAL DOCUMENT
        ====================================
        */

        const {

            embed

        } = renderDocument(

            "setup-confirmation"

        );

        await interaction.update({

            embeds: [

                embed

            ],

            components: []

        });

        logFeature({

            category:

                "SETUP",

            message:

                "Setup wizard completed.",

            details: {

                guildId:

                    interaction.guild.id,

                guildName:

                    interaction.guild.name,

                enabledFeatures:

                    session.enabledFeatures.length,

                disabledFeatures:

                    session.disabledFeatures.length

            }

        });

        return true;

    }

    /*
    ====================================
    CANCEL SETUP
    ====================================
    */

    if (

        isCancellation(

            interaction,

            "setup_cancel"

        )

    ) {

        deleteSession(

            interaction.guild.id

        );

        await interaction.update({

            content:

                "The setup wizard has been cancelled.\n\nRun **/setup** to begin again at any time.",

            embeds: [],

            components: []

        });

        return true;

    }

    return false;

}

/*
====================================
EXPORTS
====================================
*/

module.exports = {
    handleSetupInteraction
};
