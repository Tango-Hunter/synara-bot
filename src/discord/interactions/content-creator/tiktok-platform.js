/**
 * Title: tiktok-platform.js
 * Author: Tango Hunter
 * Date Created: 7/21/26
 * Date Modified: 7/21/26
 * Description:
 * TikTok platform interaction provider.
 * Builds the platform-specific modal, validates the
 * submitted account information, and returns a
 * standardized draft back to the content creator
 * handler.
 */

const {
    ActionRowBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const {
    embedThemes
} = require('../../../core/config/embed-themes');

const {
    createApprovalButtons
} = require('../../utils/approval-workflow');

const {
    verifyUsername
} = require('./tiktok-api');

const {
    logFeature
} = require('../../../core/logging/logger');


/*
====================================
CUSTOM IDS
====================================
*/

const MODAL_ID = 'content_creator_tiktok_modal';

const APPROVE_ID = 'content_creator_tiktok_approve';

const CANCEL_ID = 'content_creator_tiktok_cancel';


/*
====================================
DEFAULT ANNOUNCEMENT
====================================
*/

const DEFAULT_ANNOUNCEMENT =

    [

        '<@&{verified_role}>',

        '',

        '{creator} just uploaded a new TikTok!',

        '',

        'Watch it here:',

        '{video_link}'

    ];

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

                'Register TikTok Creator'

            );

    const username =

        new TextInputBuilder()

            .setCustomId(

                'creator_username'

            )

            .setLabel(

                'TikTok Username'

            )

            .setPlaceholder(

                'username'

            )

            .setRequired(

                true

            )

            .setStyle(

                TextInputStyle.Short

            );

    const announcement =

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

            );

    modal.addComponents(

        new ActionRowBuilder()

            .addComponents(

                username

            ),

        new ActionRowBuilder()

            .addComponents(

                announcement

            )
    );

    return await interaction.showModal(

        modal

    );
}

/*
====================================
HELPERS
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

function buildAnnouncementPreview(

    customMessage

) {

    return [

        ...DEFAULT_ANNOUNCEMENT,

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
CONFIRMATION EMBED
====================================
*/

async function buildConfirmationEmbed({

    creatorDisplayName,
    creatorUrl,
    generatedAnnouncement

}) {

    return new EmbedBuilder()

        .setColor(

            embedThemes.contentCreator.color

        )

        .setTitle(

            `${embedThemes.contentCreator.icon} Confirm TikTok Content Creator`

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

                    'Profile',

                value:

                    creatorUrl,

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

                    `\`\`\`\n${generatedAnnouncement}\n\`\`\``,

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

    interaction,

    draft

) {

    const creatorUsername =

        interaction.fields.getTextInputValue(

            'creator_username'

        );

    const customMessage =

        normalizeAnnouncementMessage(

            interaction.fields.getTextInputValue(

                'announcement_message'

            )
        );

    logFeature({

        category:

            'Content Creator',

        message:

            'Verifying TikTok creator.',

        details: {

            guildId:

                interaction.guild.id,

            userId:

                interaction.user.id,

            username:

                creatorUsername

        }
    });

    const verification =

        await verifyUsername(

            creatorUsername

        );

    if (
        !verification.success
    ) {

        return {

            success: false,

            error:

                verification.error

        };
    }

    const generatedAnnouncement =

        buildAnnouncementPreview(

            customMessage

        );

    const embed =

        await buildConfirmationEmbed({

            creatorDisplayName:

                verification.creatorDisplayName,

            creatorUrl:

                verification.creatorUrl,

            generatedAnnouncement:

                generatedAnnouncement

        });

    const components =

        createApprovalButtons({

            approveId:

                APPROVE_ID,

            cancelId:

                CANCEL_ID

        });

    return {

        success: true,

        draft: {

            ...draft,

            platform:

                'tiktok',

            accountIdentifier:

                verification.accountIdentifier,

            creatorDisplayName:

                verification.creatorDisplayName,

            accountUrl:

                verification.creatorUrl,

            messageTemplate:

                customMessage ?? null

        },

        embed,

        components

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
