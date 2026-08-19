/**
 * Title: tiktok-platform.js
 * Author: Tango Hunter
 * Date Created: 7/21/26
 * Date Modified: 8/18/26
 * Description:
 * TikTok platform interaction provider.
 *
 * Handles the Discord-side TikTok Login Kit workflow,
 * temporary OAuth transaction storage, authenticated
 * account confirmation, TikTok authorization persistence,
 * announcement configuration, and standardized draft
 * creation for the content creator handler.
 *
 * TikTok API communication itself remains in tiktok-api.js.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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
    buildAuthorizationUrl,
    exchangeAuthorizationCode,
    getAuthorizedUser,
    calculateTokenExpiration
} = require('./tiktok-api');


const {
    createTikTokAuthorization
} = require('../../../core/database/tiktok-authorization-repository');


const {
    logFeature
} = require('../../../core/logging/logger');


/*
====================================
CUSTOM IDS
====================================
*/

const MODAL_ID =
    'content_creator_tiktok_modal';

const APPROVE_ID =
    'content_creator_tiktok_approve';

const CANCEL_ID =
    'content_creator_tiktok_cancel';


/*
====================================
OAUTH TRANSACTION
====================================

TikTok OAuth data is intentionally kept
in memory.

Nothing in this object is persisted until
the user explicitly confirms the
authenticated TikTok account.

The transaction expires after 10 minutes.

Key:
OAuth state
====================================
*/

const tiktokOAuth = new Map();


const OAUTH_TRANSACTION_MAX_AGE =
    10 * 60 * 1000;


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


/*
====================================
BUILD ANNOUNCEMENT PREVIEW
====================================
*/

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
CREATE OAUTH TRANSACTION
====================================
*/

function createOAuthTransaction({
    state,
    interaction
}) {

    if (
        !state
        ||
        !interaction
    ) {
        throw new Error(
            'TikTok OAuth transaction requires state and interaction.'
        );
    }

    tiktokOAuth.set(
        state,
        {
            guildId:
                interaction.guild.id,

            userId:
                interaction.user.id,

            interaction,

            createdAt:
                Date.now()
        }
    );
}


/*
====================================
GET OAUTH TRANSACTION
====================================
*/

function getOAuthTransaction(
    state
) {

    if (
        !state
    ) {
        return null;
    }

    const transaction =
        tiktokOAuth.get(
            state
        );

    if (
        !transaction
    ) {
        return null;
    }

    const age =
        Date.now() -
        transaction.createdAt;

    if (
        age < 0
        ||
        age > OAUTH_TRANSACTION_MAX_AGE
    ) {
        tiktokOAuth.delete(
            state
        );

        return null;
    }

    return transaction;
}


/*
====================================
DELETE OAUTH TRANSACTION
====================================
*/

function deleteOAuthTransaction(
    state
) {

    if (
        !state
    ) {
        return;
    }

    tiktokOAuth.delete(
        state
    );
}


/*
====================================
CLEAN EXPIRED OAUTH TRANSACTIONS
====================================
*/

function cleanupOAuthTransactions() {

    const now =
        Date.now();

    for (
        const [
            state,
            transaction
        ]
        of
        tiktokOAuth
    ) {
        if (
            now -
            transaction.createdAt
            >
            OAUTH_TRANSACTION_MAX_AGE
        ) {
            tiktokOAuth.delete(
                state
            );
        }
    }
}


/*
====================================
OAUTH CLEANUP TIMER
====================================
*/

const oauthCleanupInterval =
    setInterval(
        cleanupOAuthTransactions,
        60 * 1000
    );

if (
    typeof oauthCleanupInterval.unref ===
    'function'
) {
    oauthCleanupInterval.unref();
}


/*
====================================
BUILD LOGIN EMBED
====================================
*/

function buildLoginEmbed() {

    return new EmbedBuilder()

        .setColor(
            embedThemes.contentCreator.color
        )

        .setTitle(
            `${embedThemes.contentCreator.icon} Connect TikTok`
        )

        .setDescription(
            [
                'To register a TikTok content creator,',
                'you must first authorize SYNARA to access',
                'the TikTok account.',
                '',
                '**TikTok permissions requested:**',
                '• Basic profile information',
                '• Public TikTok videos',
                '',
                'Click **Login with TikTok** below to continue.'
            ].join(
                '\n'
            )
        )

        .setFooter({
            text:
                embedThemes.contentCreator.footer
        });
}


/*
====================================
BUILD LOGIN BUTTON
====================================
*/

