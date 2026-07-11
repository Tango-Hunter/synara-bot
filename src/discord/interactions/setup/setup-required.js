/**
 * Title: setup-required.js
 * Author: Tango Hunter
 * Date Created: 7/8/26
 * Description: Handles the Required Configuration stage of the SYNARA Setup Wizard.
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
    getDocument
} = require("../../utils/registry-renderer");

const {
    createSession,
    getSession,
    updateSession,
    isSessionOwner
} = require("./setup-session");

const {
    buildSelector
} = require("./setup-selectors");

const {
    createApprovalButtons,
    buildApprovalFooter
} = require("../../utils/approval-workflow");

const {
    logFeature,
    logError
} = require("../../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../../core/logging/error-types");


/*
====================================
CONSTANTS
====================================
*/

const REQUIRED_DOCUMENT =
    getDocument("setup");

const REQUIRED_SETTINGS =
    REQUIRED_DOCUMENT.settings;


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

function getCurrentRequiredSetting(
    session
) {

    return REQUIRED_SETTINGS[

        Object.keys(

            session.settings

        ).length

    ] || null;

}

function buildProgressEmbed(
    setting
) {

    return new EmbedBuilder()

        .setColor(

            0x5865F2

        )

        .setTitle(

            "Required Configuration"

        )

        .setDescription(

            `Please configure **${setting.displayName}** before continuing.`

        )

        .addFields(

            {

                name:
                    "Description",

                value:
                    setting.description

            }
        );
}

function buildSelectorRow(
    setting
) {

    return buildSelector(

        setting.selectorType,

        "setup_required_select",

        `Select ${setting.displayName}`

    );
}

function buildCancelRow() {

    return new ActionRowBuilder()

        .addComponents(

            new ButtonBuilder()

                .setCustomId(

                    "setup_cancel"

                )

                .setLabel(

                    "Cancel Setup"

                )

                .setStyle(

                    ButtonStyle.Danger

                )
        );
}

function formatSelection(
    guild,
    setting,
    value
) {

    if (

        value == null

    ) {

        return "*Not Configured*";

    }

    switch (

        setting.selectorType

    ) {

        case "channel": {

            const channel =

                guild.channels.cache.get(

                    value

                );

            return channel

                ? `#${channel.name}`

                : value;

        }

        case "user": {

            const member =

                guild.members.cache.get(

                    value

                );

            return member

                ? member.displayName

                : value;

        }

        case "role": {

            if (

                Array.isArray(

                    value

                )

            ) {

                return value

                    .map(

                        roleId => {

                            const role =

                                guild.roles.cache.get(

                                    roleId

                                );

                            return role

                                ? `@${role.name}`

                                : roleId;

                        }
                    )

                    .join(

                        ", "

                    );
            }

            const role =

                guild.roles.cache.get(

                    value

                );

            return role

                ? `@${role.name}`

                : value;

        }

        default:

            return String(

                value

            );
    }
}


/*
====================================
BEGIN SETUP
====================================
*/

async function beginRequiredSetup(
    interaction
) {

    createSession({

        guildId:
            interaction.guild.id,

        guildName:
            interaction.guild.name,

        ownerId:
            interaction.user.id,

        ownerName:
            interaction.user.username

    });

    const session =

        getSession(

            interaction.guild.id

        );

    const settingName =

        getCurrentRequiredSetting(

            session

        );

    const setting =

        getSettingDefinition(

            settingName

        );

    if (
        !setting
    ) {

        throw new Error(

            "Unable to determine the first required setup setting."

        );
    }

    await interaction.update({

        embeds: [

            buildProgressEmbed(

                setting

            )
        ],

        components: [

            buildSelectorRow(

                setting

            ),

            buildCancelRow()

        ]
    });

    logFeature({

        category:
            "SETUP",

        message:
            "Required setup started.",

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            ownerId:
                interaction.user.id

        }
    });
}


/*
====================================
SESSION VALIDATION
====================================
*/

function validateSetupSession(
    interaction
) {

    const session =

        getSession(

            interaction.guild.id

        );

    if (
        !session
    ) {

        return {

            success: false,

            message:
                "This setup session no longer exists. Please run `/setup` again."

        };
    }

    if (

        !isSessionOwner(

            interaction.guild.id,

            interaction.user.id

        )
    ) {

        return {

            success: false,

            message:
                "This setup session belongs to another administrator."

        };
    }

    return {

        success: true,

        session

    };
}

/*
====================================
REQUIRED SETTING SELECTION
====================================
*/

async function buildRequiredSettings(
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

    const settingName =

        getCurrentRequiredSetting(

            session

        );

    const setting =

        getSettingDefinition(

            settingName

        );

    if (
        !setting
    ) {

        throw new Error(

            "Unable to determine the current required setting."

        );

    }

    /*
    ====================================
    STORE SELECTION
    ====================================
    */

    let value =

        interaction.values[0];

    /*
    ====================================
    MULTI ROLE SETTINGS
    ====================================
    */

    if (

        setting.name ===

        "roles_admin"

        ||

        setting.name ===

        "roles_moderator"

    ) {

        value = [

            value

        ];

    }

    /*
    ====================================
    STORE SELECTION
    ====================================
    */

    session.settings[

        setting.name

    ] = value;

    /*
    ====================================
    NEXT REQUIRED SETTING
    ====================================
    */

    const nextSettingName =

        getCurrentRequiredSetting(

            session

        );

    /*
    ====================================
    STILL CONFIGURING
    ====================================
    */

    if (

        nextSettingName

    ) {

        const nextSetting =

            getSettingDefinition(

                nextSettingName

            );

        await interaction.update({

            embeds: [

                buildProgressEmbed(

                    nextSetting

                )
            ],

            components: [

                buildSelectorRow(

                    nextSetting

                ),

                buildCancelRow()

            ]
        });

        return;
    }

    /*
    ====================================
    REVIEW REQUIRED SETTINGS
    ====================================
    */

    const summary =

        Object.entries(

            session.settings

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

                    `• **${definition.displayName}**\n`

                    +

                    `${formatSelection(

                        interaction.guild,

                        definition,

                        value

                    )}`
                );
            }
        )

        .join(

            "\n\n"
        );

    const embed =

        new EmbedBuilder()

            .setColor(

                0xFEE75C

            )

            .setTitle(

                "Review Required Configuration"

            )

            .setDescription(

                "Please review the final required configuration before continuing."

            )

            .addFields(

                {

                    name:
                        "Completed",

                    value:

                        summary ||

                        "*None*"

                }
            )

            .setFooter({

                text:

                    buildApprovalFooter()

            });

    await interaction.update({

        embeds: [

            embed

        ],

        components: [

            createApprovalButtons({

                approveId:

                    "setup_required_approve",

                cancelId:

                    "setup_required_cancel"

            })
        ]
    });

    logFeature({

        category:
            "SETUP",

        message:
            "Required configuration completed.",

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            ownerId:
                interaction.user.id

        }
    });
}


/*
====================================
EXPORTS
====================================
*/

module.exports = {
    formatSelection,
    beginRequiredSetup,
    buildRequiredSettings,
    validateSetupSession
};
