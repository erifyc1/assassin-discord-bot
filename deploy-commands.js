const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { config } = require('dotenv');

config();
const token = process.env.DISCORD_AUTH, clientID = process.env.CLIENT_ID;

module.exports.registerCommands = async (guildID) => {
	const commandsPath = './commands';
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'));
	
	const commands = await Promise.all(commandFiles.map((file) => import(commandsPath + '/' + file).then((command) => command.data.toJSON())));
	
	const rest = new REST({ version: '9' }).setToken(token);
	
	rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: commands })
		.then(() => console.log('Successfully registered application commands.'))
		.catch(console.error);
};
