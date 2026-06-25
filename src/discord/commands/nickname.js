/**
 * Title: nickname.js
 * Author: Tango Hunter
 * Date Created: 6/25/26
 * Description: Sets or removes a preferred nickname.
 */

const {
    getNickname,
    setNickname,
    deleteNickname
} = require('../../core/database/nicknames-repository');

const {
    validateNickname
} = require('../utils/nickname-validator');


async function runNicknameCommand({

    message

}) {

    const rawInput =

        message.content

            .replace(
                /^!nickname/i,
                ''
            )

            .trim();

    const existingNickname =

        await getNickname(
            message.author.id
        );

    /*
    ====================================
    DELETE NICKNAME
    ====================================
    */

    if (
        rawInput.length === 0
    ) {

        if (
            !existingNickname
        ) {

            return {

                message:

`${message.author},

You do not currently have a preferred nickname.

SYNARA will continue using your Discord display name.`
            };
        }

        await deleteNickname(
            message.author.id
        );

        return {

            message:

`${message.author},

Your preferred nickname has been removed.

SYNARA will now use your Discord display name.

You can create another nickname at any time using **!nickname <name>**.`
        };
    }

    /*
    ====================================
    VALIDATE
    ====================================
    */

    const validation =

        await validateNickname(
            rawInput
        );

    if (
        !validation.valid
    ) {

        return {

            message:

`${message.author},

${validation.reason}

Please choose another nickname.`
        };
    }

    /*
    ====================================
    SAVE
    ====================================
    */

    await setNickname({

        userId:
            message.author.id,

        nickname:
            validation.nickname
    });

    return {

        message:

`${message.author},

You have nicknamed yourself as **"${validation.nickname}"**.

You may change your nickname at any time by using this command again.

You can remove your nickname by using **!nickname** with no nickname.`
    };
}

module.exports = {
    runNicknameCommand
};
