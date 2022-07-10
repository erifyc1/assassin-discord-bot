import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Help command for use of the Cyclic Assassin Bot.');
    
export async function execute(interaction) {
    // reqired fields
    const embed = new MessageEmbed()
    .setTitle("Cyclic Assassin Bot Command Help")
    .setColor(0xffffff)
    .setDescription("The Cyclic Assassin Bot helps you run a custom Assassin game right in your own server!\n\u2800")
    .setThumbnail('https://i.imgur.com/q0lDZMF.png')
    .setFooter({
        text: "Assassin by Cyclic Games",
        iconURL: "https://i.imgur.com/q0lDZMF.png"
    });
    // if (embedData.url) embed.setURL(embedData.url);
    // if (embedData.author) embed.setAuthor();
    // if (embedData.thumbnail && embedData.thumbnail.url) embed.setThumbnail(embedData.thumbnail.url);
    // if (embedData.image && embedData.image.url) embed.setImage(embedData.image.url)
    // if (embedData.footer) embed.setFooter(embedData.footer);

    await embed.addFields([
        {
            name: "__General Purpose__",
            value: "The following commands can be used by all users.",
            inline: false
        },
        {
            name: "/help",
            value: " - See information on all available commands",
            inline: false
        },
        {
            name: "/join",
            value: " - See information on how to join the game",
            inline: false
        },
        {
            name: "/login",
            value: " - Initiates the login process so you can fetch useful information using Discord!",
            inline: false
        },
        {
            name: "\u2800\n__Admin Required__",
            value: "The following commands require administrator permission or the 'Cyclic Assassin Admin' role",
            inline: false
        },
        {
            name: "/init",
            value: " - Initializes the channels, roles, and permissions required to run the game.",
            inline: false
        },
        {
            name: "/delete",
            value: " - Deletes the channels, roles, and permissions required to run the game.",
            inline: false
        },
        {
            name: "/reset",
            value: " - Deletes and reinitializes the channels, roles, and permissions required to run the game.",
            inline: false
        },
        {
            name: "/link [game id]",
            value: " - Links the provided game id to the current server, allowing user logins and the leaderboard to function.",
            inline: false
        }

    ]);
    await interaction.reply({ embeds: [embed] });
};