/**
 * Title: embed-builder.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 * Description: Centralized SYNARA embed generation.
 */

const {
    EmbedBuilder
} = require('discord.js');

const {
    embedThemes
} = require('../../core/config/embed-themes');

function buildEmbed({

    type,
    title,
    description

}) {

    const theme =
        embedThemes[type];

    return new EmbedBuilder()

        .setColor(
            theme.color
        )

        .setTitle(
            `${theme.icon} ${title}`
        )

        .setDescription(
            description
        )

        .setFooter({

            text:
                theme.footer
        })

        .setTimestamp();
}

module.exports = {
    buildEmbed
};
