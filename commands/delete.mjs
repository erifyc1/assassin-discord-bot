import { SlashCommandBuilder } from '@discordjs/builders';
import { updateJson } from '../utils.mjs'

export const data = new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Removes all game-related channels and messages.');
    
export async function execute(interaction, client, guildsData) {
    if (!interaction.replied && !interaction.deferred) await interaction.deferReply();
    if (generated(guildsData, interaction.guild.id)) {
        const idx = guildsData.guilds.findIndex((elem) => elem.guildID === interaction.guild.id);
        let category = (await client.channels.fetch(guildsData.guilds[idx].categoryID).catch((err) => {
            console.log('Failed to find category');
        }));
        if (category) {
            category.children.mapValues(V => V.delete());
            category.delete();
        }
        for (let [key, value] of Object.entries(guildsData.guilds[idx].roles)) {
            if (await interaction.guild.roles.fetch(value)) {
                await interaction.guild.roles.delete(value, 'Deleted Cyclic Assassin role.');
            }
        }

        guildsData.guilds = guildsData.guilds.filter((elem) => elem.guildID != interaction.guild.id);
        updateJson(guildsData, 'deleted guild');
        if (interaction.deferred) interaction.editReply('Game channels and roles deleted successfully.');
    }
    else {
        if (interaction.deferred) interaction.editReply('Cannot delete channels and roles, main category not detected.')
    }
};

function generated(guildsData, guildID) {
    return guildsData.guilds.some((elem) => elem.guildID === guildID);
}