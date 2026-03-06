const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TOKEN = 'MTQ3OTE5NTI3MzUyNzAzODA5OA.GOX6mo.c2m5YdJheh1UqBYWLt32BP3AWqdFKpmayzlAXg';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.first();
  if (!guild) { console.error('No guild'); process.exit(1); }

  // Set server icon
  try {
    const iconPath = path.join(__dirname, 'assets', 'server-icon.png');
    if (fs.existsSync(iconPath)) {
      await guild.setIcon(iconPath);
      console.log('✅ Server icon set!');
    }
  } catch(e) { console.log('⚠️ Icon error:', e.message); }

  // Set server banner (requires level 2 boost)
  try {
    const bannerPath = path.join(__dirname, 'assets', 'server-banner.png');
    if (fs.existsSync(bannerPath)) {
      await guild.setBanner(bannerPath);
      console.log('✅ Server banner set!');
    }
  } catch(e) { console.log('ℹ️ Banner requires Boost Level 2:', e.message); }

  console.log('✅ Done!');
  process.exit(0);
});

client.login(TOKEN);
