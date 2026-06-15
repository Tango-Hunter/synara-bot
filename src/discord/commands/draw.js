/**
 * Title: draw.js
 * Author: Tango Hunter
 * Date Created: 6/14/26
 * Description: SYNARA image generation.
 */

const {
    AttachmentBuilder
} = require('discord.js');

const {
    generateImage
} = require('../../core/services/openai-service');

const {
    discordConfig
} = require('../../core/config/discord-config');

const {
    logFeature
} = require('../../core/logging/logger');


const userCooldowns = new Map();

const serverCooldowns = new Map();


/*
====================================
STYLE TYPE: 3% CRAYON, 3% BLUEPRINT, 94% SKETCH
====================================
*/
function getStyle() {

    const roll =
        Math.random() * 100;

    if (
        roll < 3
    ) {

        return 'crayon';
    }

    if (
        roll < 6
    ) {

        return 'schematic';
    }

    return 'pencil';
}

/*
====================================
PROMPT GENERATION
====================================
*/
function buildPrompt({

    subject,

    style
}) {

    if (
        style === 'crayon'
    ) {

        return `

${subject}

Drawn by a 4 year old child.

Crayon drawing.

Stick figures.

Poor proportions.

Messy coloring.

Childlike artwork.

Construction paper style.
`;
    }

    if (
        style === 'schematic'
    ) {

        return `

${subject}

Technical blueprint.

Engineering schematic.

Measurement callouts.

Research notes.

Mechanical annotations.

Monochrome technical drawing.
`;
    }

    return `

${subject}

Hand drawn pencil sketch.

Black and white.

Graphite shading.

Cross hatching.

Notebook illustration.

Detailed linework.

No color.

No paint.

No photorealism.
`;
}

/*
====================================
IMAGE GENERATION
====================================
*/
async function runDrawCommand({

    message,

    args
}) {

    const subject =
        args.join(
            ' '
        );

    if (
        !subject
    ) {
        return {

            message:
                'Usage: !draw <description>'
        };
    }

    const now = Date.now();

    /*
    ====================================
    USER COOLDOWN
    ====================================
    */
    const userCooldown =
        userCooldowns.get(
            message.author.id
        );

    if (

        userCooldown

        &&

        now < userCooldown

    ) {
        const remaining =
            Math.ceil(

                (
                    userCooldown -
                    now
                )

                / 1000
            );

        return {

            message:
                `Image generation cooling down. Try again in ${remaining} seconds.`
        };
    }

    /*
    ====================================
    SERVER COOLDOWN
    ====================================
    */
    const serverCooldown =
        serverCooldowns.get(
            message.guild.id
        );

    if (

        serverCooldown

        &&

        now < serverCooldown

    ) {
        const remaining =
            Math.ceil(

                (
                    serverCooldown -
                    now
                )

                / 1000
            );

        return {

            message:
                `Image generation currently unavailable. Server cooldown expires in ${remaining} seconds.`
        };
    }

    /*
    ====================================
    RESETS COOLDOWNS
    ====================================
    */
    userCooldowns.set(

        message.author.id,

        now +

        (
            discordConfig.cooldowns.drawUser
            * 1000
        )
    );

    serverCooldowns.set(

        message.guild.id,

        now +

        (
            discordConfig.cooldowns.drawServer
            * 1000
        )
    );

    /*
    ====================================
    IMAGE GENERATION
    ====================================
    */
    const style =
        getStyle();

    const prompt =
        buildPrompt({

            subject,

            style
        });

    const imageBuffer =

        await generateImage({

            prompt
        });

    logFeature({

        category:
            'DRAW',

        message:
            'Image generated',

        details: {

            userId:
                message.author.id,

            guildId:
                message.guild.id,

            style
        }
    });

    const attachment =
        new AttachmentBuilder(

            imageBuffer,

            {

                name:
                    'synara-drawing.png'
            }
        );

    return {

        message:
            'Artistic interpretation complete.',

        attachment
    };
}

module.exports = {
    runDrawCommand
};
