import { SlashCommandBuilder } from '@discordjs/builders';
import { updateJson } from '../utils.mjs'
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
    .setName('link')
    .setDescription('Links the provided game id to the current Discord server.')
    .addStringOption(option =>
		option.setName('gameid')
			.setDescription('Game ID')
			.setRequired(true));

export async function execute(interaction, guildsData) {
    const id = interaction.options.getString('gameid');
    const params = new URLSearchParams();
        params.append('username', '1');
        params.append('password', '1');
        const res = await fetch('http://www.cyclic.games/api-token-auth/', {
            method: 'post',
            body: params
        });
        const data = await res.json();
        const res2 = await fetch(('http://www.cyclic.games/getLeaderboard/' + id), {
            method: 'get',
            headers: { 'Authorization': ('Token ' + data.apiToken) }
        });
        const data2 = await res2.json();
        console.log(data2);
        if (data2.length === 0) {
            interaction.reply('Sorry, your account does not have access to any game with id: ' + id);
        }
        else {
            const idx = guildsData.guilds.findIndex((elem) => elem.guildID === interaction.guild.id);
            if (idx === -1) {
                interaction.reply('You must run /init before linking a game id.')
            }
            else {
                guildsData.guilds[idx].linkedGameID = id;
                guildsData.guilds[idx].apiToken = data.token;
                updateJson(guildsData);
                interaction.reply('Successfully Linked Game: ' + id);
            }
        }
};