/**
 * Title: youtube-notifications.js
 * Author: Tango Hunter
 * Date Created: 8/17/26
 * Description: Receives and normalizes YouTube WebSub upload notifications.
 *
 * Responsibilities:
 * • Parse YouTube WebSub Atom/XML notifications
 * • Validate notification structure
 * • Extract YouTube upload information
 * • Normalize the notification into the
 *   shared Content Creator content object
 *
 * This file DOES NOT:
 * • Query the database
 * • Determine which guilds receive announcements
 * • Look up Discord roles
 * • Build Discord embeds
 * • Send Discord messages
 * • Update last_content_id
 *
 * The announcement-service owns those responsibilities.
 */


/*
====================================
DEPENDENCIES
====================================
*/

const {
    XMLParser
} = require('fast-xml-parser');

const {
    logFeature,
    logError
} = require('../core/logging/logger');

const {
    ERROR_TYPES
} = require('../core/logging/error-types');


/*
====================================
PARSER CONFIGURATION
====================================
*/

/*
 * YouTube WebSub sends Atom XML.
 *
 * We preserve attributes because the
 * alternate link contains the actual
 * YouTube video URL.
 *
 * removeNSPrefix allows:
 *
 * yt:videoId
 *
 * to be accessed as:
 *
 * videoId
 *
 * while parsing.
 */
const parser =

    new XMLParser({

        ignoreAttributes:
            false,

        attributeNamePrefix:
            '@_',

        removeNSPrefix:
            true,

        trimValues:
            true

    });


/*
====================================
CONSTANTS
====================================
*/

const YOUTUBE_PLATFORM = 'youtube';

const YOUTUBE_VIDEO_TYPE = 'video';

const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch?v=';

const YOUTUBE_THUMBNAIL_URL = 'https://i.ytimg.com/vi/';


/*
====================================
NORMALIZED CONTENT
====================================
*/

/**
 * Builds the common Content Creator
 * content object used by the
 * announcement-service.
 *
 * The object intentionally contains
 * platform content only.
 *
 * Discord-specific information belongs
 * to the announcement-service.
 */
function buildNormalizedContent({

    accountIdentifier,

    contentId,

    creatorDisplayName,

    contentTitle,

    contentUrl,

    thumbnailUrl,

    publishedAt

}) {

    return {

        platform:

            YOUTUBE_PLATFORM,

        accountIdentifier,

        contentId,

        creatorDisplayName,

        contentTitle,

        contentUrl,

        thumbnailUrl,

        publishedAt,

        contentType:

            YOUTUBE_VIDEO_TYPE

    };
}


/*
====================================
HELPERS
====================================
*/

/**
 * Returns the first item when an Atom
 * element may be represented as either
 * a single object or an array.
 */
function getFirstItem(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {
        return value[0];
    }

    return value;
}


/**
 * Extracts the alternate URL from
 * an Atom entry.
 *
 * YouTube normally provides:
 *
 * <link
 *     rel="alternate"
 *     href="..."
 * />
 */
function extractVideoUrl(
    links
) {

    if (
        !links
    ) {
        return null;
    }


    const linkArray =

        Array.isArray(
            links
        )

            ? links

            : [

                links

            ];


    const alternateLink =

        linkArray.find(

            link =>

                link?.['@_rel'] ===
                    'alternate'

        );


    if (
        alternateLink?.['@_href']
    ) {
        return alternateLink[
            '@_href'
        ];
    }


    /*
    ====================================
    FALLBACK
    ====================================

    If YouTube changes the Atom response
    and does not provide the expected
    alternate link, we can still construct
    the standard video URL from the video ID.
    */

    return null;

}


/**
 * Extracts the creator display name
 * from the Atom author object.
 */
function extractCreatorDisplayName(
    author
) {

    const normalizedAuthor =

        getFirstItem(
            author
        );


    if (
        typeof normalizedAuthor?.name ===
        'string'
    ) {
        return normalizedAuthor.name.trim();
    }


    return null;

}


/**
 * Builds the standard YouTube
 * thumbnail URL from the video ID.
 */
function buildThumbnailUrl(
    contentId
) {

    if (
        !contentId
    ) {
        return null;
    }


    return (

        `${YOUTUBE_THUMBNAIL_URL}` +

        `${contentId}` +

        '/hqdefault.jpg'

    );
}


/**
 * Validates the normalized notification
 * before it is returned to the route.
 */
function validateNotification({

    accountIdentifier,

    contentId,

    creatorDisplayName,

    contentTitle,

    contentUrl,

    publishedAt

}) {

    const missingFields = [];


    if (
        !accountIdentifier
    ) {
        missingFields.push(
            'accountIdentifier'
        );
    }


    if (
        !contentId
    ) {
        missingFields.push(
            'contentId'
        );
    }


    if (
        !creatorDisplayName
    ) {
        missingFields.push(
            'creatorDisplayName'
        );
    }


    if (
        !contentTitle
    ) {
        missingFields.push(
            'contentTitle'
        );
    }


    if (
        !contentUrl
    ) {
        missingFields.push(
            'contentUrl'
        );
    }


    if (
        !publishedAt
    ) {
        missingFields.push(
            'publishedAt'
        );
    }


    if (
        missingFields.length > 0
    ) {
        throw new Error(
            `YouTube notification is missing required fields: ${missingFields.join(', ')}`
        );
    }
}


