/**
 * Title: announcement-service.js
 * Author: Tango Hunter
 * Date Created: 8/17/26
 * Description:
 * Central service responsible for processing normalized
 * Content Creator content and delivering announcements
 * to configured Discord servers.
 *
 * Responsibilities:
 * • Locate registered Content Creator accounts
 * • Prevent duplicate announcements
 * • Resolve guild-specific settings
 * • Resolve the verified role
 * • Build the announcement embed
 * • Send the announcement to Discord
 * • Update last_content_id after successful delivery
 * • Handle individual guild delivery failures
 *
 * This file DOES NOT:
 * • Parse platform notifications
 * • Manage YouTube WebSub subscriptions
 * • Handle WebSub verification
 * • Query YouTube
 * • Manage Discord interactions
 * • Register Content Creators
 *
 * Platform-specific notification files provide the
 * normalized Content Creator content object.
 */


/*
====================================
DEPENDENCIES
====================================
*/

const {
    EmbedBuilder
} = require('discord.js');

const {
    embedThemes
} = require('../core/config/embed-themes');

const {
    getCreatorByPlatformAccount,
    updateLastContentId
} = require('../core/database/content-creators-repository');

const {
    getGuildSetting
} = require('../core/database/guild-settings-repository');

const {
    sendDiscordMessage
} = require('../discord/services/post-message');

const {
    logFeature,
    logError
} = require('../core/logging/logger');

const {
    ERROR_TYPES
} = require('../core/logging/error-types');


/*
====================================
CONSTANTS
====================================
*/

const DEFAULT_ANNOUNCEMENTS = {

    youtube: [

        '{creator} just uploaded a new YouTube video!',

        '',

        'Watch it here:',

        '{video_link}'

    ].join('\n'),

    tiktok: [

        '{creator} just posted a new TikTok!',

        '',

        'Watch it here:',

        '{video_link}'

    ].join('\n')

};


/*
====================================
NORMALIZATION HELPERS
====================================
*/

/**
 * Normalize a value into a trimmed string.
 *
 * Returns null when the supplied value
 * cannot produce a usable string.
 */
function normalizeString(
    value
) {

    if (
        typeof value !==
        'string'
    ) {
        return null;
    }

    const normalized =
        value.trim();

    return (
        normalized.length > 0
            ? normalized
            : null
    );
}


/**
 * Resolve the configured announcement
 * template.
 *
 * A blank or missing template falls back
 * to the system default.
 */
function resolveMessageTemplate({

    platform,

    messageTemplate

}) {

    const defaultAnnouncement =
        DEFAULT_ANNOUNCEMENTS[
            platform
        ];

    if (
        !defaultAnnouncement
    ) {
        throw new Error(
            `No default announcement is configured for platform: ${platform}`
        );
    }

    const customMessage =
        normalizeString(
            messageTemplate
        );

    if (
        !customMessage
    ) {
        return defaultAnnouncement;
    }

    return [

        defaultAnnouncement,
        '',
        customMessage

    ].join('\n');

}


/*
====================================
TEMPLATE REPLACEMENT
====================================
*/

/**
 * Replace supported announcement
 * template variables.
 *
 * Supported variables:
 *
 * {verified_role}
 * {creator}
 * {video_link}
 * {title}
 * {thumbnail}
 * {content_id}
 * {platform}
 * {creator_url}
 */
