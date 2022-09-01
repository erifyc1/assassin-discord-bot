import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('join')
    .setDescription('Sends you information on how to join Cyclic Assassin!');
// data.setDMPermission(false);

export async function execute(interaction) {
    const joinEmbed = await makeEmbed(joinEmbedData);
    const dmchannel = await interaction.member.user.createDM();
    await dmchannel.send({ content: 'Thank you for your interest in Cyclic Assassin, <@' + interaction.member.user.id + '>!', embeds: [joinEmbed] });
    // if (interaction.isCommand()) {
        await interaction.reply({ content: 'Check your DM for more information.', ephemeral: true, });
    // }
};


async function makeEmbed(embedData) {
    // reqired fields
    const embed = new MessageEmbed()
	.setTitle(embedData.title)
	.setColor(embedData.color)
	.setDescription(embedData.description);

	if (embedData.url) embed.setURL(embedData.url);
    if (embedData.author) embed.setAuthor(embedData.author);
	if (embedData.thumbnail && embedData.thumbnail.url) embed.setThumbnail(embedData.thumbnail.url);
    if (embedData.fields) embed.addFields(embedData.fields);
    if (embedData.image && embedData.image.url) embed.setImage(embedData.image.url)
	if (embedData.footer) embed.setFooter(embedData.footer);

    embed.setTimestamp()
    return embed;
}

const joinEmbedData = 
{
    "color": "0x1111ff",
    "title": "How to join Cyclic Games Assassin",
    "description": "**PLEASE NOTE: A *very* common reason to not play Assassin is being busy.**\nNote that you **do not** have to attend anything to play the game, it's all throughout the next few weeks.\nSo, if you're busy on certain days, this is 100% acceptable and expected!\n\u2800",
    "fields": [
        {
            "name": "1. Register an account and fill in the necessary information at http://www.cyclic.games/",
            "value": "You **MUST** use your @illinois.edu email to verify that you are a student.\n\u2800",
            "inline": "false"
        },
        {
            "name": "2. Send $5 to one of the game moderators.",
            "value": "\u2800\u2800\u2802 You can win this back (and potentially more) through kills, winning, and participation.\n\u2800\u2800\u2802 Payment methods: Venmo (@Evan-Coats) or cash.\n\u2800\u2800\u2802 Make sure to include your __name and discord tag__ when sending online payment, so the mods can confirm who sent the money.\n\u2800\u2800\u2802 Note: This amount is **REFUNDABLE** up until when the game starts for if you decide against playing!\n\u2800",
            "inline": "false"
        },
        {
            "name": "3. Make sure a staff member adds you to the @active game member role.",
            "value": "If you do not have this role, contact a staff member.\n\u2800",
            "inline": "false"
        }
    ],
    "footer": {
        "text": "Assassin by Cyclic.games",
        "icon_url": "https://i.imgur.com/a/GclRBkw.png"
    }
};