const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const GOLD   = 0xC9A84C;   // brushed gold
const WHITE  = 0xF5F5F5;
const RED    = 0xE53935;
const GREEN  = 0x43A047;
const ORANGE = 0xFB8C00;
const BLUE   = 0x1E88E5;
const DARK   = 0x0D0D0D;

const FOOTER_TEXT = '— BLACK HOST  ·  Premium Digital Store';
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

function footer() { return { text: FOOTER_TEXT }; }
function ts() { return new Date(); }

function loadProducts() {
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
}

// ─── BRAND LINE SEPARATOR ─────────────────────────────────────────
// Used between sections inside embeds
const SEP = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
const SEP_THIN = '────────────────────────────────';

// ─── PRODUCT EMBED ────────────────────────────────────────────────
function buildProductEmbed(productKey) {
  const products = loadProducts();
  const p = products[productKey];
  if (!p) return null;

  const priceBlock = p.prices
    .map(pr => `\`${pr.plan.padEnd(28)}\`  **${pr.price}**`)
    .join('\n');

  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Product Catalog' })
    .setTitle(`${p.emoji}  ${p.name.toUpperCase()}`)
    .setDescription(`*${p.description}*\n\n${SEP_THIN}`)
    .addFields(
      { name: '💰  PRICING', value: priceBlock },
      { name: SEP_THIN, value: `📌  ${p.note}` },
      { name: '🛒  HOW TO ORDER', value: 'Head to **#open-ticket** and click **New Order** to start.' },
    )
    .setFooter(footer())
    .setTimestamp(ts());
}

// ─── RULES EMBED ──────────────────────────────────────────────────
function buildRulesEmbed(rules) {
  const lines = rules.map((r, i) => `**${i + 1}.** ${r}`).join('\n\n');
  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Community Rules' })
    .setTitle('📜  SERVER RULES')
    .setDescription(`Read and follow every rule.\nViolations result in mutes, kicks, or permanent bans.\n\n${SEP_THIN}\n\n${lines}`)
    .setFooter(footer())
    .setTimestamp(ts());
}

// ─── WELCOME EMBED ────────────────────────────────────────────────
function buildWelcomeEmbed(member) {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setTitle(`WELCOME  ·  ${member.user.username.toUpperCase()}`)
    .setDescription(`You just joined **Black Host** — the #1 premium digital store on Discord.\n\n${SEP_THIN}`)
    .addFields(
      { name: '📋  GET STARTED', value: '> 1 ─ Verify yourself in **#verify**\n> 2 ─ Browse products in **#products**\n> 3 ─ Open a ticket to order', inline: true },
      { name: '🔥  LAUNCH OFFER', value: '> Use code `BLACKHOST10`\n> for **10% off** your first order!', inline: true },
    )
    .setImage('attachment://welcome-banner.png')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setFooter({ text: `Member #${member.guild.memberCount}  ·  Black Host` })
    .setTimestamp(ts());
}

// ─── SERVER INFO EMBED ────────────────────────────────────────────
function buildServerInfoEmbed() {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Store Information' })
    .setTitle('ℹ️  ABOUT BLACK HOST')
    .setDescription(`**Black Host** is a trusted premium digital store. We deliver fast, we deliver right.\n\n${SEP_THIN}`)
    .addFields(
      { name: '📦  CATALOG', value: '> 💜 Discord Nitro\n> 🔴 Netflix\n> 🟠 Crunchyroll\n> 🟢 Spotify Premium\n> 🎮 Xbox Game Pass\n> 🔵 Steam Games\n> 🛡️ VPN Services\n> 📱 Much more...', inline: true },
      { name: '💳  PAYMENTS', value: '> PayPal (F&F)\n> Bitcoin (BTC)\n> Ethereum (ETH)\n> USDT\n> Bank Transfer\n> Cash App', inline: true },
      { name: SEP_THIN, value: '⏱️  **Delivery:** 1–24 hours after payment\n🔒  **Guarantee:** All products legitimate & tested', inline: false },
    )
    .setFooter(footer())
    .setTimestamp(ts());
}

