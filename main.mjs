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


client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
    fs.readFile('./data/guilds.json', 'utf-8', (err, data) => {
        if (err) throw err;
        guildsData = JSON.parse(data.toString());
        console.log('Read from file successfully.');
    });
    client.user.setActivity('testing' );
});

client.on("messageCreate", async (msg) => {
    const txt = msg.content;
    if (!txt.startsWith('~')) return;

    else if (txt == '~generate') {
        if (generated(msg.guild.id)) {
            msg.reply('channel structure has already been generated');
        }
        else {
            const category = await msg.guild.channels.create("Cyclic Assassin Game", { type: "GUILD_CATEGORY"});
            const currentGuild = {
                id: guildsData.guilds.length, 
                guildID: msg.guild.id,
                categoryID: category.id
            }
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
            if (category) category.delete();
            guildsData.guilds = guildsData.guilds.filter((elem) => elem.guildID != msg.guild.id);
            updateJson();
            msg.reply('deleted channel structure');
        }
        else {
            msg.reply('cannot delete, channel not generated')
        }

    }

});


function updateJson() {
    fs.writeFile('./data/guilds.json', JSON.stringify(guildsData), (err) => {
        if (err) throw err;
        console.log('guildsData written');
    });
}

function generated(guildID) {
    return guildsData.guilds.some((elem) => elem.guildID == guildID);
}








client.login(discordAuth);