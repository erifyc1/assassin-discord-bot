import { SlashCommandBuilder } from '@discordjs/builders';
import { updateJson } from '../utils.mjs'

export const data = new SlashCommandBuilder()
    .setName('init')
    .setDescription('Initializes the game by generating the channel structure.');
    
export async function execute(interaction, guildsData, channelData) {
    if (generated(guildsData, interaction.guild.id)) {
        interaction.reply('Failed to initialize channels, channels have already been initialized.');
    }
    else {
        const currentGuild = await generateChannels(guildsData, channelData, interaction.guild);
        guildsData.guilds.push(currentGuild);
        updateJson(guildsData);
        interaction.editReply('Channels initialized successfully.');
    }
};

async function generateChannels(guildsData, channelData, guild) {

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
        guildData.channels[channel.abv] = guildChannel.id;
        if (channel.type === 'GUILD_TEXT' && channel.default_message !== "") {
            guildChannel.send(channel.default_message);
        }
    }
    return guildData;
}


function generated(guildsData, guildID) {
    return guildsData.guilds.some((elem) => elem.guildID === guildID);
}