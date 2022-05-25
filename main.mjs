import { Client, Collection, Intents } from 'discord.js';
import fetch from 'node-fetch';
import { config } from 'dotenv'
import fs from 'fs'
import { registerCommands } from './deploy-commands.js'
import * as utils from './utils.mjs'
// import mongoose from 'mongoose'
// mongoose.connect()



config();
const apiKey = process.env.API_KEY;
const discordAuth = process.env.DISCORD_AUTH;

const client = new Client({intents: ["GUILDS", "GUILD_MESSAGES"]});
client.commands = new Collection();
const commandsPath = './commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'));

console.log('importing slash commands');
for (const file of commandFiles) {
    console.log('\timported ' + commandsPath + '/' + file);
    import(commandsPath + '/' + file).then((command) => {
        client.commands.set(command.data.name, command);
    });
}


let guildsData;
let channelData;


client.on("ready", async () => {
    // set up bot
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('cyclic.games', { type: 'COMPETING' });

    // read files
    fs.readFile('./data/guilds.json', 'utf-8', (err, data) => {
        if (err) throw err;
        guildsData = JSON.parse(data.toString());
        console.log('Read from ./data/guilds.json');
    });
    fs.readFile('channel-structure.json', 'utf-8', (err, data) => {
        if (err) throw err;
        channelData = JSON.parse(data.toString());
        console.log('Read from channel-structure.json');
    });

    // register slash commands
    console.log('registering slash commands');
	client.guilds.fetch().then((guilds) => {
		guilds.map((guild) => {
            console.log('\tregistered ' + guild.id);
			registerCommands(guild.id);
		});
	})
});

client.on("guildCreate", async (guild) => {
    // register slash commands
    console.log('\tregistered ' + guild.id);
    registerCommands(guild.id);
});

client.on("messageCreate", async (msg) => {
    const txt = msg.content;
    if (!txt.startsWith('~')) return;
    else if (txt === '~reset') {
        guildsData = { "guilds": [] };
    }
    
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;
	try {
        await interaction.deferReply();
		// console.log(command.data.name);
		switch (command.data.name) {
			case 'delete':
                await command.execute(interaction, guildsData, client);
                break;
            case 'init': 
				await command.execute(interaction, guildsData, channelData);
				break;
            case 'clear':
                await command.execute(interaction, client);
                break;
            default:
                await command.execute(interaction);
                break;
		}
	} catch (error) {
		console.error(error);
		await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});



client.login(discordAuth);