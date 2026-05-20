/**
 * Title: response-manager.js
 * Author: Tango Hunter
 * Date Created: 5/15/26
 * Date Modified: 5/15/26
 * Description: Ensures messages are trunciated and sent in chunks intelligently.
 */

const MAX_LENGTH = 1800;

function splitIntoChunks(message) {

    // Empty protection
    if (!message || !message.trim()) {

        return [
            'Signal clarity insufficient.'
        ];
    }

    // Short enough already
    if (message.length <= MAX_LENGTH) {

        return [message];
    }

    const chunks = [];

    // First split by paragraphs
    const paragraphs = message.split('\n\n');

    let currentChunk = '';

    for (const paragraph of paragraphs) {

        // If paragraph itself is too large
        if (paragraph.length > MAX_LENGTH) {

            // Split by sentences
            const sentences = paragraph.match(
                /[^.!?]+[.!?]+/g
            ) || [paragraph];

            for (const sentence of sentences) {

                if (
                    currentChunk.length +
                    sentence.length >
                    MAX_LENGTH
                ) {

                    chunks.push(
                        currentChunk.trim()
                    );

                    currentChunk = '';
                }

                // Extremely long sentence fallback
                if (sentence.length > MAX_LENGTH) {

                    let remaining = sentence;

                    while (
                        remaining.length >
                        MAX_LENGTH
                    ) {

                        chunks.push(
                            remaining.substring(
                                0,
                                MAX_LENGTH
                            )
                        );

                        remaining =
                            remaining.substring(
                                MAX_LENGTH
                            );
                    }

                    currentChunk += remaining;

                } else {

                    currentChunk +=
                        sentence + ' ';
                }
            }

        } else {

            if (
                currentChunk.length +
                paragraph.length >
                MAX_LENGTH
            ) {

                chunks.push(
                    currentChunk.trim()
                );

                currentChunk = '';
            }

            currentChunk +=
                paragraph + '\n\n';
        }
    }

    // Final chunk
    if (currentChunk.trim()) {

        chunks.push(
            currentChunk.trim()
        );
    }

    return chunks;
}

module.exports = {
    splitIntoChunks
};
