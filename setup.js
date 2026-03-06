/**
 * Black Host — Full Server Setup Script
 * Run once to set up the entire server: roles, channels, embeds, icon, banner.
 */
const {
  Client, GatewayIntentBits, PermissionFlagsBits, ChannelType,
  AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./data/config.json');
const { postAllEmbeds } = require('./handlers/interactions');

const TOKEN = process.env.DISCORD_TOKEN || 'MTQ3OTE5NTI3MzUyNzAzODA5OA.GOX6mo.c2m5YdJheh1UqBYWLt32BP3AWqdFKpmayzlAXg';
const GUILD_ID = config.guildId;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const ROLES = [
  { name: '👑 Owner',         color: 0xFFD700, hoist: true, perms: [PermissionFlagsBits.Administrator] },
  { name: '⚙️ Admin',         color: 0xFF4500, hoist: true, perms: [PermissionFlagsBits.Administrator] },
  { name: '🛡️ Moderator',     color: 0xFF6B35, hoist: true, perms: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
  { name: '🎫 Support Staff', color: 0xFFA500, hoist: true, perms: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ViewChannel] },
  { name: '💎 VIP Customer',  color: 0xB8860B, hoist: true, perms: [] },
  { name: '🛒 Customer',      color: 0xC0C0C0, hoist: true, perms: [] },
  { name: '✅ Verified',      color: 0x2ECC71, hoist: false, perms: [] },
  { name: '🤖 Bot',           color: 0x7289DA, hoist: true,  perms: [] },
  { name: '👤 Member',        color: 0x555555, hoist: false, perms: [] },
];

const STRUCTURE = [
  {
    name: '━━━━━ 🏠 WELCOME ━━━━━', staffOnly: false,
    channels: [
      { name: '📢┃announcements', type: 'text', readOnly: true },
      { name: '👋┃welcome',       type: 'text', readOnly: true },
      { name: '📜┃rules',         type: 'text', readOnly: true },
      { name: '🔰┃verify',        type: 'text', readOnly: true },
      { name: '📊┃server-info',   type: 'text', readOnly: true },
    ]
  },
  {
    name: '━━━━━ 🛍️ STORE ━━━━━', staffOnly: false,
    channels: [
      { name: '🛒┃how-to-order',    type: 'text', readOnly: true },
      { name: '💳┃payment-methods', type: 'text', readOnly: true },
      { name: '⭐┃reviews',         type: 'text', readOnly: false },
      { name: '🔥┃deals-and-sales', type: 'text', readOnly: true },
    ]
  },
  {
    name: '━━━━━ 📦 PRODUCTS ━━━━━', staffOnly: false,
    channels: [
      { name: '💜┃discord-nitro',  type: 'text', readOnly: true },
      { name: '🔴┃netflix',        type: 'text', readOnly: true },
      { name: '🟠┃crunchyroll',    type: 'text', readOnly: true },
      { name: '🟢┃spotify',        type: 'text', readOnly: true },
      { name: '🎮┃xbox-gamepass',  type: 'text', readOnly: true },
      { name: '🔵┃steam-games',    type: 'text', readOnly: true },
      { name: '🛡️┃vpn-services',   type: 'text', readOnly: true },
      { name: '📱┃other-products', type: 'text', readOnly: true },
    ]
  },
  {
    name: '━━━━━ 💬 COMMUNITY ━━━━━', staffOnly: false,
    channels: [
      { name: '💬┃general',      type: 'text',  readOnly: false },
      { name: '🆘┃support-chat', type: 'text',  readOnly: false },
      { name: '🎉┃giveaways',    type: 'text',  readOnly: true  },
      { name: '🤖┃bot-commands', type: 'text',  readOnly: false },
      { name: '🔊┃lounge',       type: 'voice', readOnly: false },
      { name: '🎵┃music',        type: 'voice', readOnly: false },
    ]
  },
  {
    name: '━━━━━ 🎫 TICKETS ━━━━━', staffOnly: false,
    channels: [
      { name: '🎫┃open-ticket', type: 'text', readOnly: true },
    ]
  },
  {
    name: '━━━━━ 🔐 STAFF ONLY ━━━━━', staffOnly: true,
    channels: [
      { name: '👑┃owner-only',   type: 'text' },
      { name: '⚙️┃admin-chat',   type: 'text' },
      { name: '🛡️┃mod-chat',     type: 'text' },
      { name: '🎫┃staff-chat',   type: 'text' },
      { name: '📋┃staff-orders', type: 'text' },
      { name: '📝┃staff-notes',  type: 'text' },
      { name: '📊┃staff-logs',   type: 'text' },
    ]
  },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

client.once('clientReady', async () => {
  console.log(`\n✅ Logged in as ${client.user.tag}`);
  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.channels.fetch();
  await guild.roles.fetch();
  console.log(`📡 Guild: ${guild.name}`);

  // 1. Clean up
  console.log('\n🗑️ Deleting existing channels...');
  for (const ch of guild.channels.cache.values()) {
    try { await ch.delete(); await sleep(250); } catch(e) {}
  }

  // 2. Roles
  console.log('\n👑 Recreating roles...');
  for (const r of guild.roles.cache.values()) {
    if (!r.managed && r.id !== guild.roles.everyone.id) {
      try { await r.delete(); await sleep(200); } catch(e) {}
    }
  }
  const createdRoles = {};
  for (const rd of ROLES) {
    const role = await guild.roles.create({ name: rd.name, color: rd.color, hoist: rd.hoist, permissions: rd.perms, mentionable: true });
    createdRoles[rd.name] = role;
    console.log(`  ✅ ${rd.name}`);
    await sleep(300);
  }

  // 3. Channels
  console.log('\n📂 Creating channels...');
  const staffRolesList = ['👑 Owner','⚙️ Admin','🛡️ Moderator','🎫 Support Staff'].map(n => createdRoles[n]).filter(Boolean);

  for (const cat of STRUCTURE) {
    const category = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
    console.log(`  📁 ${cat.name}`);
    await sleep(300);

    for (const ch of cat.channels) {
      const isVoice = ch.type === 'voice';
      let overwrites;

      if (cat.staffOnly) {
        overwrites = [{ id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] }];
        staffRolesList.forEach(r => overwrites.push({ id: r, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }));
      } else if (ch.readOnly) {
        overwrites = [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.SendMessages] },
          { id: guild.roles.everyone, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
        ];
        staffRolesList.forEach(r => overwrites.push({ id: r, allow: [PermissionFlagsBits.SendMessages] }));
      } else {
        overwrites = [{ id: guild.roles.everyone, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }];
      }

      const opts = { name: ch.name, type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText, parent: category.id, permissionOverwrites: overwrites };
      await guild.channels.create(opts);
      console.log(`    ✅ ${ch.name}`);
      await sleep(350);
    }
  }

  // 4. Set icon & banner
  console.log('\n🎨 Setting server assets...');
  const iconPath = path.join(__dirname, 'assets/server-icon.png');
  const bannerPath = path.join(__dirname, 'assets/server-banner.png');
  if (fs.existsSync(iconPath)) { await guild.setIcon(iconPath); console.log('  ✅ Icon set'); }
  if (fs.existsSync(bannerPath)) { try { await guild.setBanner(bannerPath); console.log('  ✅ Banner set'); } catch(e) { console.log('  ℹ️ Banner needs Boost Level 2'); } }

  // 5. Post embeds
  console.log('\n📝 Posting embeds...');
  await guild.channels.fetch();
  await postAllEmbeds(guild);

  console.log('\n🎉 Black Host server setup complete!');
  process.exit(0);
});

client.login(TOKEN);
