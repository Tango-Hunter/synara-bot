# Content Creator Announcements

## Purpose

The Content Creator Announcement system allows servers to automatically notify members whenever approved community creators publish new content on supported platforms.

The feature is designed to help communities discover and support creators while giving administrators complete control over where announcements are posted and how they appear.

## How It Works

Administrators register a creator using the `/creator` command.

During setup, the administrator selects the supported platform, chooses the destination announcement channel, and provides the information required to monitor that creator's account.

Each creator may optionally use a custom announcement message. If no custom message is provided, SYNARA will generate a standard announcement automatically.

Once configured, SYNARA continuously monitors each registered creator. When new content is detected, an announcement is automatically posted to the configured channel.

Multiple creators may be registered across multiple supported platforms, each using their own announcement channel and custom message if desired.

## Commands

`/creator add`

Registers a new content creator.

`/creator remove`

Removes a creator from automatic monitoring.

`/creator list`

Displays all registered creators for the current server.

## Supported Platforms

Current supported platforms include:

- YouTube
- TikTok

Additional content platforms may be added in future updates.

## Notes

- Multiple creators may be configured per server.
- Different creators may post to different announcement channels.
- Announcement messages may be customized for each creator.
- SYNARA automatically checks for newly published content after a creator has been registered.
- Platform support will continue to expand over time.
