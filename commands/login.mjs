import { SlashCommandBuilder } from '@discordjs/builders';
import { Message, MessageActionRow, MessageButton, Modal, TextInputComponent } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('login')
    .setDescription('logs into website');
    
export async function execute(interaction) {
    const modal = new Modal()
        .addComponents(
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent()
                    .setCustomId('loginusername')
                    .setLabel('Username')
                    .setStyle(1)
                    .setPlaceholder('Username'),
                ),
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent()
                    .setCustomId('loginpassword')
                    .setLabel('Password')
                    .setStyle(1)
                    .setPlaceholder('Password'),
                )
        )
        .setCustomId('loginmodal')
        .setTitle('login');
    const dmchannel = await interaction.member.user.createDM();
    await dmchannel.send({ content: '<@' + interaction.member.user.id + '>'/*, components: [actionRow]*/ });
	// await interaction.editReply({ content: 'Check your DM for confirmation.', ephemeral: true, });
    await interaction.showModal(modal);
    // await interaction.channel.send({ content: 'Check your DM for confirmation.' });
};