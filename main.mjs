import Discord, { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
import { config } from 'dotenv'
import fs from 'fs'
// import mongoose from 'mongoose'
// mongoose.connect()



config();
const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]});
const apiKey = process.env.API_KEY;
const discordAuth = process.env.DISCORD_AUTH;


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
});

client.on("messageCreate", async (msg) => {
    const txt = msg.content;
    if (!txt.startsWith('~')) return;

    else if (txt == '~generate') {
        if (generated(msg.guild.id)) {
            msg.reply('channel structure has already been generated');
        }
        else {
            const currentGuild = await generateChannels(msg.guild);
            guildsData.guilds.push(currentGuild);
            updateJson();
            msg.reply('appended new entry');
        }
    }
    else if (txt == '~delete') {
        if (generated(msg.guild.id)) {
            const idx = guildsData.guilds.findIndex((elem) => elem.guildID == msg.guild.id);
            let category = (await client.channels.fetch(guildsData.guilds[idx].categoryID).catch((err) => {
                console.log('Failed to find category');
            }));
            if (category) {
                category.children.mapValues(V => V.delete());
                category.delete();
            }
            guildsData.guilds = guildsData.guilds.filter((elem) => elem.guildID != msg.guild.id);
            updateJson();
            msg.reply('deleted channel structure');
        }
        else {
            msg.reply('cannot delete, channel not generated')
        }
        
    }
    else if (txt == '~reset') {
        guildsData = { "guilds": [] };
    }
    
});


async function updateJson() {
    if (JSON.stringify(guildsData).length > 10) {
        fs.writeFile('./data/guilds.json', JSON.stringify(guildsData), (err) => {
            if (err) throw err;
            console.log('guildsData written');
        });
        
    }
    else {
        console.log('did not write, guildsData too short');
    }
}

function generated(guildID) {
    return guildsData.guilds.some((elem) => elem.guildID == guildID);
}

async function generateChannels(guild) {

    const category = await guild.channels.create(channelData.category.name, { 
        type: channelData.category.type,
        permissionOverwrites: [
            {
                id: guild.id,
                allow: channelData.permissionPresets[channelData.category.permissions].allow,
                deny: channelData.permissionPresets[channelData.category.permissions].deny
            }
        ]
    })
    .catch(console.error);
    const guildData = {
        id: guildsData.guilds.length, 
        guildID: guild.id,
        categoryID: category.id,
        channels: {}
    }
    for (const channel of channelData.channels) {
        let guildChannel = await guild.channels.create(channel.name, { 
            type: channel.type,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: channelData.permissionPresets[channel.permissions].allow,
                    deny: channelData.permissionPresets[channel.permissions].deny
                }
            ]
        })
        .catch(console.error);
        guildChannel.setParent(category.id);
        guildData.channels[channel.abv] = guildChannel;
        if (channel.type == 'GUILD_TEXT' && channel.default_message != "") {
            guildChannel.send(channel.default_message);
        }
    }
    return guildData;
}






client.login(discordAuth);