/*
====================================
NOTIFICATION HANDLER
====================================
*/

/**
 * Processes a YouTube WebSub
 * upload notification.
 *
 * @param {Object} params
 * @param {string} params.body
 *     Raw Atom/XML notification body.
 *
 * @param {Object} params.headers
 *     HTTP headers received with the
 *     WebSub notification.
 *
 * @returns {Object}
 *     Normalized Content Creator object.
 */
async function handleNotification({

    body,

    headers = {}

}) {

    try {

        /*
        ====================================
        VALIDATE REQUEST BODY
        ====================================
        */

        if (
            typeof body !== 'string'
            ||
            body.trim() === ''
        ) {

            throw new Error(

                'YouTube WebSub notification contained an empty request body.'

            );
        }


        /*
        ====================================
        LOG RECEIPT
        ====================================
        */

        logFeature({

            category:

                'CONTENT_CREATORS',

            message:

                'YouTube WebSub notification received.',

            details: {

                contentType:

                    headers[
                        'content-type'
                    ]

                    ||

                    headers[
                        'Content-Type'
                    ]

                    ||

                    null,

                bodyLength:

                    body.length

            }
        });


        /*
        ====================================
        PARSE XML
        ====================================
        */

        let parsed;

        try {

            parsed =

                parser.parse(
                    body
                );

        }

        catch (
            error
        ) {

            throw new Error(

                `Unable to parse YouTube WebSub XML: ${error.message}`

            );

        }


        /*
        ====================================
        LOCATE ATOM ENTRY
        ====================================
        */

        const feed =

            parsed?.feed;


        if (
            !feed
        ) {
            throw new Error(
                'YouTube WebSub notification did not contain an Atom feed.'
            );
        }


        const entry =

            getFirstItem(
                feed.entry
            );


        if (
            !entry
        ) {
            throw new Error(
                'YouTube WebSub notification did not contain an upload entry.'
            );
        }


        /*
        ====================================
        EXTRACT YOUTUBE IDENTIFIERS
        ====================================
        */

        const contentId =

            typeof entry.videoId ===
            'string'

                ? entry.videoId.trim()

                : null;


        const accountIdentifier =

            typeof entry.channelId ===
            'string'

                ? entry.channelId.trim()

                : null;


        /*
        ====================================
        EXTRACT CONTENT INFORMATION
        ====================================
        */

        const contentTitle =

            typeof entry.title ===
            'string'

                ? entry.title.trim()

                : null;


        const creatorDisplayName =

            extractCreatorDisplayName(

                entry.author

            );


        const publishedAt =

            typeof entry.published ===
            'string'

                ? entry.published.trim()

                : null;


        /*
        ====================================
        EXTRACT VIDEO URL
        ====================================
        */

        const notificationVideoUrl =

            extractVideoUrl(
                entry.link
            );


        const contentUrl =

            notificationVideoUrl

            ||

            (

                contentId

                    ? (

                        `${YOUTUBE_VIDEO_URL}` +

                        `${contentId}`

                    )

                    : null

            );


        /*
        ====================================
        BUILD THUMBNAIL
        ====================================
        */

        const thumbnailUrl =

            buildThumbnailUrl(

                contentId

            );


        /*
        ====================================
        VALIDATE CONTENT
        ====================================
        */

        validateNotification({

            accountIdentifier,

            contentId,

            creatorDisplayName,

            contentTitle,

            contentUrl,

            publishedAt

        });


        /*
        ====================================
        BUILD NORMALIZED OBJECT
        ====================================
        */

        const normalizedContent =

            buildNormalizedContent({

                accountIdentifier,

                contentId,

                creatorDisplayName,

                contentTitle,

                contentUrl,

                thumbnailUrl,

                publishedAt

            });


        /*
        ====================================
        LOG SUCCESS
        ====================================
        */

        logFeature({

            category:

                'CONTENT_CREATORS',

            message:

                'YouTube upload notification normalized.',

            details: {

                accountIdentifier,

                contentId,

                creatorDisplayName,

                contentTitle,

                publishedAt

            }
        });


        return normalizedContent;

    }

    catch (
        error
    ) {

        /*
        ====================================
        LOG FAILURE
        ====================================
        */

        logError({

            type:

                ERROR_TYPES.UNKNOWN_ERROR,

            source:

                'youtube-notifications',

            message:

                'Failed to process YouTube WebSub notification.',

            details: {

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
    handleNotification
};
