import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageButton, Modal, TextInputComponent } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('login')
    .setDescription('logs into website');
// data.setDMPermission(false);
    
export async function execute(interaction) {
    interaction.deferReply();
    const actionRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
        .setCustomId('loginbutton')
        .setLabel('Login')
        .setStyle('PRIMARY')
        )
        const dmchannel = await interaction.member.user.createDM();
        await dmchannel.send({ content: '<@' + interaction.member.user.id + '>, Click the button below to complete the login process.', components: [actionRow] });
        await interaction.editReply({ content: 'Check your DM for confirmation.', ephemeral: true, });
        // await interaction.channel.send({ content: 'Check your DM for confirmation.' });
    };
    
export async function showLoginModal(interaction) {
    const modal = new Modal()
        .addComponents(
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent()
                    .setCustomId('username')
                    .setLabel('Username')
                    .setStyle(1)
                    .setPlaceholder('Username'),
                ),
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent()
                    .setCustomId('password')
                    .setLabel('Password')
                    .setStyle(1)
                    .setPlaceholder('Password'),
                )
        )
        .setCustomId('loginmodal')
        .setTitle('login');
    await interaction.showModal(modal);
};