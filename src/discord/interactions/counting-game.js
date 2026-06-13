/**
 * Title: counting-game.js
 * Author: Tango Hunter
 * Date Created: 6/12/26
 * Description: Tracks counting failures and transfers the configured failure role.
 */

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    getFeatureFlag
} = require('../../core/database/feature-flags-repository');

const {
    logFeature,
    logError
} = require('../../core/logging/logger');


async function handleCountingGame(
    message
) {

    /*
    ============================
    GUILD ONLY
    ============================
    */

    if (
        !message.guild
    ) {

        return;
    }

    /*
    ============================
    FEATURE ENABLED
    ============================
    */

    const enabled =

        await getFeatureFlag({

            guildId:
                message.guild.id,

            featureName:
                'countingPenalties'
        });

    if (
        !enabled
    ) {

        return;
    }

    /*
    ============================
    SETTINGS
    ============================
    */

    const countingChannelId =

        await getGuildSetting({

            guildId:
                message.guild.id,

            settingName:
                'channel_counting'
        });

    const countingBotId =

        await getGuildSetting({

            guildId:
                message.guild.id,

            settingName:
                'counting_bot'
        });

    const failureRoleId =

        await getGuildSetting({

            guildId:
                message.guild.id,

            settingName:
                'role_counting_failure'
        });

    if (

        !countingChannelId

        ||

        !countingBotId

        ||

        !failureRoleId

    ) {

        return;
    }

    /*
    ============================
    CORRECT CHANNEL
    ============================
    */

    if (
        message.channel.id !==
        countingChannelId
    ) {

        return;
    }

    /*
    ============================
    CORRECT BOT
    ============================
    */

    if (
        message.author.id !==
        countingBotId
    ) {

        return;
    }

    /*
    ============================
    FAILURE MESSAGE
    ============================
    */

    if (

        !message.content.includes(
            'RUINED IT AT'
        )

    ) {

        return;
    }

    /*
    ============================
    OFFENDING USER
    ============================
    */

    const offender =

        message.mentions.users.first();

    if (
        !offender
    ) {

        return;
    }

    const member =

        await message.guild.members.fetch(
            offender.id
        );

    const failureRole =

        message.guild.roles.cache.get(
            failureRoleId
        );

    if (
        !failureRole
    ) {

        return;
    }

    /*
    ============================
    REMOVE ROLE FROM EVERYONE
    ============================
    */

    for (

        const currentMember

        of

        failureRole.members.values()

    ) {

        try {

            await currentMember.roles.remove(
                failureRole
            );

        } catch (error) {

            logError({

                type:
                    'COUNTING_GAME',

                source:
                    'counting-role-remove',

                message:
                    error.message,

                details: {

                    guildId:
                        message.guild.id,

                    userId:
                        currentMember.id
                }
            });
        }
    }

    /*
    ============================
    ASSIGN NEW HOLDER
    ============================
    */

    try {

        await member.roles.add(
            failureRole
        );

        const responses = [

            `Analysis complete. <@${member.id}> has demonstrated a concerning relationship with integers and now carries the title of ${failureRole}. This status will remain in effect until another participant performs even worse.`,

            `Counting failure detected. <@${member.id}> has inherited ${failureRole}. The system appreciates their sacrifice in advancing mathematical caution.`,

            `A new statistical anomaly has been identified. <@${member.id}> is now ${failureRole}. Please avoid operating heavy arithmetic until further notice.`,

            `The count has been compromised. Responsibility has been assigned to <@${member.id}> in the form of ${failureRole}. Future embarrassment is transferable.`,

            `After careful review of the available evidence, which was unfortunately public, <@${member.id}> has been designated ${failureRole}. The role remains active until another counting incident occurs.`,

            `SYNARA has archived this failure for future study. <@${member.id}> now holds the title of ${failureRole}. A remarkable achievement, though perhaps not the desired one.`,

            `Mathematical instability confirmed. <@${member.id}> has been assigned ${failureRole}. The community may now direct all counting concerns accordingly.`,

            `The role of ${failureRole} has been transferred to <@${member.id}>. Excellence was not observed, but participation certainly was.`,

            `A counting violation has occurred. <@${member.id}> is now ${failureRole}. This distinction will persist until another citizen demonstrates superior incompetence.`,

            `System update: <@${member.id}> has acquired ${failureRole}. The previous holder has been released from their numerical obligations.`
        ];

        const response =
            responses[
                Math.floor(
                    Math.random() *
                    responses.length
                )
            ];

        await message.channel.send(
            response
        );

    } catch (error) {

        logError({

            type:
                'COUNTING_GAME',

            source:
                'counting-role-add',

            message:
                error.message,

            details: {

                guildId:
                    message.guild.id,

                userId:
                    member.id
            }
        });

        return;
    }

    logFeature({

        category:
            'COUNTING_GAME',

        message:
            'Counting failure detected',

        details: {

            guildId:
                message.guild.id,

            guildName:
                message.guild.name,

            offenderId:
                offender.id,

            offenderName:
                offender.username,

            roleId:
                failureRole.id,

            roleName:
                failureRole.name
        }
    });
}

module.exports = {
    handleCountingGame
};
