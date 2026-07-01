# Scheduled Events

## Purpose

The Scheduled Events system allows administrators to create recurring announcements and reminders that are automatically posted by SYNARA.

## How It Works

Using the `/event` command, administrators can create scheduled announcements by selecting:

- Title
- Description
- Date
- Time (UTC+0)
- Frequency
- Destination channel

Scheduled events may be configured as one-time events or recurring events.

Administrators may also manage their existing scheduled events by pausing, resuming, skipping, editing, or deleting them.

Only the administrator who created an event may manage that event.

## Commands

`/event Create Scheduled Event`

Creates a new scheduled announcement.

`/event Manage Scheduled Event`

Manage an existing scheduled event.

Management options include:

- Pause
- Resume
- Skip
- Edit
- Delete

## Notes

- Scheduled events currently use **UTC (UTC+0)** when selecting dates and times.
- Recurring events continue automatically until paused or deleted.
- One-time events are automatically removed after they have been posted.
