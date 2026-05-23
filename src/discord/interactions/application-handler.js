/**
 * Title: application-handler.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 * Description: Handles moderator application interactions.
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder
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

async function handleApplicationInteraction(
    interaction
) {

    /*
    ============================
    START APPLICATION BUTTON
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

        return await interaction.showModal(
            modal
        );
    }

    /*
    ============================
    MODAL 1
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

        await interaction.reply({

            content:
                'Application section 1/3 submitted.',

            ephemeral:
                true
        });

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
                'Previous moderation experience',
                TextInputStyle.Paragraph
            ],

            [
                'approach',
                'Moderation style & approach',
                TextInputStyle.Paragraph
            ],

            [
                'boundaries',
                'Professionalism & fairness',
                TextInputStyle.Paragraph
            ],

            [
                'deescalation',
                'Conflict de-escalation strategy',
                TextInputStyle.Paragraph
            ],

            [
                'scenario',
                'Handling argumentative members',
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

        return await interaction.followUp({

            content:
                'Please continue with section 2/3.',

            ephemeral:
                true
        }).then(async () => {

            await interaction.showModal(
                modal
            );
        });
    }

    /*
    ============================
    MODAL 2
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

        await interaction.reply({

            content:
                'Application section 2/3 submitted.',

            ephemeral:
                true
        });

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
                'Moderator intervention judgment',
                TextInputStyle.Paragraph
            ],

            [
                'conflict',
                'Moderator disagreement handling',
                TextInputStyle.Paragraph
            ],

            [
                'motivation',
                'Why do you want to moderate?',
                TextInputStyle.Paragraph
            ],

            [
                'observations',
                'Server strengths & improvements',
                TextInputStyle.Paragraph
            ],

            [
                'bonus',
                'Anything else?',
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

        return await interaction.followUp({

            content:
                'Please continue with section 3/3.',

            ephemeral:
                true
        }).then(async () => {

            await interaction.showModal(
                modal
            );
        });
    }

    /*
    ============================
    MODAL 3
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

        /*
        ============================
        IDENTITY EMBED
        ============================
        */

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

        /*
        ============================
        PHILOSOPHY EMBED
        ============================
        */

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

        /*
        ============================
        PERSPECTIVE EMBED
        ============================
        */

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

            ephemeral:
                true
        });
    }
}

module.exports = {
    handleApplicationInteraction
};
