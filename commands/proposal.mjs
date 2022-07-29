import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, Message, MessageSelectMenu } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('proposal')
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
                    new TextInputComponent({
                        customId: 'name',
                        label: 'Proposal Name',
                        style: 'SHORT',
                        placeholder: 'Name your proposal.',
                        minLength: 10,
                        maxLength: 100
                    })
                ),
            new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu({
                        customId: 'topic',
                        placeholder: 'Select Category',
                        options: [
                            {
                                label: 'Kill Methods',
                                description: 'Relating to adding/removing/modifying kill methods.',
                                value: 'km',
                                emoji: '💀'
                            },
                            {
                                label: 'Town Hall',
                                description: 'Relating to Town Hall processes.',
                                value: 'th',
                                emoji: '🏫'
                            },
                            {
                                label: 'Other',
                                description: 'Relating to other aspects of the game.',
                                value: 'ot',
                                emoji: '❓'
                            }
                        ]
                    })
                ),
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent({
                        customId: 'desc',
                        label: 'Proposal Description',
                        style: 'PARAGRAPH',
                        placeholder: 'Describe your proposal. Be thorough.',
                        minLength: 20,
                        maxLength: 400
                    })
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
    const actionRow = new MessageActionRow()
    .addComponents(
        new MessageButton({
            style: 'DANGER',
            customId: 'proposalrejected',
            label: 'Reject'
        }),
        new MessageButton({
            style: 'SUCCESS',
            customId: 'proposalauthorized',
            label: 'Authorize'
        })
    )
    await adminChannel.send({ embeds: [embed], components: [actionRow] });

}

export async function proposalDecision(interaction, accepted) {
    const propEmbed = interaction.message.embeds[0];
    propEmbed.addFields({ name: `${accepted ? `Authorized` : `Rejected`} by:`, value: `<@${interaction.user.id}>`, inline: true });
    await interaction.message.edit({ embeds: [propEmbed], components: [] });
    await interaction.reply({ content: `You have successfully ${accepted ? `authorized` : `rejected`} this proposal.`, ephemeral: true });
}



async function makeProposalEmbed(name, desc, userID) {
    return new MessageEmbed()
    .setTitle(`Gameplay Proposal:\n${name}`)
    .setColor(0xffffff)
    .setDescription(`Description:\n${desc}`)
    .setThumbnail('https://i.imgur.com/q0lDZMF.png')
    .setFields({ name: `Author:`, value: `<@${userID}>`, inline: true });
    // .setFooter({
    //     text: `Proposal Author: <@${userID}>`,
    //     iconURL: "https://i.imgur.com/q0lDZMF.png"
    // });
}