/**
 * Title: setup-features.js
 * Author: Tango Hunter
 * Date Created: 7/9/26
 * Description: Handles the feature configuration stage of the SYNARA Setup Wizard.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags
} = require("discord.js");

const {
    DEFAULT_GUILD_SETTINGS
} = require("../../../core/database/default-guild-settings");

const {
    getFeatureFlagName
} = require(
    "../../../core/database/default-feature-flags"
);

const {
    renderDocument,
    getDocument
} = require("../../utils/registry-renderer");

const {
    getSession,
    getCurrentFeature,
    advanceFeature,
    resetFeatureState,
    isSessionOwner
} = require("./setup-session");

const {
    buildSelector
} = require("./setup-selectors");

const {
    formatSelection,
    validateSetupSession
} = require("./setup-required");

const {
    createApprovalButtons,
    buildApprovalFooter
} = require("../../utils/approval-workflow");

const {
    logFeature
} = require("../../../core/logging/logger");


/*
====================================
HELPERS
====================================
*/

function getSettingDefinition(
    settingName
) {

    return DEFAULT_GUILD_SETTINGS.find(

        setting =>

            setting.name ===

            settingName

    ) || null;

}

function getCurrentFeatureDocument(
    session
) {

    const featureId =

        getCurrentFeature(

            session.guildId

        );

    if (
        !featureId
    ) {
        return null;
    }

    return getDocument(

        featureId

    );

}

function getCurrentFeatureSetting(
    session
) {

    const document =

        getCurrentFeatureDocument(

            session

        );

    if (
        !document
    ) {

        return null;

    }

    return document.settings[

        Object.keys(

            session.featureSettings

        ).length

    ] || null;

}


/*
====================================
EMBEDS
====================================
*/

function buildRequiredSettingsEmbed(
    document
) {

    const embed =

        new EmbedBuilder()

            .setColor(

                0x5865F2

            )

            .setTitle(

                "Required Configuration"

            )

            .setDescription(

                "If these channels, roles, or users do not already exist, create them now before enabling this feature."

            );

    if (

        document.settings.length === 0

    ) {

        embed.addFields({

            name:
                "Required Settings",

            value:
                "This feature does not require any additional configuration."

        });

        return embed;

    }

    for (

        const settingName

        of

        document.settings

    ) {

        const setting =

            getSettingDefinition(

                settingName

            );

        if (
            !setting
        ) {
            continue;
        }

        embed.addFields({

            name:

                setting.displayName,

            value:

                setting.description,

            inline:

                false

        });

    }

    return embed;

}


/*
====================================
BUTTONS
====================================
*/

function buildFeatureButtons() {

    return new ActionRowBuilder()

        .addComponents(

            new ButtonBuilder()

                .setCustomId(

                    "setup_feature_enable"

                )

                .setLabel(

                    "Enable Feature"

                )

                .setStyle(

                    ButtonStyle.Success

                ),

            new ButtonBuilder()

                .setCustomId(

                    "setup_feature_disable"

                )

                .setLabel(

                    "Disable Feature"

                )

                .setStyle(

                    ButtonStyle.Secondary

                )
        );
}


/*
====================================
BEGIN FEATURE
====================================
*/

async function beginFeatureSetup(
    interaction
) {

    const validation =

        validateSetupSession(

            interaction

        );

    if (
        !validation.success
    ) {

        return interaction.reply({

            content:

                validation.message,

            flags:
                MessageFlags.Ephemeral

        });

    }

    const {

        session

    } = validation;

    session.featureSettings = {};

    session.pendingFeature =

        getCurrentFeature(

            session.guildId

        );

    const {

        document,
        embed

    } = renderDocument(

        session.pendingFeature

    );

    const settingsEmbed =

        buildRequiredSettingsEmbed(

            document

        );

    await interaction.update({

        embeds: [

            embed,
            settingsEmbed

        ],

        components: [

            buildFeatureButtons()

        ]

    });

    logFeature({

        category:
            "SETUP",

        message:
            `Beginning setup for feature '${document.name}'.`,

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            feature:
                document.id

        }
    });
}

/*
====================================
ENABLE FEATURE
====================================
*/

async function enableFeature(
    interaction
) {

    const validation =

        validateSetupSession(

            interaction

        );

    if (
        !validation.success
    ) {

        return interaction.reply({

            content:
                validation.message,

            flags:
                MessageFlags.Ephemeral

        });
    }

    const {

        session

    } = validation;

    const document =

        getCurrentFeatureDocument(

            session

        );

    if (
        !document
    ) {

        throw new Error(

            "Unable to determine the current feature."

        );
    }

    /*
    ====================================
    NO SETTINGS REQUIRED
    ====================================
    */

    if (

        document.settings.length === 0

    ) {

        return await reviewFeatureConfiguration(

            interaction,

            session,

            document

        );

    }

    /*
    ====================================
    BEGIN FEATURE CONFIGURATION
    ====================================
    */

    const settingName =

        getCurrentFeatureSetting(

            session

        );

    const setting =

        getSettingDefinition(

            settingName

        );

    await interaction.update({

        embeds: [

            new EmbedBuilder()

                .setColor(

                    0x5865F2

                )

                .setTitle(

                    document.name

                )

                .setDescription(

                    `Please configure **${setting.displayName}**.`

                )

                .addFields({

                    name:
                        "Description",

                    value:
                        setting.description

                })

        ],

        components: [

            buildSelector(

                setting.selectorType,

                "setup_feature_select",

                `Select ${setting.displayName}`

            )
        ]
    });
}


