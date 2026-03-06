const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  AttachmentBuilder, PermissionFlagsBits, ChannelType
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const {
  GOLD, RED, GREEN, ORANGE, BLUE, DARK, SEP, SEP_THIN, footer, ts,
  buildProductEmbed, buildRulesEmbed, buildServerInfoEmbed,
  buildHowToOrderEmbed, buildPaymentEmbed, buildTicketPanelEmbed,
  buildVerifyEmbed, buildModEmbed, buildGiveawayEmbed, buildLevelUpEmbed,
  buildAnnouncementEmbed, buildDealEmbed, loadProducts,
} = require('./embeds');
const { handleOpenTicket, handleCloseTicket, handleClaimTicket, handleTranscript } = require('./tickets');
const { addXp, getUser, getLeaderboard, xpForLevel } = require('./levels');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const WARNINGS_FILE = path.join(__dirname, '../data/warnings.json');
const BANNER_PATH   = path.join(__dirname, '../assets/welcome-banner.png');

const BALLRESPONSES = [
  '✅ It is certain.','✅ It is decidedly so.','✅ Without a doubt.','✅ Yes definitely.',
  '✅ You may rely on it.','✅ As I see it, yes.','✅ Most likely.','✅ Outlook good.',
  '❓ Reply hazy, try again.','❓ Ask again later.','❓ Better not tell you now.','❓ Cannot predict now.',
  '❌ Don\'t count on it.','❌ My reply is no.','❌ My sources say no.','❌ Very doubtful.',
];

function saveProducts(d) { fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(d, null, 2)); }
function loadWarnings() { try { return JSON.parse(fs.readFileSync(WARNINGS_FILE, 'utf8')); } catch { return {}; } }
function saveWarnings(d) { fs.writeFileSync(WARNINGS_FILE, JSON.stringify(d, null, 2)); }
function isAdmin(m) { return m.permissions.has(PermissionFlagsBits.ManageGuild) || m.permissions.has(PermissionFlagsBits.Administrator); }
function findRole(guild, name) { return guild.roles.cache.find(r => r.name === name); }
function bannerFiles() { return fs.existsSync(BANNER_PATH) ? [new AttachmentBuilder(BANNER_PATH, { name: 'welcome-banner.png' })] : []; }

// ── BUTTON HANDLER ─────────────────────────────────────────────────────────────
async function handleButton(interaction) {
  const id = interaction.customId;
  if (id === 'verify')             return handleVerify(interaction);
  if (id === 'ticket_order')       return handleOpenTicket(interaction, 'order');
  if (id === 'ticket_support')     return handleOpenTicket(interaction, 'support');
  if (id === 'ticket_general')     return handleOpenTicket(interaction, 'general');
  if (id === 'ticket_close')       return handleCloseTicket(interaction);
  if (id === 'ticket_claim')       return handleClaimTicket(interaction);
  if (id === 'ticket_transcript')  return handleTranscript(interaction);
  if (id.startsWith('edit_product_'))    return showEditModal(interaction, id.replace('edit_product_',''));
  if (id.startsWith('refresh_product_')) return doRefreshProduct(interaction, id.replace('refresh_product_',''));
  if (id.startsWith('giveaway_reroll_')) return rerollGiveaway(interaction, id.replace('giveaway_reroll_',''));
}

async function handleVerify(interaction) {
  const role = findRole(interaction.guild, '✅ Verified');
  if (!role) return interaction.reply({ content: '❌ Verified role not found. Contact an admin.', ephemeral: true });
  if (interaction.member.roles.cache.has(role.id)) return interaction.reply({ content: '✅ Already verified!', ephemeral: true });
  await interaction.member.roles.add(role);
  const memberRole = findRole(interaction.guild, '👤 Member');
  if (memberRole) await interaction.member.roles.add(memberRole).catch(() => {});
  return interaction.reply({ content: '✅ **Verified!** Welcome to Black Host — you now have full access! 🎉', ephemeral: true });
}

async function showEditModal(interaction, key) {
  if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
  const products = loadProducts();
  const p = products[key]; if (!p) return interaction.reply({ content: '❌ Not found.', ephemeral: true });
  const priceText = p.prices.map(pr => `${pr.plan}=${pr.price}`).join('\n');
  const modal = new ModalBuilder().setCustomId(`modal_edit_${key}`).setTitle(`✏️ Edit: ${p.name}`);
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setValue(p.description).setRequired(true).setMaxLength(400)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('prices').setLabel('Prices (Plan Name=Price, one per line)').setStyle(TextInputStyle.Paragraph).setValue(priceText).setRequired(true).setMaxLength(800)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('note').setLabel('Delivery Note').setStyle(TextInputStyle.Short).setValue(p.note).setRequired(true).setMaxLength(200)),
  );
  await interaction.showModal(modal);
}

