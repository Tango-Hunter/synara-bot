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

function formatDuration(
    seconds
) {

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

async function handleTwitchStats(
    message
) {

    const stats =

        await getStatistics(

            message.author.id
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

            ? Math.floor(

                stats.total_stream_duration_seconds

                /

                stats.total_streams
            )

            : 0;

    const embed =

        new EmbedBuilder()

            .setColor(
                0x9146FF
            )

            .setTitle(
                '📊 Twitch Statistics'
            )

            .addFields(

                {

                    name:
                        'Total Streams',

                    value:
                        String(
                            stats.total_streams
                        ),

                    inline:
                        true
                },

                {

                    name:
                        'Total Stream Time',

                    value:

                        formatDuration(

                            stats.total_stream_duration_seconds
                        ),

                    inline:
                        true
                },

                {

                    name:
                        'Average Stream',

                    value:

                        formatDuration(

                            averageDuration
                        ),

                    inline:
                        true
                },

                {

                    name:
                        'Longest Stream',

                    value:

                        formatDuration(

                            stats.longest_stream_duration_seconds
                        ),

                    inline:
                        true
                },

                {

                    name:
                        'Last Stream',

                    value:

                        formatDuration(

                            stats.last_stream_duration_seconds
                        ),

                    inline:
                        true
                }
            )

            .setFooter({

                text:
                    'SYNARA • Twitch Statistics'
            })

            .setTimestamp();

    return {
        embed
    };
}

module.exports = {
    handleTwitchStats
};
