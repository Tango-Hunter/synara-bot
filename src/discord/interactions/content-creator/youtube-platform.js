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
    buildConfirmationEmbed,
    buildAnnouncementPreview,
    normalizeAnnouncementMessage,
    createDraft
} = require('./platform-utility');



/*
====================================
CUSTOM IDS
====================================
*/

const MODAL_ID = 'content_creator_youtube_modal';

const APPROVE_ID = 'content_creator_youtube_approve';

const CANCEL_ID = 'content_creator_youtube_cancel';


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

                MODAL_ID

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

    const draft =

        createDraft({

            platform:

                'youtube',

            accountIdentifier:

                verification.accountIdentifier,

            creatorDisplayName:

                verification.creatorDisplayName,

            creatorUrl:

                verification.creatorUrl,

            customMessage

        });

    const DEFAULT_ANNOUNCEMENT = [

        '<@&{verified_role}>',

        '',

        '{creator} just uploaded a new YouTube video!',

        '',

        'Watch it here:',

        '{video_link}'

    ];

    const generatedAnnouncement =

        buildAnnouncementPreview({

            defaultAnnouncement:

                DEFAULT_ANNOUNCEMENT,

            customMessage

        });

    return {

        success: true,

        draft,

        embed:

            buildConfirmationEmbed({

                title:

                    'Confirm YouTube Content Creator',

                profileLabel:

                    'Channel',

                creatorDisplayName:

                    draft.creatorDisplayName,

                creatorUrl:

                    draft.accountUrl,

                announcement:

                    generatedAnnouncement

            }),

        components: [

            createApprovalButtons({

                approveId:

                    APPROVE_ID,

                cancelId:

                    CANCEL_ID

            })
        ]
    };
}

module.exports = {

    modalId:
        MODAL_ID,

    approveId:
        APPROVE_ID,

    cancelId:
        CANCEL_ID,

    showModal,
    handleModal
};
