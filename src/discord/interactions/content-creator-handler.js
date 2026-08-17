/**
 * Title: content-creator-handler.js
 * Author: Tango Hunter
 * Date Created: 7/19/26
 * Description: Handles all Content Creator interaction workflows.
 */

const {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const {
    createApprovalButtons
} = require('../utils/approval-workflow');

const {
    embedThemes
} = require('../../core/config/embed-themes');

const {
    sendDiscordMessage
} = require('../services/post-message');

const {
    discordLog
} = require('../../core/logging/discord-logger');

const {
    createCreator
} = require('../../core/database/content-creators-repository');

const {
    initializeSubscription
} = require('../../content-creators/subscription-service');

const {
    getPlatform,
    getPlatformLabel
} = require('./content-creator/platform-selection');


/*
====================================
SUPPORTED PROVIDER IMPORTS
====================================
*/
const YouTubePlatform =
    require('./content-creator/youtube-platform');

const TikTokPlatform =
    require('./content-creator/tiktok-platform');


/*
====================================
SUPPORTED PROVIDERS

Add one line here for each new
platform.
====================================
*/

const PLATFORM_MODULES = {

    youtube:
        YouTubePlatform,

     tiktok:
         TikTokPlatform

};

/*
====================================
TEMPORARY DRAFT STORAGE

Key:

guildId:userId
====================================
*/

const contentCreatorDrafts = new Map();

/*
====================================
HELPERS
====================================
*/

function getDraftKey({

    guildId,

    userId

}) {

    return `${guildId}:${userId}`;

}

function getDraft({

    guildId,

    userId

}) {

    return (

        contentCreatorDrafts.get(

            getDraftKey({

                guildId,

                userId

            })

        )

        ??

        null

    );
}

function saveDraft({

    guildId,

    userId,

    draft

}) {

    contentCreatorDrafts.set(

        getDraftKey({

            guildId,

            userId

        }),

        draft

    );
}

function deleteDraft({

    guildId,

    userId

}) {

    contentCreatorDrafts.delete(

        getDraftKey({

            guildId,

            userId

        })
    );
}

/*
====================================
EMBEDS
====================================
*/

function buildPlatformEmbed(

    platform

) {

    return new EmbedBuilder()

        .setColor(

            embedThemes.contentCreator.color

        )

        .setTitle(

            `${embedThemes.contentCreator.icon} Register Content Creator`

        )

        .setDescription(

            `Platform Selected\n\n**${platform.label}**\n\nSelect the Discord channel where announcements should be posted.`

        )

        .setFooter({

            text:

                embedThemes.contentCreator.footer

        });
}

/*
====================================
CHANNEL SELECTOR
====================================
*/

function buildChannelSelector(

    platformId

) {

    return new ActionRowBuilder()

        .addComponents(

            new ChannelSelectMenuBuilder()

                .setCustomId(

                    `content_creator_channel:${platformId}`

                )

                .setPlaceholder(

                    'Select an announcement channel...'

                )

                .setChannelTypes(

                    ChannelType.GuildText

                )

                .setMinValues(

                    1

                )

                .setMaxValues(

                    1

                )
        );
}

/*
====================================
ADD WORKFLOW
====================================
*/

async function handlePlatformSelection(

    interaction

) {

    const platformId =

        interaction.values[0];

    const platform =

        getPlatform(

            platformId

        );

    if (
        !platform
    ) {
        return true;
    }

    saveDraft({

        guildId:

            interaction.guild.id,

        userId:

            interaction.user.id,

        draft: {

            platform:

                platform.id

        }
    });

    await interaction.update({

        embeds: [

            buildPlatformEmbed(

                platform

            )
        ],

        components: [

            buildChannelSelector(

                platform.id

            )
        ]
    });

    return true;
}

async function handleChannelSelection(

    interaction

) {

    const [

        ,

        platformId

    ] =

        interaction.customId.split(

            ':'

        );

    const platform =

        getPlatform(

            platformId

        );

    if (
        !platform
    ) {
        return true;
    }

    const draft =

        getDraft({

            guildId:

                interaction.guild.id,

            userId:

                interaction.user.id

        });

    if (
        !draft
    ) {

        await interaction.update({

            content:

                'This setup session has expired. Please run `/contentcreator add` again.',

            embeds: [],

            components: []

        });

        return true;
    }

    draft.discordChannelId =

        interaction.values[0];

    saveDraft({

        guildId:

            interaction.guild.id,

        userId:

            interaction.user.id,

        draft

    });

    const provider =

        PLATFORM_MODULES[platform.id];

    if (
        !provider
    ) {

        await interaction.update({

            content:

                'Unsupported content platform.',

            embeds: [],

            components: []

        });

        deleteDraft({

            guildId:

                interaction.guild.id,

            userId:

                interaction.user.id

        });

        return true;

    }

    await provider.showModal(

        interaction

    );

    return true;

}

/*
====================================
FINALIZE CREATOR
====================================
*/

async function finalizeCreator({

    interaction,

    draft

}) {

    try {

        /*
        ====================================
        INITIALIZE PLATFORM SUBSCRIPTION
        ====================================

        The subscription service determines
        whether this platform supports a
        subscription mechanism.

        Platforms without subscription
        support return:

            subscriptionSupported: false
            subscriptionRequested: false
            subscriptionExpiresAt: null

        Platforms with subscription support
        initialize their platform-specific
        subscription here.

        For YouTube, the initial expiration
        will normally be null because the
        actual WebSub lease is provided later
        by YouTube's verification challenge.
        */

        const subscriptionResult =

            await initializeSubscription({

                platform:

                    draft.platform,

                accountIdentifier:

                    draft.accountIdentifier

            });


        /*
        ====================================
        CREATE CONTENT CREATOR RECORD
        ====================================

        subscriptionExpiresAt may be null.

        This is intentional.

        For WebSub platforms such as YouTube,
        the actual expiration is supplied by
        the platform during verification and
        is subsequently written to the
        database by the subscription service.
        */

        await createCreator({

            guildId:

                interaction.guild.id,

            discordChannelId:

                draft.discordChannelId,

            discordUserId:

                interaction.user.id,

            platform:

                draft.platform,

            accountIdentifier:

                draft.accountIdentifier,

            creatorDisplayName:

                draft.creatorDisplayName,

            messageTemplate:

                draft.messageTemplate,

            subscriptionExpiresAt:

                subscriptionResult.subscriptionExpiresAt

        });
    }

    catch (
        error
    ) {

        /*
        ====================================
        DUPLICATE CREATOR
        ====================================
        */

        if (
            error.code === '23505'
        ) {

            deleteDraft({

                guildId:

                    interaction.guild.id,

                userId:

                    interaction.user.id

            });


            await interaction.update({

                embeds: [

                    new EmbedBuilder()

                        .setColor(

                            embedThemes.alert.color

                        )

                        .setTitle(

                            `${embedThemes.alert.icon} Content Creator Already Exists`

                        )

                        .setDescription(

                            `${draft.creatorDisplayName} is already registered for ${getPlatformLabel(draft.platform)} announcements on this server.`

                        )

                        .setFooter({

                            text:

                                embedThemes.contentCreator.footer

                        })
                ],

                components: []

            });


            return;

        }

        throw error;

    }


    await discordLog({

        guildId:

            interaction.guild.id,

        title:

            'Content Creator Added',

        category:

            'Administrative Action',

        details:

            `${draft.creatorDisplayName} on ${draft.platform} has been added to automated announcements on <#${draft.discordChannelId}> by <@${interaction.user.id}>.`,

        status:

            'SUCCESS'

    });


    deleteDraft({

        guildId:

            interaction.guild.id,

        userId:

            interaction.user.id

    });


    await interaction.update({

        embeds: [

            new EmbedBuilder()

                .setColor(

                    embedThemes.contentCreator.color

                )

                .setTitle(

                    `${embedThemes.contentCreator.icon} Content Creator Added`

                )

                .setDescription(

                    `${draft.creatorDisplayName} has been successfully registered for ${getPlatformLabel(draft.platform)} announcements.`

                )

                .addFields(

                    {

                        name:

                            'Platform',

                        value:

                            getPlatformLabel(

                                draft.platform

                            ),

                        inline:

                            true

                    },

                    {

                        name:

                            'Announcement Channel',

                        value:

                            `<#${draft.discordChannelId}>`,

                        inline:

                            true

                    }

                )

                .setFooter({

                    text:

                        embedThemes.contentCreator.footer

                })

        ],

        components: []

    });


    await sendDiscordMessage({

        channelId:

            draft.discordChannelId,

        embed:

            new EmbedBuilder()

                .setColor(

                    embedThemes.contentCreator.color

                )

                .setTitle(

                    `${embedThemes.contentCreator.icon} Content Creator Added`

                )

                .setDescription(

                    `${draft.creatorDisplayName} has been successfully registered for ${getPlatformLabel(draft.platform)} announcements on this channel.`

                )

                .setFooter({

                    text:

                        embedThemes.contentCreator.footer

                })
    });
}

/*
====================================
MODAL RESULTS
====================================
*/

async function handleProviderModal(

    interaction

) {

    const draft =

        getDraft({

            guildId:

                interaction.guild.id,

            userId:

                interaction.user.id

        });

    if (
        !draft
    ) {
        return true;
    }

    const [

        ,

        ,

        platform

    ] =

        interaction.customId.split(

            '_'

        );

    const provider =

        PLATFORM_MODULES[platform];

    if (
        !provider
    ) {

        deleteDraft({

            guildId:

                interaction.guild.id,

            userId:

                interaction.user.id

        });

        await interaction.reply({

            content:

                'Unsupported content platform.',

            flags:
                MessageFlags.Ephemeral

        });

        return true;
    }

    const result =

        await provider.handleModal(

            interaction

        );

    if (
        !result.success
    ) {

        await interaction.reply({

            content:

                result.error,

            flags:
                MessageFlags.Ephemeral

        });

        return true;

    }

    saveDraft({

        guildId:

            interaction.guild.id,

        userId:

            interaction.user.id,

        draft: {

            ...draft,

            ...result.draft

        }
    });

    await interaction.reply({

        embeds: [

            result.embed

        ],

        components:

            result.components,

        flags:
            MessageFlags.Ephemeral

    });

    return true;
}

/*
====================================
FINAL APPROVAL
====================================
*/

async function handleProviderApproval(

    interaction

) {

    const draft =

        getDraft({

            guildId:

                interaction.guild.id,

            userId:

                interaction.user.id

        });

    if (
        !draft
    ) {

        await interaction.update({

            content:

                'This setup session has expired.',

            embeds: [],

            components: []

        });

        return true;

    }

    await finalizeCreator({

        interaction,

        draft

    });

    return true;
}

async function handleProviderCancellation(

    interaction

) {

    deleteDraft({

        guildId:

            interaction.guild.id,

        userId:

            interaction.user.id

    });

    await interaction.update({

        content:

            'Content creator setup cancelled.',

        embeds: [],

        components: []

    });

    return true;
}

/*
====================================
MAIN ROUTER
====================================
*/

async function handleContentCreatorInteraction(

    interaction

) {

    /*
    ================================
    Platform Selection
    ================================
    */

    if (

        interaction.isStringSelectMenu()

        &&

        interaction.customId ===

        'content_creator_platform'

    ) {

        return await handlePlatformSelection(

            interaction

        );
    }

    /*
    ================================
    Channel Selection
    ================================
    */

    if (

        interaction.isChannelSelectMenu()

        &&

        interaction.customId.startsWith(

            'content_creator_channel:'

        )
    ) {

        return await handleChannelSelection(

            interaction

        );
    }

    /*
    ====================================
    Provider Modal Dispatch
    ====================================
    */

    if (

        interaction.isModalSubmit()

        &&

        interaction.customId.startsWith(

            'content_creator_'

        )

        &&

        interaction.customId.endsWith(

            '_modal'

        )
    ) {

        return await handleProviderModal(

            interaction

        );
    }

    /*
    ================================
    Final Approval
    ================================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(

            'content_creator_'

        )

        &&

        interaction.customId.endsWith(

            '_approve'

        )
    ) {

        return await handleProviderApproval(

            interaction

        );
    }

    /*
    ================================
    Final Cancellation
    ================================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(

            'content_creator_'

        )

        &&

        interaction.customId.endsWith(

            '_cancel'

        )
    ) {

        return await handleProviderCancellation(

            interaction

        );
    }

    return false;
}

module.exports = {
    handleContentCreatorInteraction
};
