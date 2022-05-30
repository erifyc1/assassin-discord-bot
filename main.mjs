import { Client, Collection, IntegrationApplication, Intents } from 'discord.js';
import fetch from 'node-fetch';
import { config } from 'dotenv'
import fs from 'fs'
import { registerCommands } from './deploy-commands.js'
// import mongoose from 'mongoose'
// mongoose.connect()



config();
const apiKey = process.env.API_KEY;
const discordAuth = process.env.DISCORD_AUTH;

const client = new Client({intents: ["GUILDS", "GUILD_MESSAGES"]});
client.commands = new Collection();
const commandsPath = './commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'));

await printDebug('Importing slash commands:');
for (const file of commandFiles) {
    await printDebug('\t' + commandsPath + '/' + file);
    import(commandsPath + '/' + file).then((command) => {
        client.commands.set(command.data.name, command);
    });
}

let guildsData;
let channelData;


client.on("ready", async () => {
    // set up bot
    await printDebug('\n\n--------------------------');
    await printDebug(`Booted bot instance ${client.user.tag}`);
    client.user.setActivity('cyclic.games', { type: 'COMPETING' });

    // read files
    await printDebug('Reading json files');
    fs.readFile('./data/guilds.json', 'utf-8', (err, data) => {
        if (err) throw err;
        guildsData = JSON.parse(data.toString());
        printDebug('\tRead from ./data/guilds.json');
    });
    fs.readFile('channel-structure.json', 'utf-8', (err, data) => {
        if (err) throw err;
        channelData = JSON.parse(data.toString());
        printDebug('\tRead from channel-structure.json');
    });
    
    // register slash commands
	client.guilds.fetch().then((guilds) => {
        printDebug('Registering slash commands to all known guilds.');
        let idx = 0;
		guilds.map((guild) => {
            printDebug('\tRegistering guild #' + idx++ + ': ' + guild.name + ' (' + guild.id + ')');
			registerCommands(guild.id);
		});
	})
});

client.on("guildCreate", async (guild) => {
    // register slash commands
    await printDebug('\tRegistering guild: ' + guild.name + ' (' + guild.id + ')');
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
        await printDebug(data2);
    }
    
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
    
        if (!command) return;
        try {
            await printDebug('-> command triggered: ' + command.data.name);
            switch (command.data.name) {
                case 'delete':
                    await command.execute(interaction, guildsData, client);
                    break;
                case 'init':
                    await command.execute(interaction, guildsData, channelData);
                    break;
                case 'reset':
                    await command.execute(interaction, guildsData, client, channelData);
                    break;
                default:
                    await command.execute(interaction);
                    break;
            }
        } catch (error) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
            else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
            console.error(error);
        }
    }
    else if (interaction.isButton()) {
        try {
            switch (interaction.customId) {
                case 'loginbutton':
                    const loginCommand = await client.commands.get('login');
                    await loginCommand.showLoginModal(interaction);
                    break;
                case 'joinbutton':
                    const command = await client.commands.get('join');
                    await command.execute(interaction);
                    break;
                default:
                    break;
            }
        }
        catch (error) { console.error(error); }
    }
    else if (interaction.isModalSubmit()) {
        try {
            switch (interaction.customId) {
                case 'loginmodal':
                    const username = interaction.fields.getTextInputValue('username');
                    const password = interaction.fields.getTextInputValue('password');
                    // const loginCommand = client.commands.get('login');
                    // loginCommand.showLoginModal(interaction);
                    interaction.reply('user: ' + username + '\npass: ' + password);
                    break;
                default:
                    return;
            }
        }
        catch (error) { console.error(error); }
    }

});

async function printDebug(string) {
    const debug_gid = '976344115547615252';
    const debug_chid = '980356193245593662';
    const guild = client.guilds.cache.get(debug_gid);
    if (guild) {
        const channel = guild.channels.cache.get(debug_chid);
        if (string && channel) channel.send('`' + string + '`');
    }
    console.log(string);
}

client.login(discordAuth);