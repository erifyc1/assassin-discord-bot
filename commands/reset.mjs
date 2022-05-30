import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Resets channel structure, same as /delete then /init');
    
export async function execute(interaction, guildsData, client, channelData) {
    const deleteCommand = client.commands.get('delete');
    const initCommand = client.commands.get('init');

    await deleteCommand.execute(interaction, guildsData, client);
    await initCommand.execute(interaction, guildsData, channelData);
    await interaction.editReply('Channel reset complete')
};