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
    applicationConfig
} = require('../../core/config/application-config');

const {
    createSession,
    updateSession,
    getSession,
    clearSession
} = require('../../core/applications/application-session-store');

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
            TextInputStyle.Short
        ],

        [
            'age',
            'Age',
            TextInputStyle.Short
        ],

        [
            'timezone',
            'Timezone',
            TextInputStyle.Short
        ],

        [
            'languages',
            'Primary Language(s)',
            TextInputStyle.Short
        ],

        [
            'availability',
            'Availability',
            TextInputStyle.Paragraph
        ]
    ];

    for (const field of fields) {

        const input =
            new TextInputBuilder()

                .setCustomId(
                    field[0]
                )

                .setLabel(
                    field[1]
                )

                .setStyle(
                    field[2]
                )

                .setRequired(
                    true
                );

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
            'What previous moderation or leadership experience do you have within online communities or Discord servers?',
            TextInputStyle.Paragraph
        ],

        [
            'approach',
            'Describe your moderation style and approach to enforcing rules.',
            TextInputStyle.Paragraph
        ],

        [
            'boundaries',
            'How would you maintain professionalism and fairness when moderating friends or stressful situations?',
            TextInputStyle.Paragraph
        ],

        [
            'deescalation',
            'Describe how you would handle/de-escalate a heated conflict.',
            TextInputStyle.Paragraph
        ],

        [
            'scenario',
            'Describe what you would do if a member becomes argumentative after you have already issued them a warning.',
            TextInputStyle.Paragraph
        ]
    ];

    for (const field of fields) {

        const input =
            new TextInputBuilder()

                .setCustomId(
                    field[0]
                )

                .setLabel(
                    field[1]
                )

                .setStyle(
                    field[2]
                )

                .setRequired(
                    true
                );

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
            'How do you determine if a situation requires moderator intervention?',
            TextInputStyle.Paragraph
        ],

        [
            'conflict',
            'How would you handle a disagreement between yourself and another moderator?',
            TextInputStyle.Paragraph
        ],

        [
            'motivation',
            'Why do you want to moderate?',
            TextInputStyle.Paragraph
        ],

        [
            'observations',
            'What do you believe this server does well, and where could it improve?',
            TextInputStyle.Paragraph
        ],

        [
            'bonus',
            'Is there anything else you would like the staff to know?',
            TextInputStyle.Paragraph
        ]
    ];

    for (const field of fields) {

        const input =
            new TextInputBuilder()

                .setCustomId(
                    field[0]
                )

                .setLabel(
                    field[1]
                )

                .setStyle(
                    field[2]
                )

                .setRequired(
                    true
                );

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

    /*
    ============================
    START APPLICATION
    ============================
    */

    if (

        interaction.isButton() &&

        interaction.customId ===
        'start_mod_application'
    ) {

        createSession(
            interaction.user.id
        );

        return await interaction.showModal(
            buildModal1()
        );
    }

    /*
    ============================
    CONTINUE TO MODAL 2
    ============================
    */

    if (

        interaction.isButton() &&

        interaction.customId ===
        'continue_application_2'
    ) {

        return await interaction.showModal(
            buildModal2()
        );
    }

    /*
    ============================
    CONTINUE TO MODAL 3
    ============================
    */

    if (

        interaction.isButton() &&

        interaction.customId ===
        'continue_application_3'
    ) {

        return await interaction.showModal(
            buildModal3()
        );
    }

    /*
    ============================
    MODAL 1 SUBMIT
    ============================
    */

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

    /*
    ============================
    MODAL 2 SUBMIT
    ============================
    */

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

    /*
    ============================
    MODAL 3 SUBMIT
    ============================
    */

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

        const reviewChannel =
            await interaction.client.channels.fetch(

                applicationConfig.reviewChannelId
            );

        const identityEmbed =
            new EmbedBuilder()

                .setColor(
                    applicationConfig.embedColors.identity
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
                    applicationConfig.embedColors.philosophy
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
                    applicationConfig.embedColors.perspective
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
