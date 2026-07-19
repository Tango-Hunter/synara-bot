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
    embedThemes
} = require('../../../core/config/embed-themes');


const DEFAULT_ANNOUNCEMENT =
    '{creator} just uploaded a new video to YouTube!\n\nWatch it here:\n{video_link}';


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

                'Announcement Message'

            )

            .setPlaceholder(

                'Leave blank to use the default announcement.'

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

function buildAnnouncementMessage(

    announcement

) {

    if (

        !announcement ||

        announcement.trim() === ''

    ) {

        return DEFAULT_ANNOUNCEMENT;

    }

    return announcement.trim();

}

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

                    'Announcement',

                value:

                    announcement,

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

    const announcementInput =

        interaction.fields.getTextInputValue(

            'announcement_message'

        );

    const announcement =

        buildAnnouncementMessage(

            announcementInput

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

        thumbnail:

            verification.thumbnail,

        messageTemplate:

            announcement,

        accountName:

            verification.normalizedChannelName

    };

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

                    draft.messageTemplate

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
