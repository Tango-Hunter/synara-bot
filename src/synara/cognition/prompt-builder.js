/**
 * Title: prompt-builder.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/19/26
 * Description: Adds SYNARA profile to the prompt for OpenAI.
 */

const fs = require('fs');

const path = require('path');

function loadMarkdown(filePath) {

    return fs.readFileSync(

        filePath,

        'utf8'
    );
}

function buildSystemPrompt() {

    const synaraPath = path.join(

        __dirname,

        '..'
    );

    const coreIdentity =
        loadMarkdown(

            path.join(

                synaraPath,

                'personality',

                'core-identity.md'
            )
        );

    const behavioralFramework =
        loadMarkdown(

            path.join(

                synaraPath,

                'personality',

                'behavioral-framework.md'
            )
        );

    const responseGuidelines =
        loadMarkdown(

            path.join(

                synaraPath,

                'personality',

                'response-guidelines.md'
            )
        );

    const operatorRelationship =
        loadMarkdown(

            path.join(

                synaraPath,

                'personality',

                'operator-relationship.md'
            )
        );

    const originHistory =
        loadMarkdown(

            path.join(

                synaraPath,

                'lore',

                'origin-history.md'
            )
        );

    return `

${coreIdentity}

${behavioralFramework}

${operatorRelationship}

${originHistory}
`;
}

module.exports = {
    buildSystemPrompt
};
