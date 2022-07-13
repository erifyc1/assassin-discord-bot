import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Change options regarding the leaderboard.')
    .addStringOption(option =>
		option.setName('subcommand')
			.setDescription('Trigger leaderboard subcommand')
			.setRequired(true)
			.addChoices(
				{ name: 'refresh', value: 'refresh' },
				{ name: 'toggle', value: 'toggle' },
			));

export async function execute(interaction, client, guildsData) {
    switch (interaction.options.getString('subcommand')) {
        case 'refresh':
            const idx = guildsData.guilds.findIndex((elem) => elem.guildID === interaction.guild.id);
            if (idx === -1) {
                interaction.reply('You must run /init before using the leaderboard.')
                return;
            }
            const currentGuildData = guildsData.guilds[idx];
            await refresh(client, currentGuildData);
            await interaction.reply('Leaderboard refreshed, check <#' + currentGuildData.channels.leaderboard + '>.');
            break;
            
            case 'toggle':
                // active = !active;
                // const str = active ? 'Leaderboard enabled.' : 'Leaderboard disabled.';
                await interaction.reply({ content: 'feature not implemented yet' });
                break;
            }
};

export async function refresh(client, currentGuildData) {
    // get the current guild and leaderboard channel
    // failsafe checks if the guild or channel do not exist
    const guild = client.guilds.cache.get(currentGuildData.guildID);
    if (!guild) {
        console.log('failed to find guild ' + currentGuildData.guildID);
        return;
    }
    const leaderboardChannel = guild.channels.cache.get(currentGuildData.channels.leaderboard);
    if (!leaderboardChannel) {
        console.log('failed to find leaderboard channel ' + currentGuildData.channels.leaderboard);
        return;
    }
    // clears up to 10 existing messages in the leaderboard chat, hopefully getting rid of all previous leaderboard posts
    const messages = await leaderboardChannel.messages.fetch({ limit: 10 });
    messages.forEach(msg => { msg.delete() });

    // check if no game is linked, sends blank embed
    if (currentGuildData.linkedGameID === '' || currentGuildData.apiToken === '') {
        const blankLeaderboardEmbed = await makeBlankLeaderboardEmbed();
        await leaderboardChannel.send({ embeds: [blankLeaderboardEmbed] });
    }
    else {
        const res2 = await fetch(('http://www.cyclic.games/getLeaderboard/' + currentGuildData.linkedGameID), {
            method: 'get',
            headers: { 'Authorization': ('Token ' + currentGuildData.apiToken) }
        });
        const leaderboard = await res2.json();
        const leaderboardEmbed = await makeLeaderboardEmbed(leaderboard);
        await leaderboardChannel.send({ embeds: [leaderboardEmbed]});
    }
};

// function to create the leaderboard embed
async function makeLeaderboardEmbed(leaderboardJSON) {
    const embed = new MessageEmbed()
    .setTitle("Leaderboard")
    .setColor(0xffffff)
    .setDescription("Top ranked players in the current game.\n\u2800")
    .setThumbnail('https://i.imgur.com/q0lDZMF.png')
    .setTimestamp()
    .setFooter({
        text: "Assassin by Cyclic Games",
        iconURL: "https://i.imgur.com/q0lDZMF.png"
    });
    let statuses = '', usernames = '', kills = '';
    console.log(leaderboardJSON);
    if (Object.keys(leaderboardJSON).length <= 1) {
        embed.addFields({ name: 'Error', value: 'Failed to fetch leaderboard', inline: false });
    }
    else {
        for (let i in leaderboardJSON) {
            const elem = leaderboardJSON[i];
            statuses += `${elem.alive ? `✅` : `❌`}\u2800\u2800\u2800#${++i}\n`;
            usernames += `${elem.username}\n`;
            kills += `${elem.kills}\n`;
            --i;
        }
        embed.addFields(
            { name: 'Alive\u2800\u2800Rank', value: statuses, inline: true },
            { name: 'Name', value: usernames, inline: true },
            { name: 'Kills', value: kills, inline: true },
        )
    }
    return embed;
}

// parameterless version for when there is no game linked
async function makeBlankLeaderboardEmbed() {
    const embed = new MessageEmbed()
    .setTitle("Leaderboard")
    .setColor(0xffffff)
    .setDescription("Top ranked players in the current game.\n\u2800")
    .setThumbnail('https://i.imgur.com/q0lDZMF.png')
    .setTimestamp()
    .setFooter({
        text: "Assassin by Cyclic Games",
        iconURL: "https://i.imgur.com/q0lDZMF.png"
    });
    return embed;
}