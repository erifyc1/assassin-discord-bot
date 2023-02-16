# assassin-discord-bot

Discord Bot Integration for administering the game [Assassin](https://en.wikipedia.org/wiki/Assassin_(game)).

This bot allows users to access features from the [main website](http://www.cyclic.games), but from Discord.

## Features Include
* Ability to create all text/voice channels, roles, and permissions for the game with a single command (and delete them)
* Data storage allows bot to work on multiple servers simultaneously and after restarts
* Live leaderboard
* Ability to make new rule proposals and vote on them (with admin approval)
* Account linking to the main website to view your target's details
* Refined explanations of the game pre-loaded into the channels
* All of the bot's setup is written in JSON files for easy modification without code knowledge
* Various configuration settings for different users

## Developer Info
For the bot to work, create a .env in the root directory with the following variables
* DISCORD_AUTH="discord authentication token"
* CLIENT_ID="discord bot client id"
