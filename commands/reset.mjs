import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Resets channel structure, same as /delete then /init');
data.setDefaultPermission(false);
// data.setDMPermission(false);
    
export async function execute(interaction, client, setupData) {
    const deleteCommand = client.commands.get('delete');
    const initCommand = client.commands.get('init');

    await deleteCommand.execute(interaction, client, setupData.guildsData);
    await initCommand.execute(interaction, setupData);
    await interaction.editReply('Channel reset complete')
};