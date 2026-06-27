/**
 * Title: message-context.js
 * Author: Tango Hunter
 * Date Created: 6/27/26
 * Description: Builds conversational context for Discord messages.
 */

const {
    getUserDisplayName
} = require('./user-display-name');


async function getMessageContext(
    message
) {

    const context = {

        currentAuthor:

            await getUserDisplayName(
                message.member
            ),

        currentMessage:
            message.content,

        repliedAuthor:
            null,

        repliedMessage:
            null
    };

    if (
        !message.reference
    ) {

        return context;
    }

    try {

        const referencedMessage =

            await message.fetchReference();

        context.repliedAuthor =

            await getUserDisplayName(
                referencedMessage.member
            );

        context.repliedMessage =

            referencedMessage.content;

    }

    catch {

        /*
        The referenced message may have
        been deleted or is otherwise
        unavailable.
        */

    }

    return context;
}

module.exports = {
    getMessageContext
};
