/**
 * Title: default-guild-settings.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Default guild settings.
 */

const DEFAULT_GUILD_SETTINGS = [

    {
        name: 'role_verified',
        displayName: 'Verified',
        description: 'Verified member role'
    },

    {
        name: 'channel_welcome',
        displayName: 'Welcome',
        description: 'Welcome channel'
    },

    {
        name: 'channel_roles',
        displayName: 'Roles',
        description: 'Roles channel'
    },

    {
        name: 'channel_intro',
        displayName: 'Intro',
        description: 'Introduction channel'
    },

    {
        name: 'channel_modapps_apply',
        displayName: 'Mod Applications',
        description: 'Moderator application channel'
    },

    {
        name: 'message_modapps_apply',
        displayName: 'Mod Application Message',
        description: 'Moderator application message'
    },

    {
        name: 'channel_modapps_submissions',
        displayName: 'Mod App Submissions',
        description: 'Moderator application submissions channel'
    },

    {
        name: 'roles_admin',
        displayName: 'Admin',
        description: 'Administrative roles'
    },

    {
        name: 'roles_moderator',
        displayName: 'Moderator',
        description: 'Moderator roles'
    },

    {
        name: 'channel_stream_leadership',
        displayName: 'Leadership Streams',
        description: 'Leadership stream notifications'
    },

    {
        name: 'channel_stream_selfpromo',
        displayName: 'Self Promo Streams',
        description: 'Self promotion channel'
    },

    {
        name: 'channel_qotd',
        displayName: 'QOTD',
        description: 'Question of the Day channel'
    },

    {
        name: 'channel_motivational',
        displayName: 'Motivational',
        description: 'Motivational message channel'
    },

    {
        name: 'channel_logs',
        displayName: 'Logs',
        description: 'Discord logging channel'
    }
];


function getSettingNames() {

    return DEFAULT_GUILD_SETTINGS.map(

        setting => setting.name
    );
}

function getChannelSettings() {

    return DEFAULT_GUILD_SETTINGS.filter(

        setting =>

            setting.name.startsWith(
                'channel_'
            )
    );
}

function getRoleSettings() {

    return DEFAULT_GUILD_SETTINGS.filter(

        setting =>

            setting.name.startsWith(
                'role_'
            )

            ||

            setting.name.startsWith(
                'roles_'
            )
    );
}

module.exports = {
    DEFAULT_GUILD_SETTINGS,
    getSettingNames,
    getChannelSettings,
    getRoleSettings
};
