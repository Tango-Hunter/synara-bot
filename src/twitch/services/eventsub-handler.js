/**
 * Title: eventsub-handler.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 5/30/26
 * Description: handles eventsub data being sent to Discord.
 */

const {
    getEnabledUsersByTwitchUserId
} = require('../../core/database/twitch-repository');


async function handleStreamOnline(
    payload
) {

    const twitchUserId =

        payload.event
            .broadcaster_user_id;

    const users =

        await getEnabledUsersByTwitchUserId(

            twitchUserId
        );

    if (
        users.length === 0
    ) {

        return;
    }

    console.log(

        'STREAM ONLINE:',

        twitchUserId
    );

    /*
    Notification logic
    added next phase.
    */
}

async function handleEventSub(
    payload
) {

    switch (

        payload.subscription.type

    ) {

        case 'stream.online':

            await handleStreamOnline(
                payload
            );

            break;
    }
}

module.exports = {
    handleEventSub
};
