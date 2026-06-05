/**
 * Title: onboarding-handler.js
 * Author: Tango Hunter
 * Date Created: 5/26/26
 * Date Modified: 5/26/26
 * Description: Handles all onboarding traffic.
 */

const {
    EmbedBuilder
} = require('discord.js');

const {
    getGuildConfig
} = require('../../core/config/guild-config');

const {
    buildWelcomeEmbed,
    buildRulesEmbed
} = require('./onboarding-embed');

const {
    buildVerificationModal
} = require('./onboarding-modal');

const {
    storeOnboardingMessage,
    getOnboardingMessage,
    removeOnboardingMessage
} = require('./onboarding-session-manager');

const {
    discordLog
} = require('../../core/logging/discord-logger');

const {
    logFeature
} = require('../../core/logging/logger');


async function handleNewMember(
    member
) {

    const guildConfig =

        getGuildConfig(
            member.guild.id
        );

    if (
        !guildConfig?.features?.onboarding

    ) {
        return;
    }

    if (
        !guildConfig
    ) {

        return;
    }

    const channel =

        await member.guild.channels.fetch(

            guildConfig
                .onboarding
                .welcomeChannelId
        );

    const {

        embed,

        buttonRow

    } = buildWelcomeEmbed(
        member
    );

    const sentMessage =

        await channel.send({

            embeds: [
                embed
            ],

            components: [
                buttonRow
            ]
        });

    storeOnboardingMessage({

        userId:
            member.id,

        messageId:
            sentMessage.id
    });

    logFeature({

        category:
            'ONBOARDING',

        message:
            'Welcome message created',

        details: {

            guildName:
                member.guild.name,

            guildId:
                member.guild.id,

            userId:
                member.id,

            username:
                member.user.username,

            messageId:
                sentMessage.id
        }
    });
}

async function handleOnboardingInteraction(
    interaction
) {

    const guildConfig =
        getGuildConfig(
            interaction.guild.id
        );
    
    if (
        !guildConfig?.features?.onboarding
    ) {
        return;
    }

    /*
    ============================
    BEGIN ONBOARDING
    ============================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(

            'begin_onboarding_'
        )
    ) {

        logFeature({

            category:
                'ONBOARDING',

            message:
                'Onboarding started',

            details: {

                guildName:
                    interaction.guild.name,

                guildId:
                    interaction.guild.id,

                userId:
                    interaction.user.id,

                username:
                    interaction.user.username
            }
        });

        const targetUserId =

            interaction.customId.split(
                '_'
            )[2];

        if (
            interaction.user.id !==
            targetUserId
        ) {

            return await interaction.reply({

                content:
                    'This onboarding prompt does not belong to you.',

                flags: 64
            });
        }

        const {

            embed,

            buttonRow

        } = buildRulesEmbed();

        return await interaction.reply({

            embeds: [
                embed
            ],

            components: [
                buttonRow
            ],

            flags: 64
        });
    }

    /*
    ============================
    OPEN MODAL
    ============================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===
        'open_verification_modal'
    ) {

        return await interaction.showModal(

            buildVerificationModal()
        );
    }

    /*
    ============================
    MODAL SUBMIT
    ============================
    */

    if (

        interaction.isModalSubmit()

        &&

        interaction.customId ===
        'verification_modal'
    ) {

        const response =

            interaction.fields

                .getTextInputValue(
                    'verification_response'
                )

                .trim()

                .toLowerCase();

        if (
            response !==
            'i understand'
        ) {

            logFeature({

                category:
                    'ONBOARDING',

                message:
                    'Verification failed',

                details: {

                    guildName:
                        interaction.guild.name,

                    guildId:
                        interaction.guild.id,

                    userId:
                        interaction.user.id,

                    username:
                        interaction.user.username
                }
            });

            return await interaction.reply({

                content:
                    'Verification failed. Please type: I understand',

                flags: 64
            });
        }

        const member =
            interaction.member;

        if (

            member.roles.cache.has(

                guildConfig
                    .onboarding
                    .verifiedRoleId
            )
        ) {

            return await interaction.reply({

                content:
                    'Verification already completed.',

                flags: 64
            });
        }

        await member.roles.add(

            guildConfig
                .onboarding
                .verifiedRoleId
        );

        logFeature({

            category:
                'ONBOARDING',

            message:
                'Verified role assigned',

            details: {

                guildName:
                    interaction.guild.name,

                guildId:
                    interaction.guild.id,

                userId:
                    interaction.user.id,

                username:
                    interaction.user.username,

                roleId:
                    guildConfig.onboarding.verifiedRoleId
            }
        });

        await interaction.reply({

            content:
                'Verification complete. Welcome to this system.',

            flags: 64
        });

        await finalizeOnboarding(
            member
        );
    }
}

async function finalizeOnboarding(
    member
) {

    const guildConfig =

        getGuildConfig(
            member.guild.id
        );

    if (
        !guildConfig
    ) {

        return;
    }

    const messageId =

        getOnboardingMessage(
            member.id
        );

    if (
        !messageId
    ) {

        return;
    }

    const channel =

        await member.guild.channels.fetch(

            guildConfig
                .onboarding
                .welcomeChannelId
        );

    const message =

        await channel.messages.fetch(
            messageId
        );

    const rolesMention =

        `<#${guildConfig.onboarding.rolesChannelId}>`;

    const introMention =

        `<#${guildConfig.onboarding.introChannelId}>`;

    const completedEmbed =

        new EmbedBuilder()

            .setColor(
                0x1ABC9C
            )

            .setTitle(
                '◉ Welcome to the Server'
            )

            .setDescription(
`
Welcome <@${member.id}>.

**Verification complete.**

Access has been granted.

**Next Steps**

• Visit ${rolesMention} to configure your community interests.

• Introduce yourself in ${introMention}.

• Explore available channels and begin participating.

The collective recognizes your presence.
`
            )

            .setFooter({

                text:
                    'SYNARA • Onboarding Complete'
            });

    await message.edit({

        embeds: [
            completedEmbed
        ],

        components: []
    });

    await discordLog({

        guildId:
            member.guild.id,

        category:
            'ONBOARDING',

        details:
            `Verification completed for <@${member.id}>`,

        status:
            'SUCCESS'
    });

    logFeature({

        category:
            'ONBOARDING',

        message:
            'Onboarding completed',

        details: {

            guildName:
                member.guild.name,

            guildId:
                member.guild.id,

            userId:
                member.id,

            username:
                member.user.username
        }
    });

    removeOnboardingMessage(
        member.id
    );
}

module.exports = {
    handleNewMember,
    handleOnboardingInteraction,
    finalizeOnboarding
};
