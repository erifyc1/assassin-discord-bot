import { SlashCommandBuilder } from '@discordjs/builders';
import { updateJson } from '../utils.mjs'
import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('init')
    .setDescription('Initializes the game by generating the channel structure.');
    
export async function execute(interaction, setupData) {
    if (!interaction.replied && !interaction.deferred) await interaction.deferReply();
    if (generated(setupData.guildsData, interaction.guild.id)) {
        if (interaction.deferred) interaction.editReply('Failed to initialize channels and roles, server has already been initialized.');
    }
    else if (interaction.member.permissionsIn(interaction.channel).has("ADMINISTRATOR")) {
        // under construction
        const currentGuild = await generateGuild(setupData, interaction.guild);
        setupData.guildsData.guilds.push(currentGuild);
        updateJson(setupData.guildsData, 'added guild');
        if (interaction.deferred) interaction.editReply('Game channels and roles initialized successfully.');
    }
    else {
        interaction.editReply('Only admins can use this command!');
    }
};

// generates channels required to run the game, make sure roles are generated first
async function generateChannels(channelData, permissionData, roles, guild, categoryID) {
    const channels = {};

    // generate each channel
    for (const channel of channelData) {
        let guildChannel = await guild.channels.create(channel.name, { 
            type: channel.type,
            permissionOverwrites: channel.permissions.map((roleObj) => {
                return {
                    id: roleObj.roleName === '@everyone' ? guild.id : roles[roleObj.roleName],
                    allow: permissionData[roleObj.preset].allow,
                    deny: permissionData[roleObj.preset].deny
                }
            }),
            topic: channel.topic
        })
        .catch(console.error);
        guildChannel.setParent(categoryID, { lockPermissions: false });
        channels[channel.abv] = guildChannel.id;
        // send default message, button, and/or embed
        if (channel.type === 'GUILD_TEXT') {
            if (channel.default_message) {
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
    return channels;
}


async function generateCategory(categoryData, permissionData, roles, guild) {
    // generate category
    const category = await guild.channels.create(categoryData.name, { 
        type: categoryData.type,
        permissionOverwrites: categoryData.permissions.map((roleObj) => {
            console.log(roleObj.roleName);
            return {
                id: roleObj.roleName === '@everyone' ? guild.id : roles[roleObj.roleName],
                allow: permissionData[roleObj.preset].allow,
                deny: permissionData[roleObj.preset].deny
            }
        })
    })
    .catch(console.error);
    return category;
}


function generated(guildsData, guildID) {
    return guildsData.guilds.some((elem) => elem.guildID === guildID);
}

async function makeEmbed(embedData) {
    // reqired fields
    const embed = new MessageEmbed({
        title: embedData.title,
        color: embedData.color,
        description: embedData.description
    });
    
	if (embedData.url) embed.setURL(embedData.url);
    if (embedData.author) embed.setAuthor(embedData.author);
	if (embedData.thumbnail && embedData.thumbnail.url) embed.setThumbnail(embedData.thumbnail.url);
    if (embedData.fields) embed.addFields(embedData.fields);
    if (embedData.image && embedData.image.url) embed.setImage(embedData.image.url)
	if (embedData.footer) embed.setFooter(embedData.footer);
    if (embedData.timestamp && embedData.timestamp === 'true') embed.setTimestamp();
    return embed;
}

async function makeButton(buttonData) {
    
    const button = new MessageButton({
        style: buttonData.style,
        customId: buttonData.customId,
        label: buttonData.label
    });
    return button;
}

async function generateRoles(roleData, guild) {
    const roles = {};
    for (const role of roleData.roles) {
        const r = await guild.roles.create({
            name: role.name,
            color: role.color,
            reason: 'Created for use in Cyclic Assassin!'
        });
        roles[role.abv] = r.id;
    }
    return roles;
}

async function generateGuild(setupData, guild) {
    const { guildsData, channelData, permissionData, roleData } = setupData;
    // set up guildData object
    const guildData = {
        id: setupData.guildsData.guilds.length, 
        guildID: guild.id,
        linkedGameID: '',
        apiToken: '',
        categoryID: -1,
        channels: {},
        roles: {}
    };
    // generate roles first, because channel permissions depend on existence
    guildData.roles = await generateRoles(roleData, guild);

    // generate category, then channels
    const category = await generateCategory(channelData.category, permissionData, guildData.roles, guild);
    guildData.categoryID = category.id;
    guildData.channels = await generateChannels(channelData.channels, permissionData, guildData.roles, guild, category.id);
    return guildData;
}