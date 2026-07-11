/**
 * Title: setup-selectors.js
 * Author: Tango Hunter
 * Date Created: 7/8/26
 * Description: Builds Discord selector components used throughout the SYNARA Setup Wizard.
 */

const {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    UserSelectMenuBuilder
} = require("discord.js");


/*
====================================
SELECTOR BUILDERS
====================================
*/

function buildChannelSelector(
    customId,
    placeholder
) {

    return new ActionRowBuilder()

        .addComponents(

            new ChannelSelectMenuBuilder()

                .setCustomId(

                    customId

                )

                .setPlaceholder(

                    placeholder

                )

                .setMinValues(

                    1

                )

                .setMaxValues(

                    1

                )
        );
}

function buildRoleSelector(
    customId,
    placeholder
) {

    return new ActionRowBuilder()

        .addComponents(

            new RoleSelectMenuBuilder()

                .setCustomId(

                    customId

                )

                .setPlaceholder(

                    placeholder

                )

                .setMinValues(

                    1

                )

                .setMaxValues(

                    1

                )
        );
}

function buildUserSelector(
    customId,
    placeholder
) {

    return new ActionRowBuilder()

        .addComponents(

            new UserSelectMenuBuilder()

                .setCustomId(

                    customId

                )

                .setPlaceholder(

                    placeholder

                )

                .setMinValues(

                    1

                )

                .setMaxValues(

                    1

                )
        );
}

/*
====================================
GENERIC BUILDER
====================================
*/

function buildSelector(
    selectorType,
    customId,
    placeholder
) {

    switch (

        selectorType

    ) {

        case "channel":

            return buildChannelSelector(

                customId,
                placeholder

            );

        case "role":

            return buildRoleSelector(

                customId,
                placeholder

            );

        case "user":

            return buildUserSelector(

                customId,
                placeholder

            );

        default:

            throw new Error(

                `Unknown selector type: ${selectorType}`

            );
    }
}

module.exports = {
    buildSelector,
    buildChannelSelector,
    buildRoleSelector,
    buildUserSelector
};
