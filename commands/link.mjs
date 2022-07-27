import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed, Modal, MessageActionRow, TextInputComponent, MessageButton } from 'discord.js';
import { updateJson } from '../utils.mjs'
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
    .setName('link')
    .setDescription('Links a Cyclic Assasin game to the current Discord server.');

export async function execute(interaction) {
    const actionRow = new MessageActionRow()
        .addComponents(getButton());

    interaction.reply({ content: 'In order to link a game, you must be a moderator in the linked game.\nPlease copy your [Cyclic Games Auth Token](http://www.cyclic.games/getToken).', ephemeral: true, components: [actionRow] })
};

export async function validateSubmission(interaction, guildsData) {

    const id = interaction.fields.getTextInputValue('gameId');
    const auth = interaction.fields.getTextInputValue('authToken');

    const res = await fetch(('http://www.cyclic.games/getGameID/' + id.toUpperCase()), {
        method: 'get',
        headers: { 'Authorization': ('Token ' + auth) }
    });
    const data = await res.json();

    if (!data.id) {
        if (data.error) {
            interaction.editReply({ content: `Sorry, we could not find Game **${id}**.`, ephemeral: true });
        }
        else {
            interaction.editReply({ content: `You are not a Moderator for Game **${id}**.\nLinking a Game requires a Moderator authentication token.`, ephemeral: true });
        }
    }
    else {
        interaction.editReply({ content: 'Successfully Linked Game: ' + id, ephemeral: true });
        const idx = guildsData.guilds.findIndex((elem) => elem.guildID === interaction.guild.id);
        if (idx === -1) {
            interaction.editReply('You must run /init before linking a game id.')
        }
        else {
            guildsData.guilds[idx].linkedGameID = id;
            guildsData.guilds[idx].apiToken = auth;
            updateJson(guildsData, 'updated linked game');
        }
    }
}
    
function getButton() {
    const button = new MessageButton({
        style: 'SUCCESS',
        customId: 'copiedToken',
        label: 'I have copied the token'
    });
    return button;
}

export async function showLinkModal(interaction) {
    const modal = new Modal()
        .addComponents(
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent({
                        customId: 'gameId',
                        label: 'Game ID',
                        style: 'PARAGRAPH',
                        placeholder: 'Enter the 8-character Game ID',
                        minLength: 8,
                        maxLength: 8
                    })
                ),
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent({
                        customId: 'authToken',
                        label: 'Cyclic Games Auth Token',
                        style: 'PARAGRAPH',
                        placeholder: 'Paste the 40-character Token',
                        minLength: 40,
                        maxLength: 40
                    })
                )
            )
        .setCustomId('linkmodal')
        .setTitle('Cyclic Assassin Game Link');
    await interaction.showModal(modal);
};