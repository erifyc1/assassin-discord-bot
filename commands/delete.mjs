import { SlashCommandBuilder } from '@discordjs/builders';
import { updateJson } from '../utils.mjs'

export const data = new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Removes all game-related channels and messages.');
    
export async function execute(interaction, guildsData, client) {
    await interaction.deferReply();
    if (generated(guildsData, interaction.guild.id)) {
        const idx = guildsData.guilds.findIndex((elem) => elem.guildID === interaction.guild.id);
        let category = (await client.channels.fetch(guildsData.guilds[idx].categoryID).catch((err) => {
            console.log('Failed to find category');
        }));
        if (category) {
            category.children.mapValues(V => V.delete());
            category.delete();
        }
        guildsData.guilds = guildsData.guilds.filter((elem) => elem.guildID != interaction.guild.id);
        updateJson(guildsData);
        interaction.editReply('Channels deleted successfully.');
    }
    else {
        interaction.editReply('Cannot delete channels, channels not detected.')
    }
};

function generated(guildsData, guildID) {
    return guildsData.guilds.some((elem) => elem.guildID === guildID);
}