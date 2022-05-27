import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears up to 50 chat messages.')
    .addIntegerOption(num =>
		num.setName('num_messages')
			.setDescription('How many messages to delete. (default = 10, max = 50)')
			.setRequired(false));
    
export async function execute(interaction) {
    await interaction.deferReply();
    let num_messages = interaction.options.getInteger('num_messages');
    num_messages = (num_messages ? num_messages : 10);
    if (num_messages <= 50 && num_messages > 0) {
        const channel = await interaction.member.guild.channels.fetch(interaction.channelId);
        const messages = await channel.messages.fetch({ limit: (num_messages ? num_messages : 10) });
        let first = true;
        messages.forEach(msg => {
            if (first) {
                first = false;
                return;
            }
            msg.delete()
        });
    
        await interaction.editReply({ content: 'Deleted messages.', ephemeral: true });
    }
    else {
        await interaction.editReply({ content: 'Failed to delete messages, provided number out of range.', ephemeral: true });
    }
};