// ─── HOW TO ORDER EMBED ───────────────────────────────────────────
function buildHowToOrderEmbed() {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Ordering Guide' })
    .setTitle('🛒  HOW TO ORDER')
    .setDescription(`Ordering from Black Host takes less than 2 minutes.\n\n${SEP_THIN}`)
    .addFields(
      { name: 'STEP 1  ─  Browse', value: 'Check the **Products** section and note what you want and the price.' },
      { name: 'STEP 2  ─  Ticket', value: 'Go to **#open-ticket** → click **🛒 New Order** to open a private channel.' },
      { name: 'STEP 3  ─  Order', value: 'Tell staff: product, plan/duration, and your preferred payment method.' },
      { name: 'STEP 4  ─  Pay', value: 'Staff sends payment details. Pay and share your **payment screenshot**.' },
      { name: 'STEP 5  ─  Receive', value: 'Confirmed payment → product delivered within **1–24 hours**.' },
    )
    .setFooter({ text: 'Need help?  Open a support ticket  ·  Black Host' })
    .setTimestamp(ts());
}

// ─── PAYMENT METHODS EMBED ────────────────────────────────────────
function buildPaymentEmbed() {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Payments' })
    .setTitle('💳  ACCEPTED PAYMENT METHODS')
    .setDescription(`We support a wide range of methods for your convenience.\n\n${SEP_THIN}`)
    .addFields(
      { name: '🏦  TRADITIONAL', value: '> PayPal *(Friends & Family only)*\n> Bank Transfer / Wire\n> Cash App  ·  Zelle', inline: true },
      { name: '🪙  CRYPTO', value: '> Bitcoin (BTC)\n> Ethereum (ETH)\n> USDT (TRC-20 / ERC-20)\n> Litecoin (LTC)', inline: true },
      { name: SEP_THIN, value: '> ⚠️ **Never** send PayPal as Goods & Services\n> Always screenshot your payment before sending\n> All prices in **USD** unless otherwise stated', inline: false },
    )
    .setFooter(footer())
    .setTimestamp(ts());
}

// ─── TICKET EMBED ─────────────────────────────────────────────────
function buildTicketEmbed(type, user) {
  const isOrder   = type === 'order';
  const isSupport = type === 'support';
  const color = isOrder ? GOLD : isSupport ? RED : BLUE;
  const icon  = isOrder ? '🛒' : isSupport ? '🆘' : '💬';
  const title = isOrder ? 'NEW ORDER' : isSupport ? 'SUPPORT TICKET' : 'GENERAL QUESTION';
  const body  = isOrder
    ? `Hey ${user}!\n\nTell us what you want:\n> 📦 Which product?\n> 📅 Which plan / duration?\n> 💳 Preferred payment method?`
    : isSupport
    ? `Hey ${user}!\n\nDescribe your issue in detail and a staff member will assist you shortly.`
    : `Hey ${user}!\n\nAsk your question and staff will reply as soon as possible.`;

  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: `BLACK HOST  ·  ${title}` })
    .setTitle(`${icon}  ${title}`)
    .setDescription(`${body}\n\n${SEP_THIN}`)
    .addFields(
      { name: '⏱️  RESPONSE TIME', value: 'Staff typically respond within **5–30 minutes**', inline: true },
      { name: '📌  NOTE', value: 'Do not ping staff repeatedly — they will respond ASAP', inline: true },
    )
    .setFooter({ text: 'Click 🔒 Close Ticket when you are done  ·  Black Host' })
    .setTimestamp(ts());
}

// ─── TICKET PANEL EMBED ───────────────────────────────────────────
function buildTicketPanelEmbed() {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Support Center' })
    .setTitle('🎫  OPEN A TICKET')
    .setDescription(`Select a category below to open a **private ticket** with our staff.\n\n${SEP_THIN}`)
    .addFields(
      { name: '🛒  NEW ORDER', value: 'Purchase any product from our catalog', inline: true },
      { name: '🆘  SUPPORT', value: 'Help with existing order or issue', inline: true },
      { name: '💬  QUESTION', value: 'Any inquiry or general question', inline: true },
    )
    .setFooter({ text: 'A staff member will assist you shortly  ·  Black Host' })
    .setTimestamp(ts());
}

