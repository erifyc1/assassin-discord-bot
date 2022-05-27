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

console.log('Importing slash commands:');
for (const file of commandFiles) {
    console.log('\t' + commandsPath + '/' + file);
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
    console.log('Registering slash commands to all known guilds.');
	client.guilds.fetch().then((guilds) => {
		guilds.map((guild) => {
            console.log('\tRegistered guildID: ' + guild.id);
			registerCommands(guild.id);
		});
	})
});

client.on("guildCreate", async (guild) => {
    // register slash commands
    console.log('\tRegistered guildID: ' + guild.id);
    registerCommands(guild.id);
});

client.on("messageCreate", async (msg) => {
    const txt = msg.content;
    if (!txt.startsWith('~')) return;
    else if (txt === '~reset') {
        guildsData = { "guilds": [] };
    }
    else if (txt === '~debug') {
        const params = new URLSearchParams();
        params.append('username', '1');
        params.append('password', '1');
        const res = await fetch('http://www.cyclic.games/api-token-auth/', {
            method: 'post',
            body: params
        });
        const data = await res.json();
        msg.reply(data.token);
        const res2 = await fetch('http://www.cyclic.games/getTarget/4', {
            method: 'get',
            headers: { 'Authorization': ('Token ' + data.token) }
        });
        const data2 = await res2.json();
        console.log(data2);
    }
    
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;
	try {
		// console.log(command.data.name);
		switch (command.data.name) {
			case 'delete':
                await command.execute(interaction, guildsData, client);
                break;
            case 'init':
				await command.execute(interaction, guildsData, channelData);
                break;
            default:
                await command.execute(interaction);
                break;
		}
	} catch (error) {
        if (interaction.replied) {
            await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
		console.error(error);
	}
});



client.login(discordAuth);