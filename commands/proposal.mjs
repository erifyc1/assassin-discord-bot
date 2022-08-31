import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu, CommandInteraction, ThreadManager } from 'discord.js';

const colors = {
    'red': 0xc71e12,
    'orange': 0xc47525,
    'yellow': 0xdecc0d,
    'green': 0x1f700f,
    'blue': 0x0f60ab,
    'purple': 0x8f13ab,
    'pink': 0xd91cb9,
    'cyclic': 0xce5d36
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
                /** 
                 * @note MessageSelectMenu not supported on mobile client 8/31/22
                 * @url https://stackoverflow.com/questions/73233994/extract-select-menu-values-from-modal-discord-js
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
                */
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
export async function proposalDecision(interaction, client, accepted, votingChannelId = '') {
    if (accepted && votingChannelId) {
        // passes the proposal
        await executeDecision(interaction, client, accepted, votingChannelId);
    }
    else {
        // ask for reason for denial
        await showReasonModal(interaction);
    }
}
/**
 * executes a moderator decision on a proposal (start voting or block)
 * @param {CommandInteraction} interaction 
 * @param {Client} client 
 * @param {boolean} accepted 
 * @param {String} votingChannelId 
 */
export async function executeDecision(interaction, client, accepted, votingChannelId = '') {
    const propEmbed = interaction.message.embeds[0];

    // modify the embed
    propEmbed.addFields(
        { name: `${accepted ? `Approved` : `Blocked`} by:`, value: `<@${interaction.user.id}>`, inline: true }
    );
    await interaction.reply({ content: `You have successfully ${accepted ? `approved` : `blocked`} this proposal.`, ephemeral: true });
    
    // get author, open DM
    const userId = propEmbed.fields[0].value.match(/^<@(\d{18})>$/)[1];
    const dmchannel = await client.users.cache.get(userId).createDM();
    const responseEmbed = makeResponseEmbed();

    const proposalName = `"${propEmbed.title.substring(19)}"\n\n`;
    responseEmbed.description += proposalName;
    if (accepted) {
        // send DM to proposal author
        responseEmbed.description += `Congratulations! Your Cyclic Assassin Rule Proposal was accepted by a moderator.\nCheck out the <#${votingChannelId}> to view and discuss your proposal!`
        dmchannel.send({ embeds: [responseEmbed] });

        // send proposal in voting channel, modify to read 'ACTIVE'
        propEmbed.addFields({ name: `Status:`, value: `✅ ACTIVE`, inline: false });
        const votingChannel = interaction.guild.channels.cache.get(votingChannelId);
        const message = await votingChannel.send({ embeds: [propEmbed] });

        // start thread for chatting about proposal
        const thread = await message.startThread({
            name: `Discuss: '${proposalName}'`,
            autoArchiveDuration: 60,
            reason: `Proposal: '${proposalName}' discussion thread.`,
            type: 'GUILD_PRIVATE_THREAD'
        });
        thread.send({ embeds: [{ title: 'This thread is for discussing the proposal posted above.', description: 'If you would like to hide this thread, hit \'**Leave Thread**\' or it will automatically hide after one hour of inactivity.'}]})
        console.log(`Created thread: ${thread.name}`);

        // modify admin embed to link to live embed in voting channel
        // replace ✅ Active text since it will not be updated
        propEmbed.fields[2] = { name: `Status:`, value: `[See Active Proposal](${message.url})` };

        // set up reactions
        message.react('👍');
        message.react('👎');
    }
    else {
        // send DM to proposal author
        let reason = interaction.fields.getTextInputValue('reason');
        if (!reason) reason = 'No reason given.';
        responseEmbed.description += `We regret to inform you that your Cyclic Assassin Rule Proposal was blocked by a moderator.\nReason provided: ${reason}`;
        dmchannel.send({ embeds: [responseEmbed] });

        // cross out proposal embed
        propEmbed.setTitle(`~~${propEmbed.title}~~`);
        propEmbed.setDescription(`~~${propEmbed.description}~~`);
        propEmbed.addFields({ name: 'Denial Reason: ', value: `${reason}`, inline: false})
    }
    await interaction.message.edit({ embeds: [propEmbed], components: [] });
}

/**
 * makes the proposal embed to be sent in the voting & admin channel
 * @param {String} name 
 * @param {String} desc 
 * @param {String} category 
 * @param {String} userID 
 * @returns {MessageEmbed}
 */
function makeProposalEmbed(name, desc, userID) {
    return new MessageEmbed()
    .setTitle(`Gameplay Proposal:\n${name}`)
    .setColor(0xce5d36)
    .setDescription(`Description:\n${desc}`)
    .setThumbnail('https://i.imgur.com/q0lDZMF.png')
    .setFields({ name: `Author:`, value: `<@${userID}>`, inline: true });
}

/**
 * Creates a baseline response embed to be sent to the proposal author (varies based on acceptance status)
 * @returns {MessageEmbed}
 */
function makeResponseEmbed() {
    return new MessageEmbed({
        title: 'Proposal Status Update',
        color: 0xce5d36,
        description: `**Proposal:** `,
        footer: {
            text: "Assassin by Cyclic Games",
            iconURL: "https://i.imgur.com/q0lDZMF.png"
        }
    });
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
                        placeholder: '[Optional] Explain why you are blocking this proposal.',
                        minLength: 0,
                        maxLength: 200
                    })
                ),
        )
        .setCustomId('proposalreason')
        .setTitle('Proposal Denial Reason');
    await interaction.showModal(modal);
}