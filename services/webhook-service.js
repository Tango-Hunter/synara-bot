/**
 * Title: webhook-service.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Creates webhook for n8n workflow.
 */

const axios = require('axios');

async function sendToN8N(webhookUrl, payload) {

    const response = await axios.post(
        webhookUrl,
        payload,
        {
            timeout: 30000
        }
    );

    return response.data;
}

module.exports = {
    sendToN8N
};
