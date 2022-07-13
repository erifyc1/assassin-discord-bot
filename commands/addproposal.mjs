import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('addproposal')
    .setDescription('Adds a proposal that everyone can vote on.');
    
export async function execute(interaction) {
    await showProposalModal(interaction);
    // await interaction.reply({ content: 'Prompted you to enter a proposal.', ephemeral: true, });
    // const actionRow = new MessageActionRow()
    // .addComponents(
    //     new MessageButton()
    //     .setCustomId('loginbutton')
    //     .setLabel('Login')
    //     .setStyle('PRIMARY')
    //     )
    //     await dmchannel.send({ content: '<@' + interaction.member.user.id + '>, Click the button below to complete the login process.', components: [actionRow] });
    };
    
export async function showProposalModal(interaction) {
    const modal = new Modal()
        .addComponents(
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent()
                    .setCustomId('name')
                    .setLabel('Proposal Name')
                    .setStyle(1)
                    .setPlaceholder('Name your proposal.')
                    .setMinLength(10)
                    .setMaxLength(100),
                ),
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent()
                    .setCustomId('desc')
                    .setLabel('Proposal Description')
                    .setStyle(2)
                    .setPlaceholder('Describe your proposal. Be thorough.')
                    .setMinLength(20)
                    .setMaxLength(400),
                )
        )
        .setCustomId('proposalmodal')
        .setTitle('New Rule Proposal');
    await interaction.showModal(modal);
};

export async function submitForReview(interaction, client, guildsData) {
    const name = interaction.fields.getTextInputValue('name');
    const desc = interaction.fields.getTextInputValue('desc');
    const userID = interaction.user.id;

    // get the current guild and admin channel
    // failsafe checks if the guild or channel do not exist
    const idx = guildsData.guilds.findIndex((elem) => elem.guildID === interaction.guild.id);
    if (idx === -1) {
        interaction.reply('You must run /init before adding a proposal.')
        return;
    }
    const currentGuildData = guildsData.guilds[idx];
    const guild = client.guilds.cache.get(currentGuildData.guildID);
    if (!guild) {
        console.log('failed to find guild ' + currentGuildData.guildID);
        return;
    }
    const adminChannel = guild.channels.cache.get(currentGuildData.channels.admin);
    if (!adminChannel) {
        console.log('failed to find admin channel ' + currentGuildData.channels.admin);
        return;
    }
    // makes the embed and sends in admin channel with allow/reject button
    const embed = await makeProposalEmbed(name, desc, userID);
    await adminChannel.send({ embeds: [embed] });

}


async function makeProposalEmbed(name, desc, userID) {
    return new MessageEmbed()
    .setTitle(`Proposal:\n${name}`)
    .setColor(0xffffff)
    .setDescription(`Description:\n${desc}\n\u2800`)
    .setThumbnail('https://i.imgur.com/q0lDZMF.png')
    .setFields({ name: `Proposal Author:`, value: `<@${userID}>`, inline: false });
    // .setFooter({
    //     text: `Proposal Author: <@${userID}>`,
    //     iconURL: "https://i.imgur.com/q0lDZMF.png"
    // });
}