function buildLoginButton(
    authorizationUrl
) {

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()

                .setLabel(
                    'Login with TikTok'
                )

                .setStyle(
                    ButtonStyle.Link
                )

                .setURL(
                    authorizationUrl
                )
        );
}


/*
====================================
SHOW MODAL
====================================

The generic content-creator handler
calls this function when TikTok is
selected.

For TikTok, "showModal" begins the
OAuth workflow instead of immediately
showing a Discord modal.
====================================
*/

async function showModal(
    interaction
) {

    const {
        authorizationUrl,
        state
    } =
        buildAuthorizationUrl({
            guildId:
                interaction.guild.id,

            userId:
                interaction.user.id
        });


    createOAuthTransaction({
        state,
        interaction
    });

    logFeature({
        category:
            'Content Creator',

        message:
            'TikTok OAuth authorization started.',

        details: {
            guildId:
                interaction.guild.id,

            userId:
                interaction.user.id
        }
    });

    return await interaction.update({

        embeds: [
            buildLoginEmbed()
        ],

        components: [
            buildLoginButton(
                authorizationUrl
            )
        ]
    });
}


/*
====================================
BUILD AUTHENTICATED ACCOUNT EMBED
====================================
*/

function buildAuthenticatedAccountEmbed({
    creatorDisplayName,
    creatorUrl,
    avatarUrl
}) {

    const embed =
        new EmbedBuilder()

            .setColor(
                embedThemes.contentCreator.color
            )

            .setTitle(
                `${embedThemes.contentCreator.icon} TikTok Account Authorized`
            )

            .setDescription(
                [
                    'TikTok authorization was successful.',
                    '',
                    'Please verify that this is the account you intended to connect.',
                    '',
                    '**Do not continue unless you recognize this account.**'
                ].join(
                    '\n'
                )
            )

            .addFields(

                {
                    name:
                        'Creator',

                    value:
                        creatorDisplayName
                        ||
                        'TikTok Creator',

                    inline:
                        false
                },

                {
                    name:
                        'Profile',

                    value:
                        creatorUrl
                        ||
                        'Profile link unavailable',

                    inline:
                        false
                }

            )

            .setFooter({
                text:
                    embedThemes.contentCreator.footer
            });

    if (
        avatarUrl
    ) {
        embed.setThumbnail(
            avatarUrl
        );
    }


    return embed;
}


/*
====================================
BUILD AUTHENTICATED ACCOUNT BUTTONS
====================================
*/

function buildAuthenticatedAccountButtons() {

    return [

        createApprovalButtons({

            approveId:
                APPROVE_ID,

            cancelId:
                CANCEL_ID

        })
    ];
}


/*
====================================
HANDLE OAUTH CALLBACK
====================================

This function is called by the Express
TikTok callback route.

The route remains responsible for
receiving the HTTP request.

This function remains responsible for
the TikTok/Discord workflow.
====================================
*/

async function handleOAuthCallback({
    code,
    state,
    error,
    errorDescription
}) {

    const transaction =
        getOAuthTransaction(
            state
        );

    if (
        !transaction
    ) {
        throw new Error(
            'TikTok authorization session has expired or could not be found.'
        );
    }

    const {
        interaction
    } =
        transaction;

    if (
        error
    ) {
        deleteOAuthTransaction(
            state
        );

        await interaction.editReply({

            embeds: [

                new EmbedBuilder()

                    .setColor(
                        embedThemes.contentCreator.color
                    )

                    .setTitle(
                        `${embedThemes.contentCreator.icon} TikTok Authorization Failed`
                    )

                    .setDescription(
                        errorDescription
                        ||
                        'TikTok authorization was cancelled or could not be completed.'
                    )

                    .setFooter({
                        text:
                            embedThemes.contentCreator.footer
                    })
            ],

            components: []

        });


        return {
            success:
                false,

            error:
                errorDescription
                ||
                error
        };
    }

    if (
        !code
    ) {
        throw new Error(
            'TikTok authorization callback did not contain an authorization code.'
        );
    }

    const authorization =
        await exchangeAuthorizationCode(
            code
        );

    const authorizedUser =
        await getAuthorizedUser(
            authorization.accessToken
        );

    if (
        !authorizedUser?.accountIdentifier
    ) {
        throw new Error(
            'TikTok did not return a valid authorized account.'
        );
    }

    const oauthData = {

        guildId:
            transaction.guildId,

        userId:
            transaction.userId,

        accountIdentifier:
            authorization.accountIdentifier,

        accessToken:
            authorization.accessToken,

        refreshToken:
            authorization.refreshToken,

        accessTokenExpiresIn:
            authorization.accessTokenExpiresIn,

        refreshTokenExpiresIn:
            authorization.refreshTokenExpiresIn,

        scope:
            authorization.scope,

        tokenType:
            authorization.tokenType,

        creatorDisplayName:
            authorizedUser.creatorDisplayName,

        creatorUrl:
            authorizedUser.creatorUrl,

        avatarUrl:
            authorizedUser.avatarUrl

    };

    tiktokOAuth.set(
        state,
        {
            ...transaction,

            oauthData,

            authenticatedAt:
                Date.now()
        }
    );

    const embed =
        buildAuthenticatedAccountEmbed({

            creatorDisplayName:
                oauthData.creatorDisplayName,

            creatorUrl:
                oauthData.creatorUrl,

            avatarUrl:
                oauthData.avatarUrl

        });

    const components =
        buildAuthenticatedAccountButtons();

    await interaction.editReply({

        embeds: [
            embed
        ],

        components

    });

    logFeature({

        category:
            'Content Creator',

        message:
            'TikTok account authorization completed.',

        details: {

            guildId:
                transaction.guildId,

            userId:
                transaction.userId,

            accountIdentifier:
                authorization.accountIdentifier,

            creatorDisplayName:
                authorizedUser.creatorDisplayName

        }
    });


    return {

        success:
            true,

        accountIdentifier:
            authorization.accountIdentifier,

        creatorDisplayName:
            authorizedUser.creatorDisplayName,

        creatorUrl:
            authorizedUser.creatorUrl,

        avatarUrl:
            authorizedUser.avatarUrl

    };
}


