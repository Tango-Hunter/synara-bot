/**
 * Title: docs.js
 * Author: Tango Hunter
 * Date Created: 7/XX/26
 * Description:
 * Displays the SYNARA documentation selector.
 */

const {
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const {
    getDocuments
} = require("../../utils/registry-renderer");


async function handleDocsCommand(
    interaction
) {

    const documents =
        getDocuments();

    const menu =
        new StringSelectMenuBuilder()

            .setCustomId(
                "docs_selector"
            )

            .setPlaceholder(
                "Browse SYNARA Documentation..."
            )

            .addOptions(

                documents.map(
                    document => ({

                        label:
                            document.name,

                        description:
                            `${capitalize(document.type)} • ${capitalize(document.category)}`,

                        value:
                            document.id

                    })
                )
            );

    const row =
        new ActionRowBuilder()

            .addComponents(
                menu
            );

    await interaction.reply({

        ephemeral: true,

        content:
            "Select the documentation you'd like SYNARA to display.",

        components: [

            row

        ]

    });

}

function capitalize(
    text
) {

    return text
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}

module.exports = {
    handleDocsCommand
};
