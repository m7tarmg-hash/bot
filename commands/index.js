const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const PRODUCT_CHOICES = [
  { name: '💜 Discord Nitro',  value: 'discord-nitro' },
  { name: '🔴 Netflix',        value: 'netflix' },
  { name: '🟠 Crunchyroll',    value: 'crunchyroll' },
  { name: '🟢 Spotify',        value: 'spotify' },
  { name: '🎮 Xbox Game Pass', value: 'xbox-gamepass' },
  { name: '🔵 Steam Games',    value: 'steam-games' },
  { name: '🛡️ VPN Services',   value: 'vpn-services' },
  { name: '📱 Other Products', value: 'other-products' },
];
const ROLE_CHOICES = [
  { name: '🛒 Customer',       value: 'customer' },
  { name: '💎 VIP Customer',   value: 'vip' },
  { name: '🎫 Support Staff',  value: 'staff' },
  { name: '🛡️ Moderator',      value: 'mod' },
  { name: '✅ Verified',       value: 'verified' },
];

const cmds = [
  // ── INFO & UTILITY ────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency and uptime'),
  new SlashCommandBuilder().setName('help').setDescription('Show all commands and categories'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Display server statistics'),
  new SlashCommandBuilder().setName('botinfo').setDescription('Display bot information'),
  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get detailed info about a user')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)),
  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Get a user's full avatar")
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)),
  new SlashCommandBuilder()
    .setName('banner')
    .setDescription("Get a user's profile banner")
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)),
  new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Look up a user by ID')
    .addStringOption(o => o.setName('id').setDescription('User ID').setRequired(true)),

  // ── STORE ────────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName('products').setDescription('Browse all products in the store'),
  new SlashCommandBuilder()
    .setName('price')
    .setDescription('Check pricing for a specific product')
    .addStringOption(o => o.setName('product').setDescription('Product name').setRequired(true).addChoices(...PRODUCT_CHOICES)),
  new SlashCommandBuilder().setName('order').setDescription('Open a new order ticket'),
  new SlashCommandBuilder().setName('support').setDescription('Open a support ticket'),
  new SlashCommandBuilder().setName('stock').setDescription('View current product stock status'),
  new SlashCommandBuilder().setName('invite').setDescription('Get the server invite link'),
  new SlashCommandBuilder()
    .setName('review')
    .setDescription('Leave a review for your purchase')
    .addIntegerOption(o => o.setName('stars').setDescription('Rating 1–5').setRequired(true).setMinValue(1).setMaxValue(5))
    .addStringOption(o => o.setName('comment').setDescription('Your review comment').setRequired(true)),

  // ── LEVELING ─────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your level and XP')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Show top 10 most active members'),

  // ── FUN ───────────────────────────────────────────────────────────────────
  new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin — heads or tails?'),
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a dice')
    .addIntegerOption(o => o.setName('sides').setDescription('Number of sides (default: 6)').setRequired(false).setMinValue(2).setMaxValue(1000)),
  new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(o => o.setName('question').setDescription('Your question').setRequired(true)),
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('[Staff] Make the bot say something')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName('message').setDescription('What to say').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send in').setRequired(false)),
  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('[Staff] Create a quick poll')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption(o => o.setName('option3').setDescription('Option 3').setRequired(false))
    .addStringOption(o => o.setName('option4').setDescription('Option 4').setRequired(false)),

  // ── MODERATION ────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('[Mod] Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for warning').setRequired(true)),
  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('[Mod] View warnings for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)),
  new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('[Mod] Clear all warnings for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('[Mod] Kick a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('[Mod] Ban a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('[Mod] Unban a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName('id').setDescription('User ID to unban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('[Mod] Timeout (mute) a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('[Mod] Remove timeout from a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true)),
  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('[Mod] Bulk delete messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('Number to delete (1–100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('user').setDescription('Delete only from this user').setRequired(false)),
  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('[Mod] Set channel slowmode')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o => o.setName('seconds').setDescription('Seconds (0 = off)').setRequired(true).setMinValue(0).setMaxValue(21600)),
  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('[Mod] Lock a channel (no one can type)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('[Mod] Unlock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName('nick')
    .setDescription('[Mod] Change a member\'s nickname')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o => o.setName('nickname').setDescription('New nickname (blank to reset)').setRequired(false)),

  // ── ROLES ─────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('add-role')
    .setDescription('[Staff] Give a role to a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o => o.setName('role').setDescription('Role to assign').setRequired(true).addChoices(...ROLE_CHOICES)),
  new SlashCommandBuilder()
    .setName('remove-role')
    .setDescription('[Staff] Remove a role from a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o => o.setName('role').setDescription('Role to remove').setRequired(true).addChoices(...ROLE_CHOICES)),

  // ── ADMIN / STORE MANAGEMENT ──────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('[Admin] Send a styled announcement')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Content').setRequired(true))
    .addStringOption(o => o.setName('ping').setDescription('Who to ping').setRequired(false)
      .addChoices({ name: '@everyone', value: 'everyone' }, { name: '@here', value: 'here' }, { name: 'No ping', value: 'none' })),
  new SlashCommandBuilder()
    .setName('deal')
    .setDescription('[Admin] Post a deal to the deals channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('title').setDescription('Deal title').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Deal details').setRequired(true))
    .addStringOption(o => o.setName('code').setDescription('Discount code').setRequired(false)),
  new SlashCommandBuilder()
    .setName('edit-product')
    .setDescription('[Admin] Edit a product embed (ephemeral edit panel)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('product').setDescription('Product to edit').setRequired(true).addChoices(...PRODUCT_CHOICES)),
  new SlashCommandBuilder()
    .setName('refresh-embeds')
    .setDescription('[Admin] Refresh all product & info embeds')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('[Admin] Start a giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('prize').setDescription('What are you giving away?').setRequired(true))
    .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(10))
    .addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(10080)),
  new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('[Admin] End a giveaway early by message ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('message_id').setDescription('Message ID of the giveaway').setRequired(true)),
  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('[Admin] Send a custom embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('title').setDescription('Embed title').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Embed description').setRequired(true))
    .addStringOption(o => o.setName('color').setDescription('Color hex e.g. C9A84C').setRequired(false))
    .addChannelOption(o => o.setName('channel').setDescription('Where to send it').setRequired(false)),
  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('[Admin] Send a DM to a user from the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Message to send').setRequired(true)),
  new SlashCommandBuilder()
    .setName('addxp')
    .setDescription('[Admin] Manually add XP to a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('XP amount').setRequired(true).setMinValue(1)),
  new SlashCommandBuilder()
    .setName('setlevel')
    .setDescription('[Admin] Set a user\'s level')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addIntegerOption(o => o.setName('level').setDescription('Level to set').setRequired(true).setMinValue(0)),
];

module.exports = cmds.map(c => c.toJSON());
