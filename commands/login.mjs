import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
    .setName('login')
    .setDescription('logs into website');
    
export async function execute(interaction) {
    await interaction.member.user.send('<@' + interaction.member.user.id + '>');
	await interaction.editReply({ content: 'Check your DM for confirmation.', ephemeral: true });
};