function buildAnnouncementEmbed({

    platform,

    template,

    verifiedRoleId,

    creatorDisplayName,

    contentUrl,

    contentTitle,

    thumbnailUrl,

    contentId,

    creatorUrl

}) {

    const resolvedTemplate =
        resolveMessageTemplate({

            platform,

            messageTemplate:
                template
        });

    const replacements = {

        '{creator}':
            creatorDisplayName
                ? creatorDisplayName
                : '',

        '{video_link}':
            contentUrl
                ? contentUrl
                : '',

        '{content_link}':
            contentUrl
                ? contentUrl
                : '',

        '{title}':
            contentTitle
                ? contentTitle
                : '',

        '{thumbnail}':
            thumbnailUrl
                ? thumbnailUrl
                : '',

        '{content_id}':
            contentId
                ? contentId
                : '',

        '{platform}':
            platform
                ? platform
                : '',

        '{creator_url}':
            creatorUrl
                ? creatorUrl
                : '',

        '{verified_role}':
            verifiedRoleId
                ? verifiedRoleId
                : ''
    };

    let description =
        resolvedTemplate;

    for (
        const [
            placeholder,
            value
        ]
        of Object.entries(
            replacements
        )
    ) {

        description =
            description.replaceAll(
                placeholder,
                value
            );
    }

    const theme =
        embedThemes.contentCreator;

    const platformIcon =
        theme[
            platform
        ] || theme.icon;

    const embed =
        new EmbedBuilder()

            .setColor(
                theme.color
            )

            .setAuthor({

                name:
                    `${platformIcon} ${creatorDisplayName}`

            })

            .setTitle(
                contentTitle
                    ? contentTitle
                    : `${creatorDisplayName} posted new content`
            )

            .setURL(
                contentUrl
            )

            .setDescription(
                description.trim()
            )

            .setFooter({

                text:
                    theme.footer
            });

    if (
        thumbnailUrl
    ) {
        embed.setThumbnail(
            thumbnailUrl
        );
    }

    return embed;
}


/*
====================================
CONTENT VALIDATION
====================================
*/

/**
 * Validate the normalized content
 * object supplied by a platform
 * notification handler.
 */
function validateContent(
    content
) {

    if (
        !content ||
        typeof content !==
        'object'
    ) {
        throw new Error(
            'Content Creator notification content is missing.'
        );
    }


    const requiredFields = [

        'platform',

        'accountIdentifier',

        'contentId',

        'creatorDisplayName',

        'contentTitle',

        'contentUrl',

        'publishedAt'

    ];


    const missingFields = [];


    for (
        const field
        of requiredFields
    ) {

        if (
            !normalizeString(
                content[field]
            )
        ) {
            missingFields.push(
                field
            );
        }
    }


    if (
        missingFields.length > 0
    ) {
        throw new Error(
            `Normalized Content Creator content is missing required fields: ${missingFields.join(', ')}`
        );
    }
}


/*
====================================
CREATOR REGISTRATION VALIDATION
====================================
*/

/**
 * Validate the database record before
 * attempting to send an announcement.
 */
function validateCreatorRegistration(
    creator
) {

    if (
        !creator
    ) {
        return {
            success:
                false,
            reason:
                'Creator registration not found.'
        };
    }


    if (
        !normalizeString(
            creator.guild_id
        )
    ) {
        return {
            success:
                false,
            reason:
                'Creator registration does not contain a guild ID.'
        };
    }


    if (
        !normalizeString(
            creator.discord_channel_id
        )
    ) {
        return {
            success:
                false,
            reason:
                'Creator registration does not contain an announcement channel ID.'
        };
    }


    if (
        !normalizeString(
            creator.message_template
        )
    ) {

        /*
         * Missing Field
         */

    }


    return {

        success:
            true

    };
}


/*
====================================
VERIFIED ROLE
====================================
*/

async function getVerifiedRoleId({
    guildId
}) {

    return await getGuildSetting({

        guildId,

        settingName:
            'role_verified'

    });

}


/*
====================================
DUPLICATE PROTECTION
====================================
*/

/**
 * Determine whether this content has
 * already been announced to this guild.
 *
 * The Content Creator registration
 * stores the last successfully processed
 * content ID.
 */
function isDuplicateContent({
    creator,
    contentId
}) {

    const lastContentId =
        normalizeString(
            creator.last_content_id
        );


    if (
        !lastContentId
    ) {
        return false;
    }


    return (
        lastContentId ===
        contentId
    );
}


/*
====================================
SINGLE GUILD DELIVERY
====================================
*/

