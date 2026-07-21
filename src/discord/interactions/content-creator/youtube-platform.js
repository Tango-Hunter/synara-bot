/**
 * Title: youtube-platform.js
 * Author: Tango Hunter
 * Date Created: 7/18/26
 * Description: YouTube modal builder and validation workflow for Content Creator Announcements.
 *
 * Responsibilities:
 * • Display the YouTube modal
 * • Validate administrator input
 * • Verify the channel exists
 * • Build confirmation embeds
 */

const {
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

const {
    verifyChannelName
} = require('./youtube-api');

const {
    createApprovalButtons
} = require('../../utils/approval-workflow');

const {
    embedThemes
} = require('../../../core/config/embed-themes');


/*
====================================
MODAL
====================================
*/

async function showModal(

    interaction

) {

    const modal =

        new ModalBuilder()

            .setCustomId(

                'content_creator_youtube_modal'

            )

            .setTitle(

                'Add YouTube Creator'

            );

    const channelInput =

        new TextInputBuilder()

            .setCustomId(

                'channel_name'

            )

            .setLabel(

                'YouTube Channel Name'

            )

            .setPlaceholder(

                'GoogleDevelopers'

            )

            .setRequired(

                true

            )

            .setStyle(

                TextInputStyle.Short

            )

            .setMaxLength(

                100

            );

    const announcementInput =

        new TextInputBuilder()

            .setCustomId(

                'announcement_message'

            )

            .setLabel(

                'Optional Custom Message'

            )

            .setPlaceholder(

                'Optional custom message to append to every announcement.'

            )

            .setRequired(

                false

            )

            .setStyle(

                TextInputStyle.Paragraph

            )

            .setMaxLength(

                1000

            );

    modal.addComponents(

        new ActionRowBuilder()

            .addComponents(

                channelInput

            ),

        new ActionRowBuilder()

            .addComponents(

                announcementInput

            )

    );

    await interaction.showModal(

        modal

    );

}

/*
====================================
HELPERS
====================================
*/

function buildConfirmationEmbed({

    creatorDisplayName,

    channelUrl,

    announcement

}) {

    return new EmbedBuilder()

        .setColor(

            embedThemes.contentCreator.color

        )

        .setTitle(

            `${embedThemes.contentCreator.icon} YouTube Content Creator`

        )

        .setDescription(

            'Review the information below before approving.'

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

                    'Channel',

                value:

                    channelUrl,

                inline:

                    false

            },

            {

                name:

                    '⚠️ Verify Creator Profile',

                value:

                    'Click the profile link above to verify that it belongs to the intended creator before approving.',

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
MODAL HANDLER
====================================
*/

async function handleModal(

    interaction

) {

    const channelName =

        interaction.fields.getTextInputValue(

            'channel_name'

        );

    const customMessage =

        normalizeAnnouncementMessage(

            interaction.fields.getTextInputValue(

                'announcement_message'

            )

        );

    const verification =

        await verifyChannelName({

            channelName

        });

    if (
        !verification.success
    ) {

        return {

            success: false,

            error:

                verification.error

        };

    }

    const draft = {

        platform:

            'youtube',

        accountIdentifier:

            verification.channelId,

        creatorDisplayName:

            verification.creatorDisplayName,

        accountUrl:

            verification.channelUrl,

        messageTemplate:

            customMessage || null

    };

    const generatedAnnouncement =

        [
            '<@&{verified_role}>',

            '',

            `${draft.creatorDisplayName} just uploaded a new YouTube video!`,

            '',

            'Watch it here:',

            '{video_link}',

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

    return {

        success: true,

        draft,

        embed:

            buildConfirmationEmbed({

                creatorDisplayName:

                    draft.creatorDisplayName,

                channelUrl:

                    draft.accountUrl,

                announcement:

                    generatedAnnouncement

            }),

        components: [

            createApprovalButtons({

                approveId:

                    'content_creator_youtube_approve',

                cancelId:

                    'content_creator_youtube_cancel'

            })
        ]
    };
}

/*
====================================
EXPORTS
====================================
*/

module.exports = {
    showModal,
    handleModal,
    buildConfirmationEmbed
};
