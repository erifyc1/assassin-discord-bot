import { SlashCommandBuilder } from '@discordjs/builders';

let active = true;

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Change options regarding the leaderboard.')
    .addStringOption(option =>
		option.setName('subcommand')
			.setDescription('Trigger leaderboard subcommand')
			.setRequired(true)
			.addChoices(
				{ name: 'refresh', value: 'refresh' },
				{ name: 'toggle', value: 'toggle' },
			));

export async function execute(interaction) {
    switch (interaction.options.getString('subcommand')) {
        case 'refresh':
            // let response = '';
            // let i = 0;
            // const res2 = await fetch(('http://www.cyclic.games/getLeaderboard/' + id), {
            //     method: 'get',
            //     headers: { 'Authorization': ('Token ' + data.token) }
            // });
            // const leaderboard = await res2.json();
            // for (const elem of leaderboard) {
            //     response += '#' + ++i + ': ' + elem.username + ' | ' + elem.kills + ' kills\n';
            // }
            // interaction.reply(response);
            await interaction.reply({ content: 'Leaderboard refreshed.' });
            break;

        case 'toggle':
            active = !active;
            const str = 'Leaderboard ' + active ? 'enabled.' : 'disabled.';
            await interaction.reply({ content: str });
            break;
    }
};