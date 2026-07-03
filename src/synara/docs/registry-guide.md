# SYNARA Registry Guide

This document describes the structure and standards used by `registry.json`.

The registry serves as the central index for all documentation used by SYNARA. It does **not** contain the documentation itself. Instead, it points to the appropriate Markdown files and provides metadata used by the Documentation Renderer, Setup Wizard, Documentation Hub, and future systems.

---

# Version Control

The current version of SYNARA is listed at the top of the registry. It is updated with each update we make to our repository.

# Registry Structure

Each document registered in `registry.json` should follow the structure below.

```json
{
    "id": "",
    "type": "",
    "name": "",
    "path": "",
    "commands": [],
    "settings": [],
    "category": "",
    "footer": ""
}
```

---

# Field Definitions

## id

A permanent identifier for the document.

This value should **never change**, even if the document is renamed or moved.

Examples:

```text
birthdays
sticky_messages
twitch_monitor
welcome
setup
```

---

## type

**What kind of document is this?**

Valid values:

| Value | Description |
|--------|-------------|
| `feature` | A user-facing or administrator feature. |
| `guide` | Documentation that explains how to configure or use SYNARA. |
| `release` | Release notes or changelog documentation. |
| `welcome` | SYNARA's initial welcome message shown when joining a server. |

---

## name

The display name shown to users.

Examples:

```text
Birthdays
Sticky Messages
Twitch Monitoring
Welcome to SYNARA
```

---

## path

The relative path to the Markdown document.

Examples:

```text
features/birthdays.md
features/sticky.md
features/twitch-monitor.md
setup/welcome.md
setup/setup.md
```

The renderer automatically prepends the documentation directory.

---

## commands

A list of commands associated with the document.

Use an empty array if the feature has no commands.

Examples:

```json
[
    "!birthday",
    "!nextBirthday"
]
```

```json
[
    "/event"
]
```

```json
[]
```

---

## settings

A list of Guild Settings required for the feature to function.

Use the internal Guild Setting identifiers rather than user-facing names.

Examples:

```json
[
    "channel_birthdays",
    "role_happy_birthday"
]
```

```json
[
    "channel_announcements",
    "role_verified"
]
```

If no settings are required:

```json
[]
```

---

## category

**What functional area does it belong to?**

Valid values:

| Value | Description |
|--------|-------------|
| `community` | Features that build community interaction. |
| `engagement` | Features that encourage conversation and participation. |
| `administration` | Administrative tools and moderation features. |
| `automation` | Background systems that operate automatically. |
| `information` | Documentation, guides, and informational content. |

Examples:

```text
Birthdays
→ community

Question of the Day
→ engagement

Sticky Messages
→ administration

Twitch Monitoring
→ automation

Setup Guide
→ information
```

---

## footer

**What standardized footer, if any, should the renderer append?**

The footer is selected by the renderer.

Documentation files should **not** contain footer text.

Valid values:

| Value | Description |
|--------|-------------|
| `none` | No footer is appended. |
| `toggleable` | This feature may be enabled or disabled by administrators. |
| `automatic` | This feature operates automatically once configured. |
| `interactive` | Members can use this feature at any time using the commands listed above. |
| `configuration` | This feature is a configuration or administrative workflow. |

Additional footer types may be added in future versions as needed.

---

# Example Registry Entry

```json
{
    "id": "birthdays",
    "type": "feature",
    "name": "Birthdays",
    "path": "features/birthdays.md",
    "commands": [
        "!birthday",
        "!nextBirthday"
    ],
    "settings": [
        "channel_birthdays",
        "role_happy_birthday"
    ],
    "category": "community",
    "footer": "toggleable"
}
```

---

# Design Philosophy

The registry is intended to remain lightweight.

Documentation belongs in Markdown files.

The registry exists only to describe those documents.

This separation allows:

- One source of truth for documentation.
- Human-readable Markdown files.
- Data-driven documentation rendering.
- A scalable Setup Wizard.
- A Documentation Hub.
- Automatic feature discovery.
- Future release broadcasts.

Whenever a new feature is added to SYNARA:

1. Create the Markdown documentation.
2. Add a registry entry.
3. Add the feature to the appropriate release notes.

The registry should remain an index, not a database.
