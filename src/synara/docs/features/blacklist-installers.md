# Installer Blacklist

## Purpose

The Installer Blacklist allows The Primary Operator to prevent specific Discord users or servers from installing or using SYNARA.

This is a private administrative system and is not available to normal server administrators or members.

## How It Works

The Primary Operator can add Discord users or servers to SYNARA's installer blacklist using the `/installerblacklist` command.

When a user or server is blacklisted:

- A blacklisted server cannot use SYNARA.
- If SYNARA is already installed in a blacklisted server, she will leave the server.
- If a blacklisted user installs SYNARA into a server, she will leave that server.
- When SYNARA leaves a server because of a blacklist restriction, the server's associated SYNARA data is removed from the database.

SYNARA also records installation information when she joins a new server, including the server name, server ID, installer information, and installation date and time.

## Commands

`/installerblacklist Add`

Adds a Discord user or server to the installer blacklist.

`/installerblacklist Remove`

Removes an existing user or server from the installer blacklist.

## Notes

- This feature is restricted to The Primary Operator.
- Blacklist entries can be created or removed but are not edited.
- A blacklist entry may target either a Discord user or a Discord server.
- Blacklisting a user affects their ability to install SYNARA into servers.
- Blacklisting a server affects SYNARA's ability to operate in that server.
- Removing a blacklist entry allows the affected user or server to use SYNARA again.
