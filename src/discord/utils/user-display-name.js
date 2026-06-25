/**
 * Title: user-display-name.js
 * Author: Tango Hunter
 * Date Created: 6/22/26
 * Description: Determines what SYNARA should call a user.
 */

const {
    getNickname
} = require('../../core/database/nicknames-repository');


async function getUserDisplayName(
    member
) {

    if (
        !member
    ) {

        return 'Unknown User';
    }

    const nickname =

        await getNickname(
            member.id
        );

    if (
        nickname
    ) {

        return nickname;
    }

    if (
        member.displayName
    ) {

        return member.displayName;
    }

    return member.user.username;
}

module.exports = {
    getUserDisplayName
};
