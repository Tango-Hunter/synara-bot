/**
 * Title: application-handler.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/24/26
 * Description: Handles moderator application interactions.
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    createSession,
    updateSession,
    getSession,
    clearSession
} = require('../../core/applications/application-session-store');

const {
    discordLog
} = require('../../core/logging/discord-logger');

const {
    logFeature
} = require('../../core/logging/logger');


/*
====================================
MODAL BUILDERS
====================================
*/

function buildModal1() {

    const modal =
        new ModalBuilder()

            .setCustomId(
                'mod_application_1'
            )

            .setTitle(
                'Moderator Application • 1/3'
            );

    const fields = [

        [
            'name',
            'Discord Username',
            'Enter your Discord username.',
            TextInputStyle.Short
        ],

        [
            'age',
            'Age',
            'Enter your age.',
            TextInputStyle.Short
        ],

        [
            'timezone',
            'Timezone',
            'Enter your timezone.',
            TextInputStyle.Short
        ],

        [
            'languages',
            'Primary Language(s)',
            'List languages you speak comfortably.',
            TextInputStyle.Short
        ],

        [
            'availability',
            'Availability',
            'Describe when you are typically active.',
            TextInputStyle.Paragraph
        ]
    ];

    for (const field of fields) {

        const input =
            new TextInputBuilder()

                .setCustomId(field[0])

                .setLabel(field[1])

                .setPlaceholder(field[2])

                .setStyle(field[3])

                .setRequired(true)

                .setMaxLength(800);

        modal.addComponents(

            new ActionRowBuilder()

                .addComponents(
                    input
                )
        );
    }

    return modal;
}

function buildModal2() {

    const modal =
        new ModalBuilder()

            .setCustomId(
                'mod_application_2'
            )

            .setTitle(
                'Moderator Application • 2/3'
            );

    const fields = [

        [
            'experience',
            'Moderation Experience',
            'Describe previous moderation or leadership experience.',
            TextInputStyle.Paragraph
        ],

        [
            'approach',
            'Moderation Style',
            'Describe your moderation style and approach.',
            TextInputStyle.Paragraph
        ],

        [
            'boundaries',
            'Professionalism',
            'How would you remain fair and professional?',
            TextInputStyle.Paragraph
        ],

        [
            'deescalation',
            'Conflict De-escalation',
            'Describe how you would de-escalate conflict.',
            TextInputStyle.Paragraph
        ],

        [
            'scenario',
            'Argumentative Members',
            'How would you handle argumentative members?',
            TextInputStyle.Paragraph
        ]
    ];

    for (const field of fields) {

        const input =
            new TextInputBuilder()

                .setCustomId(field[0])

                .setLabel(field[1])

                .setPlaceholder(field[2])

                .setStyle(field[3])

                .setRequired(true)

                .setMaxLength(800);

        modal.addComponents(

            new ActionRowBuilder()

                .addComponents(
                    input
                )
        );
    }

    return modal;
}

function buildModal3() {

    const modal =
        new ModalBuilder()

            .setCustomId(
                'mod_application_3'
            )

            .setTitle(
                'Moderator Application • 3/3'
            );

    const fields = [

        [
            'judgment',
            'Moderator Judgment',
            'When should moderators intervene?',
            TextInputStyle.Paragraph
        ],

        [
            'conflict',
            'Moderator Disagreements',
            'How would you handle disagreements with staff?',
            TextInputStyle.Paragraph
        ],

        [
            'motivation',
            'Motivation',
            'Why do you want to moderate here?',
            TextInputStyle.Paragraph
        ],

        [
            'observations',
            'Server Observations',
            'What does this server do well? What could improve?',
            TextInputStyle.Paragraph
        ],

        [
            'bonus',
            'Additional Notes',
            'Anything else the staff should know?',
            TextInputStyle.Paragraph
        ]
    ];

    for (const field of fields) {

        const input =
            new TextInputBuilder()

                .setCustomId(field[0])

                .setLabel(field[1])

                .setPlaceholder(field[2])

                .setStyle(field[3])

                .setRequired(true)

                .setMaxLength(800);

        modal.addComponents(

            new ActionRowBuilder()

                .addComponents(
                    input
                )
        );
    }

    return modal;
}

/*
====================================
MAIN HANDLER
====================================
*/

