/**
 * Title: twitchStats.js
 * Author: Tango Hunter
 * Date Created: 5/31/26
 * Date Modified: 5/31/26
 * Description: Prompt for the !twitchStats command.
 */

const {
    getStatistics
} = require('../../twitch/database/twitch-statistics-repository');

const {
    buildEmbed
} = require('../services/embed-builder');


function formatDuration(
    seconds
) {

    if (
        !seconds
    ) {

        return '0h 0m';
    }

    const hours =

        Math.floor(
            seconds / 3600
        );

    const minutes =

        Math.floor(
            (
                seconds % 3600
            ) / 60
        );

    return `${hours}h ${minutes}m`;
}

async function handleTwitchStatsCommand({

    userId
}) {

    const stats =

        await getStatistics(
            userId
        );

    if (
        !stats
    ) {

        return {

            message:
                'No stream statistics available yet.'
        };
    }

    const averageDuration =

        stats.total_streams > 0

            ?

            Math.floor(

                stats.total_stream_duration_seconds

                /

                stats.total_streams
            )

            :

            0;

    const embed =

        buildEmbed({

            type:
                'twitchStats',

            title:
                'Twitch Statistics',

            description:
`
Total Streams:
${stats.total_streams}

Total Stream Time:
${formatDuration(
    stats.total_stream_duration_seconds
)}

Average Stream Length:
${formatDuration(
    averageDuration
)}

Longest Stream:
${formatDuration(
    stats.longest_stream_duration_seconds
)}

Last Stream:
${formatDuration(
    stats.last_stream_duration_seconds
)}
`
        });

    return {
        embed
    };
}

module.exports = {
    name:
        'twitchstats',
    execute:
        handleTwitchStatsCommand
};