async function deliverToGuild({

    creator,

    content

}) {

    const guildId =
        creator.guild_id;

    const channelId =
        creator.discord_channel_id;


    /*
    ====================================
    DUPLICATE CHECK
    ====================================
    */

    if (
        isDuplicateContent({

            creator,

            contentId:
                content.contentId

        })
    ) {

        logFeature({

            category:
                'CONTENT_CREATORS',

            message:
                'Skipping duplicate Content Creator announcement.',

            details: {

                guildId,

                platform:
                    content.platform,

                accountIdentifier:
                    content.accountIdentifier,

                contentId:
                    content.contentId

            }
        });


        return {

            success:
                true,

            skipped:
                true,

            reason:
                'duplicate',

            guildId

        };
    }


    /*
    ====================================
    VALIDATE REGISTRATION
    ====================================
    */

    const registrationValidation =
        validateCreatorRegistration(
            creator
        );


    if (
        !registrationValidation.success
    ) {

        logError({

            type:
                ERROR_TYPES.UNKNOWN_ERROR,

            source:
                'announcement-service',

            message:
                'Invalid Content Creator registration.',

            details: {

                guildId,

                platform:
                    content.platform,

                accountIdentifier:
                    content.accountIdentifier,

                contentId:
                    content.contentId,

                reason:
                    registrationValidation.reason

            }
        });


        return {

            success:
                false,

            skipped:
                true,

            reason:
                registrationValidation.reason,

            guildId

        };
    }


    /*
    ====================================
    VERIFIED ROLE
    ====================================
    */

    let verifiedRoleId = null;


    try {

        verifiedRoleId =
            await getVerifiedRoleId({
                guildId
            });
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.UNKNOWN_ERROR,

            source:
                'announcement-service',

            message:
                'Failed to resolve verified role.',

            details: {

                guildId,

                error:
                    error.message

            }
        });


        return {

            success:
                false,

            reason:
                'Failed to resolve verified role.',

            guildId

        };
    }


    /*
    ====================================
    BUILD MESSAGE
    ====================================
    */

    const embed =
        buildAnnouncementEmbed({

            platform:
                content.platform,

            template:
                creator.message_template,

            verifiedRoleId,

            creatorDisplayName:
                content.creatorDisplayName,

            contentUrl:
                content.contentUrl,

            contentTitle:
                content.contentTitle,

            thumbnailUrl:
                content.thumbnailUrl,

            contentId:
                content.contentId,

            creatorUrl:
                creator.creator_url

        });

    if (
        !embed
    ) {
        return {

            success:
                false,
            reason:
                'Announcement embed could not be created.',
            guildId

        };
    }


    /*
    ====================================
    SEND DISCORD MESSAGE
    ====================================
    */

    try {

        const roleMention =
            verifiedRoleId
                ? `<@&${verifiedRoleId}>`
                : null;

        await sendDiscordMessage({

            channelId,

            message:
                roleMention,

            embed

        });
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.UNKNOWN_ERROR,

            source:
                'announcement-service',

            message:
                'Failed to send Content Creator announcement.',

            details: {

                guildId,

                channelId,

                platform:
                    content.platform,

                accountIdentifier:
                    content.accountIdentifier,

                contentId:
                    content.contentId,

                error:
                    error.message

            }
        });


        return {

            success:
                false,

            reason:
                'Discord message delivery failed.',

            guildId,

            error:
                error.message

        };
    }


    /*
    ====================================
    UPDATE LAST CONTENT ID
    ====================================
    */

    try {

        await updateLastContentId({

            guildId,

            platform:
                content.platform,

            accountIdentifier:
                content.accountIdentifier,

            lastContentId:
                content.contentId

        });
    }

    catch (
        error
    ) {

        /*
         * IMPORTANT:
         *
         * The Discord message has already
         * been sent successfully.
         *
         * Therefore we do not report the
         * overall delivery as a failure.
         *
         * However, this is logged because
         * failure to update last_content_id
         * can allow a duplicate announcement
         * if the same notification is received
         * again.
         */

        logError({

            type:
                ERROR_TYPES.UNKNOWN_ERROR,

            source:
                'announcement-service',

            message:
                'Discord announcement sent, but last_content_id could not be updated.',

            details: {

                guildId,

                platform:
                    content.platform,

                accountIdentifier:
                    content.accountIdentifier,

                contentId:
                    content.contentId,

                error:
                    error.message

            }
        });


        return {

            success:
                true,

            skipped:
                false,

            delivered:
                true,

            warning:
                'Announcement sent, but last_content_id update failed.',

            guildId

        };
    }


    /*
    ====================================
    LOG SUCCESS
    ====================================
    */

    logFeature({

        category:
            'CONTENT_CREATORS',

        message:
            'Content Creator announcement sent.',

        details: {

            guildId,

            channelId,

            platform:
                content.platform,

            accountIdentifier:
                content.accountIdentifier,

            contentId:
                content.contentId,

            creatorDisplayName:
                content.creatorDisplayName

        }
    });


    return {

        success:
            true,

        skipped:
            false,

        delivered:
            true,

        guildId,

        channelId,

        contentId:
            content.contentId

    };
}


