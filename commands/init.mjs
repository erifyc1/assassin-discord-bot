import { SlashCommandBuilder } from '@discordjs/builders';
import { updateJson } from '../utils.mjs'
import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('init')
    .setDescription('Initializes the game by generating the channel structure.');
    
export async function execute(interaction, guildsData, channelData) {
    if (!interaction.replied && !interaction.deferred) await interaction.deferReply();
    if (generated(guildsData, interaction.guild.id)) {
        if (interaction.deferred) interaction.editReply('Failed to initialize channels, channels have already been initialized.');
    }
    else {
        const currentGuild = await generateChannels(guildsData, channelData, interaction.guild);
        guildsData.guilds.push(currentGuild);
        updateJson(guildsData);
        if (interaction.deferred) interaction.editReply('Channels initialized successfully.');
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

        if (channel.type === 'GUILD_TEXT') {
            if (channel.default_message !== "") {
                guildChannel.send(channel.default_message);
            }
            if (channel.embeds) {
                channel.embeds.forEach(async (embed) => {
                    const embedObj = await makeEmbed(embed);
                    guildChannel.send({ embeds: [embedObj] });
                })
            }
            if (channel.button) {
                const buttonObj = await makeButton(channel.button);
                const row = new MessageActionRow().addComponents(buttonObj);
                guildChannel.send({ components: [row] })
            }
        }
    }
    return guildData;
}


function generated(guildsData, guildID) {
    return guildsData.guilds.some((elem) => elem.guildID === guildID);
}

async function makeEmbed(embedData) {
    // reqired fields
    const embed = new MessageEmbed()
	.setTitle(embedData.title)
	.setColor(embedData.color)
	.setDescription(embedData.description);

	if (embedData.url) embed.setURL(embedData.url);
    if (embedData.author) embed.setAuthor(embedData.author);
	if (embedData.thumbnail && embedData.thumbnail.url) embed.setThumbnail(embedData.thumbnail.url);
    if (embedData.fields) embed.addFields(embedData.fields);
    if (embedData.image && embedData.image.url) embed.setImage(embedData.image.url)
	if (embedData.footer) embed.setFooter(embedData.footer);

    embed.setTimestamp()
    return embed;
}

async function makeButton(buttonData) {
    
    const button = new MessageButton()
    .setStyle(buttonData.style)
    .setCustomId(buttonData.customId)
    .setLabel(buttonData.label);

    return button;
}