import { Client, Collection } from 'discord.js';
import fetch from 'node-fetch';
import { config } from 'dotenv'
import fs from 'fs'
import { registerCommands } from './deploy-commands.js'
import { updateJson } from './utils.mjs'
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

let guildsData, channelData, permissionData, roleData;

const filePaths = 
{
    guilds: './data/guilds.json',
    channels: './setup/channel-structure.json',
    permissions: './setup/permission-presets.json',
    roles: './setup/role-presets.json'
}


client.on("guildMemberAdd", async () => {
    return 'hi';
});




client.on("ready", async () => {
    // set up bot
    await printDebug('--------------------------');
    await printDebug(`Booted bot instance: ${client.user.tag}`);
    client.user.setActivity('cyclic.games', { type: 'COMPETING' });

    // read files
    await printDebug('Reading json files');
    fs.readFile(filePaths.guilds, 'utf-8', (err, data) => {
        if (err) throw err;
        guildsData = JSON.parse(data.toString());
        printDebug('\tRead from ' + filePaths.guilds);
    });
    fs.readFile(filePaths.channels, 'utf-8', (err, data) => {
        if (err) throw err;
        channelData = JSON.parse(data.toString());
        printDebug('\tRead from ' + filePaths.channels);
    });
    fs.readFile(filePaths.permissions, 'utf-8', (err, data) => {
        if (err) throw err;
        permissionData = JSON.parse(data.toString());
        printDebug('\tRead from ' + filePaths.permissions);
    });
    fs.readFile(filePaths.roles, 'utf-8', (err, data) => {
        if (err) throw err;
        roleData = JSON.parse(data.toString());
        printDebug('\tRead from ' + filePaths.roles);
    });
    
    // register slash commands to every guild that bot is in
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
    // register slash commands to guild that adds bot
    await printDebug('\tRegistering guild: ' + guild.name + ' (' + guild.id + ')');
    registerCommands(guild.id);
});

client.on("messageCreate", async (msg) => {
    // for message detected commands (depreciated)
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
        const res2 = await fetch('http://www.cyclic.games/getLeaderboard/5'/*'http://www.cyclic.games/getTarget/4'*/, {
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
                case 'leaderboard':
                case 'voting':
                    await command.execute(interaction, client, guildsData);
                    break;
                case 'init':
                    await command.execute(interaction, { guildsData, channelData, permissionData, roleData });
                    break;
                case 'reset':
                    await command.execute(interaction, client, { guildsData, channelData, permissionData, roleData });
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
                    const joinCommand = await client.commands.get('join');
                    await joinCommand.execute(interaction);
                    break;
                case 'proposalapproved':
                case 'proposalblocked':
                    const idx = guildsData.guilds.findIndex((elem) => elem.guildID === interaction.guild.id);
                    if (idx === -1) {
                        interaction.reply('You must run /init before using the leaderboard.')
                        return;
                    }
                    const votingChannelId = guildsData.guilds[idx].channels['voting'];
                    const proposalCommand = await client.commands.get('proposal');
                    const propMessageId = await proposalCommand.proposalDecision(interaction, client, interaction.customId === 'proposalapproved', votingChannelId);
                    console.log(propMessageId);
                    if (propMessageId) {
                        guildsData.guilds[idx].activeProposals.push(propMessageId);
                        updateJson(guildsData, `added active proposal to guild list`);
                    }
                    break;
                case 'copiedToken':
                    const linkCommand = await client.commands.get('link');
                    await linkCommand.showLinkModal(interaction);
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
                case 'proposalmodal':
                    client.commands.get('proposal').submitForReview(interaction, client, guildsData);
                    interaction.reply({ content: 'Proposal submitted.\nPlease wait for an admin to review your proposal.', ephemeral: true });
                    break;
                case 'linkmodal':
                    await interaction.reply({ content: 'Validating Token, please wait.', ephemeral: true })
                    client.commands.get('link').validateSubmission(interaction, guildsData);
                    break;
                case 'proposalreason':
                    // does not use votingchannelid optional parameter
                    await client.commands.get('proposal').executeDecision(interaction, client, false);
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