/*
====================================
BUILD ANNOUNCEMENT MODAL
====================================
*/

function buildAnnouncementModal() {

    const modal =
        new ModalBuilder()

            .setCustomId(
                MODAL_ID
            )

            .setTitle(
                'TikTok Announcement'
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
                'Optional message appended to every TikTok announcement.'
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
                announcement
            )
    );

    return modal;
}


/*
====================================
HANDLE APPROVAL BUTTON
====================================

The authenticated account has already
been retrieved from TikTok.

The approval button does NOT write to
the database yet.

It simply opens the announcement modal.

The database write occurs after the
user submits that modal.
====================================
*/

async function handleApproval(
    interaction
) {

    if (
        !interaction.isButton()
        ||
        interaction.customId !==
            APPROVE_ID
    ) {
        return {
            handled:
                false
        };
    }

    const transaction =
        findOAuthTransactionForUser({

            guildId:
                interaction.guild.id,

            userId:
                interaction.user.id

        });

    if (
        !transaction
        ||
        !transaction.oauthData
    ) {

        await interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor(
                        embedThemes.contentCreator.color
                    )

                    .setTitle(
                        `${embedThemes.contentCreator.icon} TikTok Setup Expired`
                    )

                    .setDescription(
                        'This TikTok authorization session has expired. Please run `/contentcreator add` again.'
                    )

                    .setFooter({
                        text:
                            embedThemes.contentCreator.footer
                    })

            ],

            components: []

        });


        return {
            handled:
                true,

            success:
                false
        };
    }

    return await interaction.showModal(
        buildAnnouncementModal()
    );
}


/*
====================================
FIND OAUTH TRANSACTION FOR USER
====================================
*/

function findOAuthTransactionForUser({
    guildId,
    userId
}) {

    const now =
        Date.now();


    for (
        const [
            state,
            transaction
        ]
        of
        tiktokOAuth
    ) {

        if (
            transaction.guildId !==
                guildId
            ||
            transaction.userId !==
                userId
        ) {
            continue;
        }

        if (
            now -
            transaction.createdAt
            >
            OAUTH_TRANSACTION_MAX_AGE
        ) {
            tiktokOAuth.delete(
                state
            );

            continue;
        }

        if (
            transaction.oauthData
        ) {
            return {

                state,

                ...transaction

            };
        }
    }

    return null;
}


/*
====================================
HANDLE CANCEL
====================================
*/

async function handleCancel(
    interaction
) {

    if (
        !interaction.isButton()
        ||
        interaction.customId !==
            CANCEL_ID
    ) {
        return {
            handled:
                false
        };
    }

    const transaction =
        findOAuthTransactionForUser({

            guildId:
                interaction.guild.id,

            userId:
                interaction.user.id

        });


    if (
        transaction
    ) {
        deleteOAuthTransaction(
            transaction.state
        );
    }


    await interaction.update({

        content:
            'TikTok content creator setup cancelled.',

        embeds: [],

        components: []

    });


    return {

        handled:
            true,

        success:
            true

    };
}


