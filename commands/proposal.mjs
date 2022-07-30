import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu, CommandInteraction } from 'discord.js';

const colors = {
    'red': 0xc71e12,
    'orange': 0xc47525,
    'yellow': 0xdecc0d,
    'green': 0x1f700f,
    'blue': 0x0f60ab,
    'purple': 0x8f13ab,
    'pink': 0xd91cb9
}

export const data = new SlashCommandBuilder()
    .setName('proposal')
    .setDescription('Adds a proposal that everyone can vote on.');

export async function execute(interaction) {
    await showProposalModal(interaction);
};

/**
 * Shows the proposal input modal
 * @param {CommandInteraction} interaction 
 */
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
                        customId: 'category',
                        placeholder: 'Select Category',
                        options: [
                            {
                                label: 'Select Category',
                                value: 'unselected',
                                emoji: '⬇️',
                                default: true
                            },
                            {
                                label: 'Kill Methods',
                                description: 'Relating to adding/removing/modifying kill methods.',
                                value: 'kill',
                                emoji: '💀'
                            },
                            {
                                label: 'Town Hall',
                                description: 'Relating to Town Hall processes.',
                                value: 'townhall',
                                emoji: '🏫'
                            },
                            {
                                label: 'Other',
                                description: 'Relating to other aspects of the game.',
                                value: 'other',
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


/**
 * Submits the proposal for review by moderator
 * @param {CommandInteraction} interaction 
 * @param {Client} client
 * @param {Object} guildsData 
 */
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
    const embed = makeProposalEmbed(name, desc, userID);
    const actionRow = new MessageActionRow()
    .addComponents(
        new MessageButton({
            style: 'DANGER',
            customId: 'proposalblocked',
            label: 'Block'
        }),
        new MessageButton({
            style: 'SUCCESS',
            customId: 'proposalapproved',
            label: 'Approve'
        })
    )
    await adminChannel.send({ embeds: [embed], components: [actionRow] });

}
/**
 * Triggers when proposal decision is made
 * @param {Client} client 
 * @param {CommandInteraction} interaction 
 * @param {boolean} accepted 
 */
export async function proposalDecision(interaction, client, accepted, votingChannelId) {
    console.log(interaction.message);
    if (accepted) {
        // passes the proposal
        executeDecision(interaction, client, accepted, votingChannelId);
    }
    else {
        // ask for reason for denial
        showReasonModal(interaction);
    }
}

export async function executeDecision(interaction, client, accepted, votingChannelId = 0) {
    // console.log(interaction);
    const propEmbed = interaction.message.embeds[0];
    // modify the embed
    propEmbed.addFields({ name: `${accepted ? `Approved` : `Blocked`} by:`, value: `<@${interaction.user.id}>`, inline: true });
    if (!accepted) {
        let reason = interaction.fields.getTextInputValue('reason');
        if (!reason) reason = 'No reason given.';
        propEmbed.setTitle(`~~${propEmbed.title}~~`);
        propEmbed.setDescription(`~~${propEmbed.description}~~`);
        propEmbed.addFields({ name: 'Denial Reason: ', value: `${reason}`, inline: false})
    }
    await interaction.message.edit({ embeds: [propEmbed], components: [] });
    await interaction.reply({ content: `You have successfully ${accepted ? `approved` : `blocked`} this proposal.`, ephemeral: true });
    
    // send proposal in voting channel
    if (accepted && votingChannelId) {
        const votingChannel = guild.channels.cache.get(votingChannelId);
        votingChannel.send({ embeds: [propEmbed] });
    }
    // send DM to proposal author
    const userId = propEmbed.fields[0].value.match(/^<@(\d{18})>$/)[1];
    const dmchannel = await client.users.cache.get(userId).createDM();
    if (accepted) {
        dmchannel.send({ content: `We regret to inform you that your Cyclic Assassin Rule Proposal was blocked by a moderator.\nReason provided: ${reason}` });
    }
    else {
        dmchannel.send({ content: `Congratulations! Your Cyclic Assassin Rule Proposal was accepted by a moderator.\nCheck out the <#${votingChannelId}> to see and discuss your proposal!` });
    }

}

/**
 * makes the proposal embed
 * @param {String} name 
 * @param {String} desc 
 * @param {String} category 
 * @param {String} userID 
 * @returns {MessageEmbed}
 */
function makeProposalEmbed(name, desc, userID) {
    return new MessageEmbed()
    .setTitle(`Gameplay Proposal:\n${name}`)
    .setColor(0xffffff)
    .setDescription(`Description:\n${desc}`)
    .setThumbnail('https://i.imgur.com/q0lDZMF.png')
    .setFields({ name: `Author:`, value: `<@${userID}>`, inline: true });
}

/**
 * creates the modal to specify the reason for blocking a proposal
 * @param {CommandInteraction} interaction
 * @returns {Modal}
 */
async function showReasonModal(interaction) {
    const modal = new Modal()
        .addComponents(
            new MessageActionRow()
                .addComponents(
                    new TextInputComponent({
                        customId: 'reason',
                        label: 'Reason',
                        style: 'PARAGRAPH',
                        placeholder: 'Explain why you are blocking this proposal. [Optional]',
                        minLength: 0,
                        maxLength: 200
                    })
                ),
        )
        .setCustomId('proposalreason')
        .setTitle('Proposal Denial Reason');
    await interaction.showModal(modal);
}