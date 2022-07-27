import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
    .setName('pong')
    .setDescription('Replies with Ping!');
    
export async function execute(interaction) {
    await interaction.reply({ content: 'Ping!', ephemeral: true });
};