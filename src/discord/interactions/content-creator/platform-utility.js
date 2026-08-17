/**
 * Title: platform-utility.js
 * Author: Tango Hunter
 * Date Created: 7/21/26
 * Description: Shared helper functions used by Content Creator platform providers.
 */

const {
    EmbedBuilder
} = require('discord.js');

const {
    embedThemes
} = require('../../../core/config/embed-themes');


/*
====================================
Normalize announcement message
====================================
*/

function normalizeAnnouncementMessage(

    message

) {

    if (
        !message
    ) {
        return null;
    }

    const normalized =

        message.trim();

    return (

        normalized.length > 0

            ? normalized

            : null

    );
}

/*
====================================
Build announcement preview
====================================
*/

function buildAnnouncementPreview({

    defaultAnnouncement,

    customMessage

}) {

    return [

        ...defaultAnnouncement,

        '',

        customMessage

    ]

        .filter(

            line =>

                line !== null

                &&

                line !== ''

        )

        .join(

            '\n'

        );
}

/*
====================================
Build confirmation embed
====================================
*/

function buildConfirmationEmbed({

    title,

    profileLabel,

    creatorDisplayName,

    creatorUrl,

    announcement,

    verifyMessage =

        'Click the profile link above to verify that it belongs to the intended creator before approving.'

}) {

    return new EmbedBuilder()

        .setColor(

            embedThemes.contentCreator.color

        )

        .setTitle(

            `${embedThemes.contentCreator.icon} ${title}`

        )

        .addFields(

            {

                name:

                    'Creator',

                value:

                    creatorDisplayName,

                inline:

                    false

            },

            {

                name:

                    profileLabel,

                value:

                    creatorUrl,

                inline:

                    false

            },

            {

                name:

                    '⚠️ Verify Creator Profile',

                value:

                    verifyMessage,

                inline:

                    false

            },

            {

                name:

                    'Generated Announcement',

                value:

                    `\`\`\`\n${announcement}\n\`\`\``,

                inline:

                    false

            }
        )

        .setFooter({

            text:

                embedThemes.contentCreator.footer

        });
}

/*
====================================
Create draft
====================================
*/

function createDraft({

    platform,

    accountIdentifier,

    creatorDisplayName,

    creatorUrl,

    customMessage

}) {

    return {

        platform,

        accountIdentifier,

        creatorDisplayName,

        accountUrl:

            creatorUrl,

        messageTemplate:

            customMessage ?? null

    };
}

module.exports = {
    normalizeAnnouncementMessage,
    buildAnnouncementPreview,
    buildConfirmationEmbed,
    createDraft
};
