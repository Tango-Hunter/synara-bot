/**
 * Title: nickname-validator.js
 * Author: Tango Hunter
 * Date Created: 6/25/26
 * Description: Validates preferred nicknames.
 */

const OpenAI = require('openai');

const openai = new OpenAI();

const RESERVED_NAMES = [

    'synara',
    'admin',
    'administrator',
    'moderator',
    'mod',
    'owner',
    'staff',
    'support',
    'discord'
];

async function validateNickname(
    nickname
) {

    nickname = nickname

        .trim()

        .replace(
            /\s+/g,
            ' '
        );

    if (

        nickname.length < 2 ||

        nickname.length > 32

    ) {

        return {

            valid: false,

            reason:
                'Nickname must be between 2 and 32 characters.'
        };
    }

    if (

        !/^[\p{L}\p{N} .,'-]+$/u.test(
            nickname
        )

    ) {

        return {

            valid: false,

            reason:
                'Nickname contains invalid characters.'
        };
    }

    if (

        /^[!/]/.test(
            nickname
        )

    ) {

        return {

            valid: false,

            reason:
                'Nickname cannot begin with a command character.'
        };
    }

    if (

        /https?:\/\/|discord\.gg/i.test(
            nickname
        )

    ) {

        return {

            valid: false,

            reason:
                'Links are not permitted.'
        };
    }

    if (

        RESERVED_NAMES.includes(

            nickname.toLowerCase()

        )

    ) {

        return {

            valid: false,

            reason:
                'That nickname is reserved.'
        };
    }

    const moderation =

        await openai.moderations.create({

            model:

                'omni-moderation-latest',

            input:
                nickname
        });

    if (

        moderation.results[0].flagged

    ) {

        return {

            valid: false,

            reason:
                'Nickname contains prohibited language.'
        };
    }

    return {

        valid: true,

        nickname
    };
}

module.exports = {
    validateNickname
};