/*
====================================
MODAL HANDLER
====================================

This is called by the generic
content-creator handler after the
user submits the announcement modal.

This is the point where the TikTok
authorization is permanently stored.
====================================
*/

async function handleModal(
    interaction
) {

    const customMessage =
        normalizeAnnouncementMessage(
            interaction.fields.getTextInputValue(
                'announcement_message'
            )
        );


    const transaction =
        findOAuthTransactionForUser({

            guildId:
                interaction.guild.id,

            userId:
                interaction.user.id

        });


    if (
        !transaction
        ||
        !transaction.oauthData
    ) {

        return {

            success:
                false,

            error:
                'This TikTok authorization session has expired. Please run `/contentcreator add` again.'

        };
    }


    const {
        oauthData
    } =
        transaction;


    let accessTokenExpiresAt;
    let refreshTokenExpiresAt;


    try {

        accessTokenExpiresAt =
            calculateTokenExpiration(
                oauthData.accessTokenExpiresIn
            );


        refreshTokenExpiresAt =
            calculateTokenExpiration(
                oauthData.refreshTokenExpiresIn
            );
    }

    catch (
        error
    ) {

        logFeature({

            category:
                'Content Creator',

            message:
                'TikTok authorization returned invalid token expiration data.',

            details: {

                guildId:
                    transaction.guildId,

                userId:
                    transaction.userId,

                accountIdentifier:
                    oauthData.accountIdentifier,

                error:
                    error.message

            }
        });


        return {

            success:
                false,

            error:
                'TikTok returned invalid authorization expiration information. Please try again.'

        };
    }


    try {

        await createTikTokAuthorization({

            accountIdentifier:
                oauthData.accountIdentifier,

            accessToken:
                oauthData.accessToken,

            refreshToken:
                oauthData.refreshToken,

            accessTokenExpiresAt,

            refreshTokenExpiresAt,

            scope:
                oauthData.scope,

            tokenType:
                oauthData.tokenType

        });
    }

    catch (
        error
    ) {

        logFeature({

            category:
                'Content Creator',

            message:
                'Failed to store TikTok authorization.',

            details: {

                guildId:
                    transaction.guildId,

                userId:
                    transaction.userId,

                accountIdentifier:
                    oauthData.accountIdentifier,

                error:
                    error.message

            }
        });


        return {

            success:
                false,

            error:
                'SYNARA could not save the TikTok authorization. Please try again.'

        };
    }


    const generatedAnnouncement =
        buildAnnouncementPreview(
            customMessage
        );


    const embed =
        buildConfirmationEmbed({

            creatorDisplayName:
                oauthData.creatorDisplayName,

            creatorUrl:
                oauthData.creatorUrl,

            generatedAnnouncement

        });


    const components =
        createApprovalButtons({

            approveId:
                APPROVE_ID,

            cancelId:
                CANCEL_ID

        });


    const draft = {

        platform:
            'tiktok',

        accountIdentifier:
            oauthData.accountIdentifier,

        creatorDisplayName:
            oauthData.creatorDisplayName,

        accountUrl:
            oauthData.creatorUrl,

        messageTemplate:
            customMessage,

        discordUserId:
            transaction.userId

    };


    deleteOAuthTransaction(
        transaction.state
    );


    logFeature({

        category:
            'Content Creator',

        message:
            'TikTok content creator configuration confirmed.',

        details: {

            guildId:
                transaction.guildId,

            userId:
                transaction.userId,

            accountIdentifier:
                oauthData.accountIdentifier,

            creatorDisplayName:
                oauthData.creatorDisplayName

        }
    });


    return {

        success:
            true,

        draft,

        embed,

        components

    };
}


/*
====================================
BUILD CONFIRMATION EMBED
====================================
*/

function buildConfirmationEmbed({
    creatorDisplayName,
    creatorUrl,
    generatedAnnouncement
}) {

    const embed =
        new EmbedBuilder()

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
                        creatorDisplayName
                        ||
                        'TikTok Creator',

                    inline:
                        false
                },

                {
                    name:
                        'Profile',

                    value:
                        creatorUrl
                        ||
                        'Profile link unavailable',

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


    return embed;
}


/*
====================================
EXPORTS
====================================
*/

module.exports = {

    modalId:
        MODAL_ID,
    approveId:
        APPROVE_ID,
    cancelId:
        CANCEL_ID,

    showModal,
    handleModal,
    handleOAuthCallback,
    handleApproval,
    handleCancel
};