/*
====================================
DISABLE FEATURE
====================================
*/

async function disableFeature(
    interaction
) {

    const validation =

        validateSetupSession(

            interaction

        );

    if (
        !validation.success
    ) {

        return interaction.reply({

            content:
                validation.message,

            flags:
                MessageFlags.Ephemeral

        });
    }

    const {

        session

    } = validation;

    const featureName =

        getFeatureFlagName(

            session.pendingFeature

        );

    if (

        featureName

        &&

        !session.disabledFeatures.includes(

            featureName

        )
    ) {

        session.disabledFeatures.push(

            featureName

        );
    }

    resetFeatureState(

        session.guildId

    );

    advanceFeature(

        session.guildId

    );

    return;
}


/*
====================================
FEATURE SELECTOR
====================================
*/

async function configureFeature(
    interaction
) {

    const validation =

        validateSetupSession(

            interaction

        );

    if (
        !validation.success
    ) {

        return interaction.reply({

            content:
                validation.message,

            flags:
                MessageFlags.Ephemeral

        });

    }

    const {

        session

    } = validation;

    const document =

        getCurrentFeatureDocument(

            session

        );

    const settingName =

        getCurrentFeatureSetting(

            session

        );

    const setting =

        getSettingDefinition(

            settingName

        );

    let value =

        interaction.values[0];

    if (

        setting.name === "roles_admin"

        ||

        setting.name === "roles_moderator"

    ) {

        value = [

            value

        ];

    }

    session.featureSettings[

        setting.name

    ] = value;

    const nextSetting =

        getCurrentFeatureSetting(

            session

        );

    if (
        nextSetting
    ) {

        const definition =

            getSettingDefinition(

                nextSetting

            );

        return interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor(

                        0x5865F2

                    )

                    .setTitle(

                        document.name

                    )

                    .setDescription(

                        `Please configure **${definition.displayName}**.`

                    )

                    .addFields({

                        name:
                            "Description",

                        value:
                            definition.description

                    })

            ],

            components: [

                buildSelector(

                    definition.selectorType,

                    "setup_feature_select",

                    `Select ${definition.displayName}`

                )
            ]
        });
    }

    return reviewFeatureConfiguration(

        interaction,

        session,

        document

    );
}


/*
====================================
FEATURE REVIEW
====================================
*/

async function reviewFeatureConfiguration(

    interaction,
    session,
    document

) {

    const summary =

        Object.entries(

            session.featureSettings

        )

            .map(

                ([

                    key,
                    value

                ]) => {

                    const definition =

                        getSettingDefinition(

                            key

                        );

                    return (

                        `**${definition.displayName}**\n`

                        +

                        formatSelection(

                            interaction.guild,

                            definition,

                            value

                        )
                    );
                }
            )

            .join(

                "\n\n"

            ) ||

            "No additional configuration required.";

    const embed =

        new EmbedBuilder()

            .setColor(

                0xFEE75C

            )

            .setTitle(

                `${document.name} Review`

            )

            .setDescription(

                "Please review this feature before continuing."

            )

            .addFields({

                name:
                    "Configuration",

                value:
                    summary

            })

            .setFooter({

                text:
                    buildApprovalFooter()

            });

    return interaction.update({

        embeds: [

            embed

        ],

        components: [

            createApprovalButtons({

                approveId:
                    "setup_feature_approve",

                cancelId:
                    "setup_feature_cancel"

            })
        ]
    });
}

/*
====================================
APPROVE FEATURE
====================================
*/

async function approveFeature(
    interaction
) {

    const validation =

        validateSetupSession(

            interaction

        );

    if (
        !validation.success
    ) {

        return interaction.reply({

            content:
                validation.message,

            flags:
                MessageFlags.Ephemeral

        });
    }

    const {

        session

    } = validation;

    const featureName =

        getFeatureFlagName(

            session.pendingFeature

        );

    if (

        featureName

        &&

        !session.enabledFeatures.includes(

            featureName

        )
    ) {

        session.enabledFeatures.push(

            featureName

        );
}

    Object.assign(

        session.settings,

        session.featureSettings

    );

    resetFeatureState(

        session.guildId

    );

    advanceFeature(

        session.guildId

    );

    return;
}

/*
====================================
CANCEL FEATURE
====================================
*/

async function cancelFeature(
    interaction
) {

    const validation =

        validateSetupSession(

            interaction

        );

    if (
        !validation.success
    ) {

        return interaction.reply({

            content:
                validation.message,

            flags:
                MessageFlags.Ephemeral

        });
    }

    const {

        session

    } = validation;

    resetFeatureState(

        session.guildId

    );

    return;
}


/*
====================================
EXPORTS
====================================
*/

module.exports = {
    beginFeatureSetup,
    enableFeature,
    disableFeature,
    configureFeature,
    reviewFeatureConfiguration,
    approveFeature,
    cancelFeature
};