// ─── VERIFY EMBED ─────────────────────────────────────────────────
function buildVerifyEmbed() {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Verification' })
    .setTitle('🔰  VERIFY YOUR ACCOUNT')
    .setDescription(`Click the button below to verify yourself and unlock **full access** to Black Host.\n\n${SEP_THIN}`)
    .addFields(
      { name: '✅  AFTER VERIFYING YOU GET', value: '> Access to all product channels\n> Ability to open order & support tickets\n> Access to community channels & perks' },
    )
    .setImage('attachment://welcome-banner.png')
    .setFooter({ text: 'One click to verify  ·  Black Host' })
    .setTimestamp(ts());
}

// ─── MODERATION EMBEDS ────────────────────────────────────────────
function buildModEmbed(action, target, reason, mod, color = RED) {
  const icons = { ban: '🔨', kick: '👢', warn: '⚠️', mute: '🔇', unmute: '🔊', unban: '✅' };
  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: `BLACK HOST  ·  Moderation Action` })
    .setTitle(`${icons[action] || '🛡️'}  ${action.toUpperCase()}`)
    .addFields(
      { name: 'USER', value: `${target}`, inline: true },
      { name: 'MODERATOR', value: `${mod}`, inline: true },
      { name: 'REASON', value: reason || 'No reason provided', inline: false },
    )
    .setFooter(footer())
    .setTimestamp(ts());
}

// ─── GIVEAWAY EMBED ───────────────────────────────────────────────
function buildGiveawayEmbed(prize, winners, duration, host) {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Giveaway' })
    .setTitle('🎉  GIVEAWAY')
    .setDescription(`**${prize}**\n\n${SEP_THIN}\n\nReact with 🎉 to enter!`)
    .addFields(
      { name: 'WINNERS', value: `${winners}`, inline: true },
      { name: 'ENDS', value: `<t:${Math.floor(Date.now() / 1000) + duration}:R>`, inline: true },
      { name: 'HOSTED BY', value: `${host}`, inline: true },
    )
    .setFooter({ text: 'React 🎉 to enter  ·  Black Host' })
    .setTimestamp(ts());
}

// ─── LEVEL UP EMBED ───────────────────────────────────────────────
function buildLevelUpEmbed(member, level) {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setTitle(`⬆️  LEVEL UP`)
    .setDescription(`${member} reached **Level ${level}**!`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter(footer())
    .setTimestamp(ts());
}

// ─── ANNOUNCEMENT EMBED ───────────────────────────────────────────
function buildAnnouncementEmbed(title, message, author) {
  return new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: 'BLACK HOST  ·  Announcement' })
    .setTitle(`📢  ${title.toUpperCase()}`)
    .setDescription(`${message}\n\n${SEP_THIN}`)
    .setFooter({ text: `Posted by ${author.username}  ·  Black Host` })
    .setTimestamp(ts());
}

// ─── DEAL EMBED ───────────────────────────────────────────────────
function buildDealEmbed(title, description, code) {
  return new EmbedBuilder()
    .setColor(ORANGE)
    .setAuthor({ name: 'BLACK HOST  ·  Limited Deal' })
    .setTitle(`🔥  ${title.toUpperCase()}`)
    .setDescription(`${description}\n\n${SEP_THIN}`)
    .addFields(
      code ? { name: '🎟️  DISCOUNT CODE', value: `\`${code}\``, inline: true } : null,
      { name: '🛒  HOW TO USE', value: 'Mention this deal when opening a ticket!', inline: true },
    ).filter(f => f !== null)
    .setFooter({ text: 'Limited time offer  ·  Black Host' })
    .setTimestamp(ts());
}

module.exports = {
  GOLD, WHITE, RED, GREEN, ORANGE, BLUE, DARK, SEP, SEP_THIN, FOOTER_TEXT, footer, ts,
  buildProductEmbed, buildRulesEmbed, buildWelcomeEmbed, buildServerInfoEmbed,
  buildHowToOrderEmbed, buildPaymentEmbed, buildTicketEmbed, buildTicketPanelEmbed,
  buildVerifyEmbed, buildModEmbed, buildGiveawayEmbed, buildLevelUpEmbed,
  buildAnnouncementEmbed, buildDealEmbed, loadProducts,
};