async function doRefreshProduct(interaction, key) {
  if (!isAdmin(interaction.member)) return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
  const ok = await refreshProductChannel(interaction.guild, key);
  return interaction.reply({ content: ok ? `✅ Refreshed **${key}**!` : '❌ Channel not found.', ephemeral: true });
}

// ── MODAL HANDLER ──────────────────────────────────────────────────────────────
async function handleModal(interaction) {
  const id = interaction.customId;
  if (id.startsWith('modal_edit_')) {
    const key = id.replace('modal_edit_', '');
    const products = loadProducts();
    if (!products[key]) return interaction.reply({ content: '❌ Not found.', ephemeral: true });
    products[key].description = interaction.fields.getTextInputValue('description');
    products[key].note        = interaction.fields.getTextInputValue('note');
    const raw = interaction.fields.getTextInputValue('prices');
    products[key].prices = raw.split('\n').filter(l => l.includes('=')).map(l => {
      const [plan, ...rest] = l.split('=');
      return { plan: plan.trim(), price: rest.join('=').trim() };
    });
    saveProducts(products);
    await refreshProductChannel(interaction.guild, key);
    return interaction.reply({ content: `✅ **${products[key].name}** updated & channel refreshed!`, ephemeral: true });
  }
}

// ── SLASH COMMAND HANDLER ──────────────────────────────────────────────────────
async function handleSlash(interaction) {
  const cmd = interaction.commandName;
  const guild = interaction.guild;

  // ── ping ──────────────────────────────────────────────────────────────────
  if (cmd === 'ping') {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = Math.floor(uptime % 60);
    const e = new EmbedBuilder().setColor(GOLD).setTitle('🏓  PING')
      .addFields(
        { name: 'Latency', value: `${interaction.client.ws.ping}ms`, inline: true },
        { name: 'Uptime', value: `${h}h ${m}m ${s}s`, inline: true },
        { name: 'Status', value: '🟢 Online', inline: true },
      ).setFooter(footer());
    return interaction.reply({ embeds: [e], ephemeral: true });
  }

  // ── help ──────────────────────────────────────────────────────────────────
  if (cmd === 'help') {
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Command Center' }).setTitle('🤖  ALL COMMANDS')
      .setDescription(`${SEP_THIN}`)
      .addFields(
        { name: '🌐  GENERAL', value: '`/ping` `/help` `/serverinfo` `/botinfo` `/userinfo` `/avatar` `/banner` `/whois`', inline: false },
        { name: '🛍️  STORE', value: '`/products` `/price` `/order` `/support` `/stock` `/invite` `/review`', inline: false },
        { name: '⬆️  LEVELING', value: '`/rank` `/leaderboard`', inline: false },
        { name: '🎲  FUN', value: '`/coinflip` `/roll` `/8ball` `/say` `/poll`', inline: false },
        { name: '🛡️  MODERATION', value: '`/warn` `/warnings` `/clearwarns` `/kick` `/ban` `/unban` `/mute` `/unmute` `/purge` `/slowmode` `/lock` `/unlock` `/nick`', inline: false },
        { name: '👑  ROLES', value: '`/add-role` `/remove-role`', inline: false },
        { name: '⚙️  ADMIN', value: '`/announce` `/deal` `/edit-product` `/refresh-embeds` `/giveaway` `/giveaway-end` `/embed` `/dm` `/addxp` `/setlevel`', inline: false },
      ).setFooter(footer());
    return interaction.reply({ embeds: [e], ephemeral: true });
  }

  // ── serverinfo ────────────────────────────────────────────────────────────
  if (cmd === 'serverinfo') {
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Server Info' }).setTitle(`🏠  ${guild.name.toUpperCase()}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: 'SERVER ID', value: guild.id, inline: true },
        { name: 'OWNER', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'MEMBERS', value: `${guild.memberCount}`, inline: true },
        { name: 'CHANNELS', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'ROLES', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'CREATED', value: `<t:${Math.floor(guild.createdTimestamp/1000)}:R>`, inline: true },
      ).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── botinfo ────────────────────────────────────────────────────────────────
  if (cmd === 'botinfo') {
    const uptime = process.uptime();
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Bot Info' }).setTitle('🤖  BOT INFORMATION')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: 'BOT NAME', value: interaction.client.user.tag, inline: true },
        { name: 'SERVERS', value: `${interaction.client.guilds.cache.size}`, inline: true },
        { name: 'COMMANDS', value: `${require('../commands/index').length}`, inline: true },
        { name: 'UPTIME', value: `${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m`, inline: true },
        { name: 'LATENCY', value: `${interaction.client.ws.ping}ms`, inline: true },
        { name: 'NODE.JS', value: process.version, inline: true },
      ).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── userinfo ──────────────────────────────────────────────────────────────
  if (cmd === 'userinfo') {
    const target = interaction.options.getMember('user') || interaction.member;
    const user   = target.user;
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  User Info' })
      .setTitle(`👤  ${user.username.toUpperCase()}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: 'USERNAME', value: user.username, inline: true },
        { name: 'DISPLAY NAME', value: target.displayName, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'JOINED SERVER', value: `<t:${Math.floor(target.joinedTimestamp/1000)}:R>`, inline: true },
        { name: 'ACCOUNT CREATED', value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true },
        { name: 'BOT?', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: 'ROLES', value: target.roles.cache.filter(r => r.name !== '@everyone').map(r => `${r}`).join(', ') || 'None' },
      ).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── avatar ────────────────────────────────────────────────────────────────
  if (cmd === 'avatar') {
    const target = interaction.options.getUser('user') || interaction.user;
    const e = new EmbedBuilder().setColor(GOLD).setTitle(`🖼️  ${target.username}'s Avatar`)
      .setImage(target.displayAvatarURL({ dynamic: true, size: 1024 })).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── banner ────────────────────────────────────────────────────────────────
  if (cmd === 'banner') {
    const target = await (interaction.options.getUser('user') || interaction.user).fetch();
    if (!target.banner) return interaction.reply({ content: '❌ This user has no banner.', ephemeral: true });
    const e = new EmbedBuilder().setColor(GOLD).setTitle(`🖼️  ${target.username}'s Banner`)
      .setImage(target.bannerURL({ dynamic: true, size: 1024 })).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── whois ─────────────────────────────────────────────────────────────────
  if (cmd === 'whois') {
    const uid = interaction.options.getString('id');
    try {
      const fetched = await interaction.client.users.fetch(uid);
      const e = new EmbedBuilder().setColor(GOLD).setTitle(`🔍  WHOIS: ${fetched.username}`)
        .setThumbnail(fetched.displayAvatarURL({ dynamic: true }))
        .addFields({ name: 'ID', value: fetched.id, inline: true }, { name: 'CREATED', value: `<t:${Math.floor(fetched.createdTimestamp/1000)}:R>`, inline: true })
        .setFooter(footer());
      return interaction.reply({ embeds: [e] });
    } catch { return interaction.reply({ content: '❌ User not found.', ephemeral: true }); }
  }

  // ── products ──────────────────────────────────────────────────────────────
  if (cmd === 'products') {
    const products = loadProducts();
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Product Catalog' }).setTitle('📦  STORE CATALOG')
      .setDescription(`All available products. Use \`/price\` for detailed pricing.\n\n${SEP_THIN}`)
      .addFields(...Object.values(products).map(p => ({ name: `${p.emoji}  ${p.name}`, value: `From **${p.prices[0]?.price || 'Ask in ticket'}**`, inline: true })))
      .setFooter({ text: 'Use /price for details  ·  Black Host' });
    return interaction.reply({ embeds: [e] });
  }

  // ── price ─────────────────────────────────────────────────────────────────
  if (cmd === 'price') {
    const key = interaction.options.getString('product');
    const e = buildProductEmbed(key);
    if (!e) return interaction.reply({ content: '❌ Product not found.', ephemeral: true });
    return interaction.reply({ embeds: [e] });
  }

  // ── order ─────────────────────────────────────────────────────────────────
  if (cmd === 'order') return handleOpenTicket(interaction, 'order');
  if (cmd === 'support') return handleOpenTicket(interaction, 'support');

  // ── stock ─────────────────────────────────────────────────────────────────
  if (cmd === 'stock') {
    const products = loadProducts();
    const e = new EmbedBuilder().setColor(GOLD).setTitle('📊  STOCK STATUS')
      .setDescription(`Current availability as of <t:${Math.floor(Date.now()/1000)}:R>\n\n${SEP_THIN}`)
      .addFields(...Object.values(products).map(p => ({ name: `${p.emoji}  ${p.name}`, value: '🟢 In Stock', inline: true })))
      .setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── invite ────────────────────────────────────────────────────────────────
  if (cmd === 'invite') {
    const e = new EmbedBuilder().setColor(GOLD).setTitle('🔗  SERVER INVITE')
      .setDescription('Share Black Host with your friends!')
      .addFields({ name: 'INVITE LINK', value: 'https://discord.gg/blackhost' }).setFooter(footer());
    return interaction.reply({ embeds: [e], ephemeral: true });
  }

  // ── review ────────────────────────────────────────────────────────────────
  if (cmd === 'review') {
    const stars  = interaction.options.getInteger('stars');
    const text   = interaction.options.getString('comment');
    const filled = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
    const reviewCh = guild.channels.cache.find(c => c.name.includes('review'));
    if (!reviewCh) return interaction.reply({ content: '❌ Reviews channel not found.', ephemeral: true });
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Customer Review' }).setTitle(`${filled}  REVIEW`)
      .setDescription(`*"${text}"*`)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .addFields({ name: 'RATING', value: `${stars}/5 ${filled}`, inline: true })
      .setFooter(footer()).setTimestamp(ts());
    await reviewCh.send({ embeds: [e] });
    return interaction.reply({ content: '✅ Your review has been posted! Thank you! 🙏', ephemeral: true });
  }

  // ── rank ──────────────────────────────────────────────────────────────────
  if (cmd === 'rank') {
    const target = interaction.options.getMember('user') || interaction.member;
    const data   = getUser(target.user.id);
    const next   = xpForLevel(data.level + 1);
    const bar    = buildProgressBar(data.xp - xpForLevel(data.level), next - xpForLevel(data.level));
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Leveling' }).setTitle(`⬆️  RANK — ${target.user.username.toUpperCase()}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'LEVEL', value: `${data.level}`, inline: true },
        { name: 'XP', value: `${data.xp}`, inline: true },
        { name: 'MESSAGES', value: `${data.messages || 0}`, inline: true },
        { name: `PROGRESS TO LV.${data.level+1}`, value: bar },
      ).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── leaderboard ───────────────────────────────────────────────────────────
  if (cmd === 'leaderboard') {
    const lb = getLeaderboard(10);
    const medals = ['🥇','🥈','🥉'];
    const lines = lb.map(u => `${medals[u.rank-1] || `**${u.rank}.**`} <@${u.userId}> — Level **${u.level}** · ${u.xp} XP`).join('\n');
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Leveling' }).setTitle('🏆  LEADERBOARD')
      .setDescription(lines || 'No data yet.').setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── coinflip ──────────────────────────────────────────────────────────────
  if (cmd === 'coinflip') {
    const result = Math.random() < 0.5 ? '🪙 **HEADS**' : '🪙 **TAILS**';
    const e = new EmbedBuilder().setColor(GOLD).setTitle('COIN FLIP').setDescription(result).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── roll ──────────────────────────────────────────────────────────────────
  if (cmd === 'roll') {
    const sides = interaction.options.getInteger('sides') || 6;
    const result = Math.floor(Math.random() * sides) + 1;
    const e = new EmbedBuilder().setColor(GOLD).setTitle(`🎲  DICE ROLL (d${sides})`).setDescription(`You rolled a **${result}**!`).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── 8ball ─────────────────────────────────────────────────────────────────
  if (cmd === '8ball') {
    const q   = interaction.options.getString('question');
    const ans = BALLRESPONSES[Math.floor(Math.random() * BALLRESPONSES.length)];
    const e = new EmbedBuilder().setColor(GOLD).setTitle('🎱  MAGIC 8-BALL')
      .addFields({ name: 'QUESTION', value: q }, { name: 'ANSWER', value: ans }).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── say ───────────────────────────────────────────────────────────────────
  if (cmd === 'say') {
    const msg = interaction.options.getString('message');
    const ch  = interaction.options.getChannel('channel') || interaction.channel;
    await ch.send(msg);
    return interaction.reply({ content: '✅ Sent!', ephemeral: true });
  }

  // ── poll ──────────────────────────────────────────────────────────────────
  if (cmd === 'poll') {
    const q = interaction.options.getString('question');
    const opts = ['option1','option2','option3','option4'].map(k => interaction.options.getString(k)).filter(Boolean);
    const emojis = ['🇦','🇧','🇨','🇩'];
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Poll' }).setTitle(`📊  ${q}`)
      .setDescription(opts.map((o, i) => `${emojis[i]}  ${o}`).join('\n\n'))
      .setFooter({ text: `Poll by ${interaction.user.username}  ·  Black Host` }).setTimestamp(ts());
    const msg = await interaction.reply({ embeds: [e], fetchReply: true });
    for (let i = 0; i < opts.length; i++) await msg.react(emojis[i]).catch(() => {});
    return;
  }

  // ── warn ──────────────────────────────────────────────────────────────────
  if (cmd === 'warn') {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');
    const warns  = loadWarnings();
    if (!warns[target.user.id]) warns[target.user.id] = [];
    warns[target.user.id].push({ reason, mod: interaction.user.tag, date: new Date().toISOString() });
    saveWarnings(warns);
    const count = warns[target.user.id].length;
    const e = buildModEmbed('warn', target, reason, interaction.user, ORANGE);
    e.addFields({ name: 'TOTAL WARNINGS', value: `${count}`, inline: true });
    await interaction.reply({ embeds: [e] });
    const dm = new EmbedBuilder().setColor(ORANGE).setTitle('⚠️  YOU HAVE BEEN WARNED').setDescription(`In **${guild.name}**`)
      .addFields({ name: 'REASON', value: reason }, { name: 'TOTAL WARNINGS', value: `${count}` }).setFooter(footer());
    await target.send({ embeds: [dm] }).catch(() => {});
    return;
  }

  // ── warnings ──────────────────────────────────────────────────────────────
  if (cmd === 'warnings') {
    const target = interaction.options.getMember('user');
    const warns  = loadWarnings();
    const list   = warns[target.user.id] || [];
    const lines  = list.length ? list.map((w, i) => `**${i+1}.** ${w.reason} *(by ${w.mod})*`).join('\n') : 'No warnings.';
    const e = new EmbedBuilder().setColor(ORANGE).setTitle(`⚠️  WARNINGS — ${target.user.username.toUpperCase()}`)
      .setDescription(lines).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── clearwarns ────────────────────────────────────────────────────────────
  if (cmd === 'clearwarns') {
    const target = interaction.options.getMember('user');
    const warns  = loadWarnings();
    delete warns[target.user.id];
    saveWarnings(warns);
    return interaction.reply({ content: `✅ Cleared all warnings for ${target}.`, ephemeral: true });
  }

  // ── kick ──────────────────────────────────────────────────────────────────
  if (cmd === 'kick') {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    await target.kick(reason);
    return interaction.reply({ embeds: [buildModEmbed('kick', target, reason, interaction.user)] });
  }

  // ── ban ───────────────────────────────────────────────────────────────────
  if (cmd === 'ban') {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    await target.ban({ reason });
    return interaction.reply({ embeds: [buildModEmbed('ban', target, reason, interaction.user)] });
  }

  // ── unban ─────────────────────────────────────────────────────────────────
  if (cmd === 'unban') {
    const uid    = interaction.options.getString('id');
    const reason = interaction.options.getString('reason') || 'No reason';
    await guild.bans.remove(uid, reason).catch(() => {});
    return interaction.reply({ content: `✅ Unbanned user \`${uid}\`.` });
  }

  // ── mute ──────────────────────────────────────────────────────────────────
  if (cmd === 'mute') {
    const target  = interaction.options.getMember('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason  = interaction.options.getString('reason') || 'No reason';
    await target.timeout(minutes * 60000, reason);
    const e = buildModEmbed('mute', target, reason, interaction.user, ORANGE);
    e.addFields({ name: 'DURATION', value: `${minutes} minute(s)`, inline: true });
    return interaction.reply({ embeds: [e] });
  }

  // ── unmute ────────────────────────────────────────────────────────────────
  if (cmd === 'unmute') {
    const target = interaction.options.getMember('user');
    await target.timeout(null);
    return interaction.reply({ embeds: [buildModEmbed('unmute', target, 'Timeout removed', interaction.user, GREEN)] });
  }

  // ── purge ─────────────────────────────────────────────────────────────────
  if (cmd === 'purge') {
    const amount = interaction.options.getInteger('amount');
    const user   = interaction.options.getMember('user');
    let msgs = await interaction.channel.messages.fetch({ limit: amount + 1 });
    if (user) msgs = msgs.filter(m => m.author.id === user.user.id);
    await interaction.channel.bulkDelete(msgs, true);
    return interaction.reply({ content: `🗑️ Deleted **${msgs.size}** messages.`, ephemeral: true });
  }

  // ── slowmode ──────────────────────────────────────────────────────────────
  if (cmd === 'slowmode') {
    const secs = interaction.options.getInteger('seconds');
    await interaction.channel.setRateLimitPerUser(secs);
    return interaction.reply({ content: `⏱️ Slowmode set to **${secs}s** ${secs === 0 ? '(disabled)' : ''}.` });
  }

  // ── lock ──────────────────────────────────────────────────────────────────
  if (cmd === 'lock') {
    await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
    return interaction.reply({ content: '🔒 Channel **locked**.' });
  }

  // ── unlock ────────────────────────────────────────────────────────────────
  if (cmd === 'unlock') {
    await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
    return interaction.reply({ content: '🔓 Channel **unlocked**.' });
  }

  // ── nick ──────────────────────────────────────────────────────────────────
  if (cmd === 'nick') {
    const target = interaction.options.getMember('user');
    const nick   = interaction.options.getString('nickname') || null;
    await target.setNickname(nick);
    return interaction.reply({ content: `✅ Nickname ${nick ? `set to **${nick}**` : 'reset'}.`, ephemeral: true });
  }

  // ── add-role ──────────────────────────────────────────────────────────────
  if (cmd === 'add-role') {
    const target   = interaction.options.getMember('user');
    const roleKey  = interaction.options.getString('role');
    const roleMap  = { customer: '🛒 Customer', vip: '💎 VIP Customer', staff: '🎫 Support Staff', mod: '🛡️ Moderator', verified: '✅ Verified' };
    const role     = findRole(guild, roleMap[roleKey]);
    if (!role) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });
    await target.roles.add(role);
    const e = new EmbedBuilder().setColor(GREEN).setDescription(`✅ Gave **${roleMap[roleKey]}** to ${target}`).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── remove-role ───────────────────────────────────────────────────────────
  if (cmd === 'remove-role') {
    const target   = interaction.options.getMember('user');
    const roleKey  = interaction.options.getString('role');
    const roleMap  = { customer: '🛒 Customer', vip: '💎 VIP Customer', staff: '🎫 Support Staff', mod: '🛡️ Moderator', verified: '✅ Verified' };
    const role     = findRole(guild, roleMap[roleKey]);
    if (!role) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });
    await target.roles.remove(role);
    const e = new EmbedBuilder().setColor(RED).setDescription(`🗑️ Removed **${roleMap[roleKey]}** from ${target}`).setFooter(footer());
    return interaction.reply({ embeds: [e] });
  }

  // ── announce ──────────────────────────────────────────────────────────────
  if (cmd === 'announce') {
    const title  = interaction.options.getString('title');
    const msg    = interaction.options.getString('message');
    const ping   = interaction.options.getString('ping') || 'none';
    const ch     = guild.channels.cache.find(c => c.name.includes('announcement'));
    if (!ch) return interaction.reply({ content: '❌ Announcements channel not found.', ephemeral: true });
    const pingTxt = ping === 'everyone' ? '@everyone' : ping === 'here' ? '@here' : '';
    const e = buildAnnouncementEmbed(title, msg, interaction.user);
    await ch.send({ content: pingTxt || undefined, embeds: [e] });
    return interaction.reply({ content: `✅ Announcement posted in ${ch}`, ephemeral: true });
  }

  // ── deal ──────────────────────────────────────────────────────────────────
  if (cmd === 'deal') {
    const title = interaction.options.getString('title');
    const desc  = interaction.options.getString('description');
    const code  = interaction.options.getString('code');
    const ch    = guild.channels.cache.find(c => c.name.includes('deal'));
    if (!ch) return interaction.reply({ content: '❌ Deals channel not found.', ephemeral: true });
    const e = buildDealEmbed(title, desc, code);
    await ch.send({ content: '@everyone', embeds: [e] });
    return interaction.reply({ content: `✅ Deal posted in ${ch}`, ephemeral: true });
  }

  // ── edit-product ──────────────────────────────────────────────────────────
  if (cmd === 'edit-product') {
    const key = interaction.options.getString('product');
    const products = loadProducts();
    const p = products[key];
    if (!p) return interaction.reply({ content: '❌ Not found.', ephemeral: true });
    const e = buildProductEmbed(key);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`edit_product_${key}`).setLabel('✏️ Edit Product').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`refresh_product_${key}`).setLabel('🔄 Refresh Channel').setStyle(ButtonStyle.Secondary),
    );
    return interaction.reply({ content: `**Preview — ${p.emoji} ${p.name}:**`, embeds: [e], components: [row], ephemeral: true });
  }

  // ── refresh-embeds ────────────────────────────────────────────────────────
  if (cmd === 'refresh-embeds') {
    await interaction.deferReply({ ephemeral: true });
    const products = loadProducts();
    let count = 0;
    for (const key of Object.keys(products)) { if (await refreshProductChannel(guild, key)) count++; }
    return interaction.editReply({ content: `✅ Refreshed **${count}** product embeds!` });
  }

  // ── giveaway ──────────────────────────────────────────────────────────────
  if (cmd === 'giveaway') {
    const prize   = interaction.options.getString('prize');
    const winners = interaction.options.getInteger('winners');
    const mins    = interaction.options.getInteger('minutes');
    const ch      = guild.channels.cache.find(c => c.name.includes('giveaway'));
    if (!ch) return interaction.reply({ content: '❌ Giveaways channel not found.', ephemeral: true });
    const e = buildGiveawayEmbed(prize, winners, mins * 60, interaction.user);
    const msg = await ch.send({ content: '@everyone', embeds: [e] });
    await msg.react('🎉');
    // schedule end
    setTimeout(async () => {
      try {
        const updated = await ch.messages.fetch(msg.id);
        const reactors = await updated.reactions.cache.get('🎉')?.users.fetch();
        const valid = reactors?.filter(u => !u.bot);
        if (!valid || valid.size === 0) {
          await ch.send({ content: '😔 No one entered the giveaway.' });
          return;
        }
        const shuffled = [...valid.values()].sort(() => Math.random() - 0.5);
        const won = shuffled.slice(0, Math.min(winners, shuffled.length));
        const endEmbed = new EmbedBuilder().setColor(GOLD).setTitle('🎉  GIVEAWAY ENDED')
          .setDescription(`**Prize:** ${prize}\n\n${SEP_THIN}\n\n**Winner(s):**\n${won.map(u => `> 🏆 ${u}`).join('\n')}`)
          .setFooter({ text: `Hosted by ${interaction.user.username}  ·  Black Host` }).setTimestamp(ts());
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway_reroll_${msg.id}`).setLabel('🔁 Reroll').setStyle(ButtonStyle.Secondary));
        await ch.send({ embeds: [endEmbed], components: [row] });
      } catch(err) { console.error('Giveaway end error:', err); }
    }, mins * 60000);
    return interaction.reply({ content: `✅ Giveaway started in ${ch}! Ends in **${mins} minute(s)**.`, ephemeral: true });
  }

  // ── giveaway-end ──────────────────────────────────────────────────────────
  if (cmd === 'giveaway-end') {
    const msgId = interaction.options.getString('message_id');
    try {
      const ch  = guild.channels.cache.find(c => c.name.includes('giveaway'));
      const msg = await ch?.messages.fetch(msgId);
      if (!msg) return interaction.reply({ content: '❌ Message not found.', ephemeral: true });
      const reactors = await msg.reactions.cache.get('🎉')?.users.fetch();
      const valid = reactors?.filter(u => !u.bot);
      if (!valid || valid.size === 0) return interaction.reply({ content: '😔 No entries.', ephemeral: true });
      const won = [...valid.values()][Math.floor(Math.random() * valid.size)];
      return interaction.reply({ content: `🎉 Giveaway ended! Winner: ${won}` });
    } catch { return interaction.reply({ content: '❌ Error ending giveaway.', ephemeral: true }); }
  }

  // ── embed ─────────────────────────────────────────────────────────────────
  if (cmd === 'embed') {
    const title  = interaction.options.getString('title');
    const desc   = interaction.options.getString('description');
    const hex    = interaction.options.getString('color') || 'C9A84C';
    const ch     = interaction.options.getChannel('channel') || interaction.channel;
    const color  = parseInt(hex.replace('#',''), 16);
    const e = new EmbedBuilder().setColor(isNaN(color) ? GOLD : color).setTitle(title).setDescription(desc).setFooter(footer()).setTimestamp(ts());
    await ch.send({ embeds: [e] });
    return interaction.reply({ content: `✅ Embed sent in ${ch}`, ephemeral: true });
  }

  // ── dm ────────────────────────────────────────────────────────────────────
  if (cmd === 'dm') {
    const target  = interaction.options.getUser('user');
    const message = interaction.options.getString('message');
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Direct Message' }).setDescription(message).setFooter(footer());
    await target.send({ embeds: [e] }).catch(() => {});
    return interaction.reply({ content: `✅ DM sent to ${target}.`, ephemeral: true });
  }

  // ── addxp ─────────────────────────────────────────────────────────────────
  if (cmd === 'addxp') {
    const target = interaction.options.getMember('user');
    const amount = interaction.options.getInteger('amount');
    const result = addXp(target.user.id, amount);
    return interaction.reply({ content: `✅ Added **${amount} XP** to ${target}. They are now **Level ${result.level}**.`, ephemeral: true });
  }

  // ── setlevel ──────────────────────────────────────────────────────────────
  if (cmd === 'setlevel') {
    const target = interaction.options.getMember('user');
    const level  = interaction.options.getInteger('level');
    const levels = require('./levels');
    const data   = levels.getUser(target.user.id);
    const xp     = levels.xpForLevel(level);
    const fs2    = require('fs');
    const lFile  = path.join(__dirname, '../data/levels.json');
    const lData  = JSON.parse(fs2.readFileSync(lFile, 'utf8'));
    lData[target.user.id] = { xp, level, messages: data.messages || 0 };
    fs2.writeFileSync(lFile, JSON.stringify(lData, null, 2));
    return interaction.reply({ content: `✅ Set ${target}'s level to **${level}**.`, ephemeral: true });
  }
}

// ── REFRESH PRODUCT CHANNEL ───────────────────────────────────────────────────
async function refreshProductChannel(guild, key) {
  const ch = guild.channels.cache.find(c => c.name.includes(key));
  if (!ch) return false;
  try {
    const msgs  = await ch.messages.fetch({ limit: 10 });
    const botMsg = msgs.find(m => m.author.bot && m.embeds.length > 0);
    const embed = buildProductEmbed(key);
    if (botMsg) await botMsg.edit({ embeds: [embed] });
    else await ch.send({ embeds: [embed] });
    return true;
  } catch(e) { console.error(`Refresh error for ${key}:`, e.message); return false; }
}

// ── GIVEAWAY REROLL ───────────────────────────────────────────────────────────
async function rerollGiveaway(interaction, msgId) {
  const ch  = interaction.channel;
  const msg = await ch.messages.fetch(msgId).catch(() => null);
  if (!msg) return interaction.reply({ content: '❌ Message not found.', ephemeral: true });
  const reactors = await msg.reactions.cache.get('🎉')?.users.fetch();
  const valid    = reactors?.filter(u => !u.bot);
  if (!valid || valid.size === 0) return interaction.reply({ content: '😔 No entries.', ephemeral: true });
  const won = [...valid.values()][Math.floor(Math.random() * valid.size)];
  return interaction.reply({ content: `🔁 Rerolled! New winner: ${won} 🎉` });
}

// ── POST ALL EMBEDS (setup/refresh) ───────────────────────────────────────────
async function postAllEmbeds(guild) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const find = kw => guild.channels.cache.find(c => c.name.includes(kw));
  const files = bannerFiles();
  const config = require('../data/config.json');

  // Rules
  const rulesCh = find('rules');
  if (rulesCh) { await rulesCh.send({ embeds: [buildRulesEmbed(config.rules)] }); await sleep(500); }

  // Server info
  const infoCh = find('server-info');
  if (infoCh) { await infoCh.send({ embeds: [buildServerInfoEmbed()] }); await sleep(500); }

  // How to order
  const orderCh = find('how-to-order');
  if (orderCh) { await orderCh.send({ embeds: [buildHowToOrderEmbed()] }); await sleep(500); }

  // Payment methods
  const paymentCh = find('payment-methods');
  if (paymentCh) { await paymentCh.send({ embeds: [buildPaymentEmbed()] }); await sleep(500); }

  // Verify
  const verifyCh = find('verify');
  if (verifyCh) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verify').setLabel('Verify Now').setStyle(ButtonStyle.Success).setEmoji('✅'),
    );
    await verifyCh.send({ embeds: [buildVerifyEmbed()], components: [row], files }); await sleep(500);
  }

  // Ticket panel
  const ticketCh = find('open-ticket');
  if (ticketCh) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_order').setLabel('New Order').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
      new ButtonBuilder().setCustomId('ticket_support').setLabel('Support').setStyle(ButtonStyle.Danger).setEmoji('🆘'),
      new ButtonBuilder().setCustomId('ticket_general').setLabel('Question').setStyle(ButtonStyle.Secondary).setEmoji('💬'),
    );
    await ticketCh.send({ embeds: [buildTicketPanelEmbed()], components: [row] }); await sleep(500);
  }

  // Products
  const products = loadProducts();
  for (const key of Object.keys(products)) {
    const ch = find(key);
    if (ch) { await ch.send({ embeds: [buildProductEmbed(key)] }); await sleep(600); }
  }

  // Welcome
  const welcomeCh = find('welcome');
  if (welcomeCh) {
    const e = new EmbedBuilder().setColor(GOLD).setAuthor({ name: 'BLACK HOST  ·  Premium Digital Store' })
      .setTitle('WELCOME TO BLACK HOST')
      .setDescription(`The #1 premium digital store on Discord.\n\nWe sell Discord Nitro, Netflix, Crunchyroll, Spotify, Xbox GamePass, Steam Games, VPNs, and much more.\n\n${SEP_THIN}`)
      .addFields(
        { name: '📋  GET STARTED', value: '> 1 ─ Verify in **#verify**\n> 2 ─ Browse products\n> 3 ─ Open a ticket to order', inline: true },
        { name: '🔥  LAUNCH OFFER', value: '> Use code `BLACKHOST10`\n> for **10% off** your first order!', inline: true },
      )
      .setImage('attachment://welcome-banner.png').setFooter(footer()).setTimestamp(ts());
    await welcomeCh.send({ embeds: [e], files }); await sleep(500);
  }

  // Announcements
  const annCh = find('announcement');
  if (annCh) {
    const e = buildAnnouncementEmbed('BLACK HOST IS NOW OPEN', 'Welcome to our premium digital store. Browse our products, verify yourself, and open a ticket to place your first order!\n\nUse code `BLACKHOST10` for **10% off** your first order.', { username: 'Black Host' });
    await annCh.send({ embeds: [e] }); await sleep(500);
  }
}

function buildProgressBar(current, max, length = 20) {
  const pct   = Math.min(current / max, 1);
  const filled = Math.round(pct * length);
  return `${'█'.repeat(filled)}${'░'.repeat(length - filled)} **${Math.round(pct * 100)}%**\n\`${current} / ${max} XP\``;
}

module.exports = { handleButton, handleModal, handleSlash, postAllEmbeds, refreshProductChannel };
