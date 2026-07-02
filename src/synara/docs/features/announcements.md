# Event Announcements

## Purpose

The Event Announcement feature automatically informs your community whenever a new Discord Event is created, helping members stay informed about upcoming activities without requiring administrators to manually post announcements.

## How It Works

Whenever a server administrator creates a Discord Event, SYNARA automatically posts an announcement in the configured Announcements channel.

The announcement includes important details about the event and notifies members with the configured Verified role so they know a new event has been scheduled.

If an event begins within **30 minutes** of being created, SYNARA skips the event creation announcement. Instead, she waits until the event begins and posts only the "Event Starting Now" announcement. This prevents duplicate notifications in a short period of time.

When the event reaches its scheduled start time, SYNARA automatically announces that the event is beginning.

## Notes

- Event announcements require an Announcements channel to be configured.
- The Verified role is required for community notifications.
- Events beginning within 30 minutes only receive the "Event Starting Now" announcement.
- Event announcements are generated automatically whenever a Discord Event is created.
