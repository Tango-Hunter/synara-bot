/**
 * Title: channel-awareness.js
 * Author: Tango Hunter
 * Date Created: 5/21/26
 * Date Modified: 5/21/26
 * Description:
 * Builds hierarchical semantic channel awareness context.
 */

const {
    channelProfiles
} = require('../config/channel-profiles');

function findServerProfile(
    guildId
) {

    return Object.values(

        channelProfiles.servers

    ).find(server =>
        server.serverId === guildId
    );
}

function findChannelProfile({

    serverProfile,
    channelId
}) {

    return (
        serverProfile.channels[channelId]
        ||
        null
    );
}

function buildChannelContext({

    guildId,
    channelId
}) {

    const serverProfile =
        findServerProfile(
            guildId
        );

    if (!serverProfile) {

        return '';
    }

    const channelProfile =
        findChannelProfile({

            serverProfile,
            channelId
        });

    const profile =
        channelProfile
        ||
        channelProfiles.default;

    return `

Current Environmental Context:

Server Atmosphere:
${serverProfile.atmosphere}

Channel Tone:
${profile.tone}

Behavioral Mode:
${profile.behavior}

Adapt naturally to the social environment while remaining fully SYNARA.
`;
}

module.exports = {
    buildChannelContext
};
