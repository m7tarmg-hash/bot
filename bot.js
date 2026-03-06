require('dotenv').config();
const {
  Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder, Events
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs   = require('fs');
const path = require('path');
const http = require('http');

const TOKEN    = process.env.DISCORD_TOKEN || 'MTQ3OTE5NTI3MzUyNzAzODA5OA.GOX6mo.c2m5YdJheh1UqBYWLt32BP3AWqdFKpmayzlAXg';
const GUILD_ID = '412260364697468948';
const PORT     = process.env.PORT || 3000;

const { GOLD, SEP_THIN, footer, ts } = require('./handlers/embeds');
const commands  = require('./commands/index');
const { handleButton, handleModal, handleSlash } = require('./handlers/interactions');
const { addXp, getUser }                          = require('./handlers/levels');

const BANNER_PATH = path.join(__dirname, 'assets/welcome-banner.png');

// ── Keep-alive HTTP server (for Render/Railway uptime) ────────────────────────
http.createServer((req, res) => res.end('BLACK HOST BOT — ONLINE ✅')).listen(PORT, () => {
  console.log(`🌐 Keep-alive server on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ]
});

// ── READY ──────────────────────────────────────────────────────────────────────
client.once(Events.ClientReady, async () => {
  console.log(`\n✅ BLACK HOST BOT online as ${client.user.tag}`);
  client.user.setPresence({ activities: [{ name: 'Black Host Store 🛒', type: 3 }], status: 'online' });

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
    console.log(`📡 Registered ${commands.length} slash commands`);
  } catch(e) { console.error('Slash command registration failed:', e.message); }
});

// ── MEMBER JOIN ────────────────────────────────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  // Assign member role
  const memberRole = member.guild.roles.cache.find(r => r.name === '👤 Member');
  if (memberRole) await member.roles.add(memberRole).catch(() => {});

  const welcomeCh = member.guild.channels.cache.find(c => c.name.includes('welcome'));
  if (!welcomeCh) return;

  const e = new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Welcome' })
    .setTitle(`WELCOME  ·  ${member.user.username.toUpperCase()}`)
    .setDescription(`${member} just joined **Black Host**! 🎉\n\nThe #1 premium digital store on Discord.\n\n${SEP_THIN}`)
    .addFields(
      { name: '📋  GET STARTED', value: '> 1 ─ Verify in **#verify**\n> 2 ─ Browse products\n> 3 ─ Open a ticket to order', inline: true },
      { name: '🔥  LAUNCH OFFER', value: '> Use code `BLACKHOST10`\n> for **10% off** your first order!', inline: true },
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setImage('attachment://welcome-banner.png')
    .setFooter({ text: `Member #${member.guild.memberCount}  ·  Black Host` })
    .setTimestamp(ts());

  const files = fs.existsSync(BANNER_PATH) ? [new AttachmentBuilder(BANNER_PATH, { name: 'welcome-banner.png' })] : [];
  await welcomeCh.send({ embeds: [e], files }).catch(console.error);
});

// ── XP ON MESSAGE ──────────────────────────────────────────────────────────────
const xpCooldown = new Set();
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  if (xpCooldown.has(msg.author.id)) return;
  xpCooldown.add(msg.author.id);
  setTimeout(() => xpCooldown.delete(msg.author.id), 60000); // 1 min cooldown

  const xpGain = Math.floor(Math.random() * 15) + 10; // 10–25 XP per message
  const result = addXp(msg.author.id, xpGain);

  if (result.leveledUp) {
    const { buildLevelUpEmbed } = require('./handlers/embeds');
    const generalCh = msg.guild.channels.cache.find(c => c.name.includes('general') || c.name.includes('bot-command'));
    if (generalCh) {
      await generalCh.send({ embeds: [buildLevelUpEmbed(msg.member, result.level)] }).catch(() => {});
    }
  }
});

// ── INTERACTIONS ───────────────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton())           return await handleButton(interaction);
    if (interaction.isModalSubmit())      return await handleModal(interaction);
    if (interaction.isChatInputCommand()) return await handleSlash(interaction);
  } catch(err) {
    console.error('Interaction error:', err.message);
    const payload = { content: '❌ Something went wrong. Please try again.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
});

// ── ERROR HANDLERS ─────────────────────────────────────────────────────────────
client.on('error', err => console.error('Client error:', err.message));
process.on('unhandledRejection', err => console.error('Unhandled rejection:', err?.message || err));
process.on('uncaughtException',  err => console.error('Uncaught exception:', err.message));

client.login(TOKEN);
