import fs from 'fs';

export async function updateJson(guildsData, reason) {
    if (JSON.stringify(guildsData).length > 10) {
        fs.writeFile('./data/guilds.json', JSON.stringify(guildsData), (err) => {
            if (err) throw err;
            console.log(`guilds.json updated: (${reason})`);
        });
        
    }
    else {
        console.log('did not write, guildsData too short');
    }
}