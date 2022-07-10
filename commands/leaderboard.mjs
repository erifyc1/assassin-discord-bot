import { SlashCommandBuilder } from '@discordjs/builders';

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
    
export async function execute(interaction) {
    switch (interaction.options.getString('subcommand')) {
        case 'refresh':
            break;
            
        case 'toggle':
            break;
    }
    await interaction.reply({ content: interaction.options.getString('subcommand') });
};