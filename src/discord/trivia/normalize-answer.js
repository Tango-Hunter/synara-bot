/**
 * Title: normalize-answer.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Formats user trivia answer.
 */

function normalizeAnswer(
    answer
) {

    return answer

        .toLowerCase()

        .trim()

        .replace(
            /\.$/,
            ''
        )

        .replace(
            /\s+/g,
            ' '
        );
}

module.exports = {
    normalizeAnswer
};