/*
====================================
PROCESS CONTENT
====================================
*/

/**
 * Process normalized Content Creator
 * content and deliver it to every guild
 * registered for that creator.
 */
async function processContent({
    content
}) {

    try {

        /*
        ====================================
        VALIDATE CONTENT
        ====================================
        */

        validateContent(
            content
        );


        logFeature({

            category:
                'CONTENT_CREATORS',

            message:
                'Processing Content Creator announcement.',

            details: {

                platform:
                    content.platform,

                accountIdentifier:
                    content.accountIdentifier,

                contentId:
                    content.contentId,

                creatorDisplayName:
                    content.creatorDisplayName

            }
        });


        /*
        ====================================
        FIND REGISTRATIONS
        ====================================
        */

        const creators =
            await getCreatorByPlatformAccount({

                platform:
                    content.platform,

                accountIdentifier:
                    content.accountIdentifier

            });


        /*
        ====================================
        NO REGISTRATIONS
        ====================================
        */

        if (
            !creators ||
            creators.length === 0
        ) {

            logFeature({

                category:
                    'CONTENT_CREATORS',

                message:
                    'No Discord guilds are registered for this Content Creator.',

                details: {

                    platform:
                        content.platform,

                    accountIdentifier:
                        content.accountIdentifier,

                    contentId:
                        content.contentId

                }
            });


            return {

                success:
                    true,

                delivered:
                    0,

                skipped:
                    0,

                failed:
                    0,

                reason:
                    'No registered guilds.'

            };
        }


        /*
        ====================================
        DELIVER TO EACH GUILD
        ====================================
        */

        const results = [];

        for (
            const creator
            of creators
        ) {

            const result =
                await deliverToGuild({

                    creator,

                    content

                });


            results.push(
                result
            );
        }


        /*
        ====================================
        SUMMARIZE RESULTS
        ====================================
        */

        const delivered =
            results.filter(
                result =>
                    result.delivered === true
            ).length;


        const skipped =
            results.filter(
                result =>
                    result.skipped === true
            ).length;


        const failed =
            results.filter(
                result =>
                    result.success === false
            ).length;


        logFeature({

            category:
                'CONTENT_CREATORS',

            message:
                'Content Creator announcement processing completed.',

            details: {

                platform:
                    content.platform,

                accountIdentifier:
                    content.accountIdentifier,

                contentId:
                    content.contentId,

                registeredGuilds:
                    creators.length,

                delivered,

                skipped,

                failed

            }
        });


        return {

            success:
                failed === 0,

            delivered,

            skipped,

            failed,

            results

        };

    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.UNKNOWN_ERROR,

            source:
                'announcement-service',

            message:
                'Failed to process Content Creator announcement.',

            details: {

                platform:
                    content?.platform
                    ?? null,

                accountIdentifier:
                    content?.accountIdentifier
                    ?? null,

                contentId:
                    content?.contentId
                    ?? null,

                error:
                    error.message

            }
        });


        throw error;

    }
}


/*
====================================
EXPORTS
====================================
*/

module.exports = {
    processContent,
    buildAnnouncementEmbed,
    validateContent
};