async function handleApplicationInteraction(
    interaction
) {

    if (

        interaction.isButton() &&

        interaction.customId ===
        'start_mod_application'
    ) {

        createSession(
            interaction.user.id
        );

        await discordLog({

            guildId:
                interaction.guild.id,

            category:
                'MOD_APP',

            details:
                `Moderator application started by <@${interaction.user.id}>`,

            status:
                'STARTED'
        });

        logFeature({

            category:
                'MOD_APP',

            message:
                'Application started',

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

        return await interaction.showModal(
            buildModal1()
        );
    }

    if (

        interaction.isButton() &&

        interaction.customId ===
        'continue_application_2'
    ) {

        return await interaction.showModal(
            buildModal2()
        );
    }

    if (

        interaction.isButton() &&

        interaction.customId ===
        'continue_application_3'
    ) {

        return await interaction.showModal(
            buildModal3()
        );
    }

    if (

        interaction.isModalSubmit() &&

        interaction.customId ===
        'mod_application_1'
    ) {

        updateSession(

            interaction.user.id,

            {

                name:
                    interaction.fields.getTextInputValue(
                        'name'
                    ),

                age:
                    interaction.fields.getTextInputValue(
                        'age'
                    ),

                timezone:
                    interaction.fields.getTextInputValue(
                        'timezone'
                    ),

                languages:
                    interaction.fields.getTextInputValue(
                        'languages'
                    ),

                availability:
                    interaction.fields.getTextInputValue(
                        'availability'
                    )
            }
        );

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'continue_application_2'
                        )

                        .setLabel(
                            'Continue to Section 2'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        )
                );

        return await interaction.reply({

            content:
                'Application section 1/3 submitted successfully.',

            components: [row],

            flags:
                MessageFlags.Ephemeral
        });
    }

    if (

        interaction.isModalSubmit() &&

        interaction.customId ===
        'mod_application_2'
    ) {

        updateSession(

            interaction.user.id,

            {

                experience:
                    interaction.fields.getTextInputValue(
                        'experience'
                    ),

                approach:
                    interaction.fields.getTextInputValue(
                        'approach'
                    ),

                boundaries:
                    interaction.fields.getTextInputValue(
                        'boundaries'
                    ),

                deescalation:
                    interaction.fields.getTextInputValue(
                        'deescalation'
                    ),

                scenario:
                    interaction.fields.getTextInputValue(
                        'scenario'
                    )
            }
        );

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'continue_application_3'
                        )

                        .setLabel(
                            'Continue to Section 3'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        )
                );

        return await interaction.reply({

            content:
                'Application section 2/3 submitted successfully.',

            components: [row],

            flags:
                MessageFlags.Ephemeral
        });
    }

    if (

        interaction.isModalSubmit() &&

        interaction.customId ===
        'mod_application_3'
    ) {

        updateSession(

            interaction.user.id,

            {

                judgment:
                    interaction.fields.getTextInputValue(
                        'judgment'
                    ),

                conflict:
                    interaction.fields.getTextInputValue(
                        'conflict'
                    ),

                motivation:
                    interaction.fields.getTextInputValue(
                        'motivation'
                    ),

                observations:
                    interaction.fields.getTextInputValue(
                        'observations'
                    ),

                bonus:
                    interaction.fields.getTextInputValue(
                        'bonus'
                    )
            }
        );

        const data =
            getSession(
                interaction.user.id
            );

        const submissionsChannelId =
            await getGuildSetting({

                guildId:
                    interaction.guild.id,

                settingName:
                    'channel_modapps_submissions'
            });

        if (
            !submissionsChannelId
        ) {

            logFeature({

                category:
                    'MOD_APP',

                message:
                    'Submission failed - missing configuration',

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
                    'Moderator application submissions channel has not been configured.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        const reviewChannel =
            await interaction.client.channels.fetch(
                submissionsChannelId
            );

        const identityEmbed =
            new EmbedBuilder()

                .setColor(
                    0x4A90E2
                )

                .setTitle(
                    'Moderator Application • Identity'
                )

                .setDescription(`

Applicant:
${interaction.user.tag}

User ID:
${interaction.user.id}
`)

                .addFields(

                    {

                        name:
                            'Name',

                        value:
                            data.name
                    },

                    {

                        name:
                            'Age',

                        value:
                            data.age
                    },

                    {

                        name:
                            'Timezone',

                        value:
                            data.timezone
                    },

                    {

                        name:
                            'Languages',

                        value:
                            data.languages
                    },

                    {

                        name:
                            'Availability',

                        value:
                            data.availability
                    }
                )

                .setTimestamp();

        const philosophyEmbed =
            new EmbedBuilder()

                .setColor(
                    0x9B59B6
                )

                .setTitle(
                    'Moderator Application • Philosophy'
                )

                .addFields(

                    {

                        name:
                            'Experience',

                        value:
                            data.experience
                    },

                    {

                        name:
                            'Approach',

                        value:
                            data.approach
                    },

                    {

                        name:
                            'Boundaries',

                        value:
                            data.boundaries
                    },

                    {

                        name:
                            'De-escalation',

                        value:
                            data.deescalation
                    },

                    {

                        name:
                            'Scenario Response',

                        value:
                            data.scenario
                    }
                )

                .setTimestamp();

        const perspectiveEmbed =
            new EmbedBuilder()

                .setColor(
                    0x95A5A6
                )

                .setTitle(
                    'Moderator Application • Perspective'
                )

                .addFields(

                    {

                        name:
                            'Community Judgment',

                        value:
                            data.judgment
                    },

                    {

                        name:
                            'Conflict Handling',

                        value:
                            data.conflict
                    },

                    {

                        name:
                            'Motivation',

                        value:
                            data.motivation
                    },

                    {

                        name:
                            'Server Observations',

                        value:
                            data.observations
                    },

                    {

                        name:
                            'Additional Notes',

                        value:
                            data.bonus
                    }
                )

                .setTimestamp();

        await reviewChannel.send({

            embeds: [
                identityEmbed
            ]
        });

        await reviewChannel.send({

            embeds: [
                philosophyEmbed
            ]
        });

        await reviewChannel.send({

            embeds: [
                perspectiveEmbed
            ]
        });

        clearSession(
            interaction.user.id
        );

        await discordLog({

            guildId:
                interaction.guild.id,

            category:
                'MOD_APP',

            details:
                `Moderator application submitted by <@${interaction.user.id}>`,

            status:
                'SUCCESS'
        });

        logFeature({

            category:
                'MOD_APP',

            message:
                'Application submitted',

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
                'Your moderator application has been submitted successfully.',

            flags:
                MessageFlags.Ephemeral
        });
    }
}

module.exports = {
    handleApplicationInteraction
};
