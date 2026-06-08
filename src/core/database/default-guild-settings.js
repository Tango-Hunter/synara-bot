/**
 * Title: default-guild-settings.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Default guild settings.
 */

const DEFAULT_GUILD_SETTINGS = [

    {
        name: 'role_verified',
        description: 'Verified member role'
    },

    {
        name: 'channel_welcome',
        description: 'Welcome channel'
    },

    {
        name: 'channel_roles',
        description: 'Roles channel'
    },

    {
        name: 'channel_intro',
        description: 'Introduction channel'
    },

    {
        name: 'channel_modapps_apply',
        description: 'Moderator application channel'
    },

    {
        name: 'message_modapps_apply',
        description: 'Moderator application message'
    },

    {
        name: 'channel_modapps_submissions',
        description: 'Moderator application submissions channel'
    },

    {
        name: 'roles_admin',
        description: 'Administrative role'
    },

    {
        name: 'roles_moderator',
        description: 'Moderator role'
    },

    {
        name: 'channel_stream_leadership',
        description: 'Leadership stream notifications'
    },

    {
        name: 'channel_stream_selfpromo',
        description: 'Self promotion channel'
    },

    {
        name: 'channel_qotd',
        description: 'Question of the Day channel'
    },

    {
        name: 'channel_motivational',
        description: 'Motivational message channel'
    },

    {
        name: 'channel_logs',
        description: 'Discord logging channel'
    }
];

function getSettingNames() {

    return DEFAULT_GUILD_SETTINGS.map(

        setting => setting.name
    );
}

module.exports = {
    DEFAULT_GUILD_SETTINGS,
    getSettingNames
};
