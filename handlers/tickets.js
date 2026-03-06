const {
  ChannelType, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder
} = require('discord.js');
const { buildTicketEmbed, GOLD, RED, SEP_THIN } = require('./embeds');

const openTickets = new Map(); // userId -> channelId

async function handleOpenTicket(interaction, type) {
  const userId = interaction.user.id;
  const key = `${userId}-ticket`;

  if (openTickets.has(key)) {
    const existing = interaction.guild.channels.cache.get(openTickets.get(key));
    if (existing) {
      return interaction.reply({ content: `❌ You already have an open ticket: ${existing}\nPlease close it before opening a new one.`, ephemeral: true });
    }
    openTickets.delete(key);
  }

  const guild = interaction.guild;
  const ticketCat = guild.channels.cache.find(c => c.name.toLowerCase().includes('ticket') && c.type === ChannelType.GuildCategory);
  const staffRole  = guild.roles.cache.find(r => r.name === '🎫 Support Staff');
  const adminRole  = guild.roles.cache.find(r => r.name === '⚙️ Admin');

  const prefix = type === 'order' ? 'order' : type === 'support' ? 'support' : 'question';
  const name   = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  const chName = `${prefix}-${name}`;

  const overwrites = [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
  ];
  if (staffRole) overwrites.push({ id: staffRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  if (adminRole) overwrites.push({ id: adminRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });

  const channel = await guild.channels.create({
    name: chName, type: ChannelType.GuildText,
    parent: ticketCat?.id, permissionOverwrites: overwrites,
  });
  openTickets.set(key, channel.id);

  const embed = buildTicketEmbed(type, interaction.user);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Close').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('✋ Claim').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_transcript').setLabel('📄 Transcript').setStyle(ButtonStyle.Secondary),
  );

  const staffMention = staffRole ? `${staffRole} ` : '';
  await channel.send({ content: `${interaction.user} ${staffMention}`, embeds: [embed], components: [row] });

  return interaction.reply({ content: `✅ Ticket opened: ${channel}`, ephemeral: true });
}

async function handleCloseTicket(interaction) {
  const embed = new EmbedBuilder()
    .setColor(RED)
    .setTitle('🔒  TICKET CLOSING')
    .setDescription(`Closed by ${interaction.user}\nThis channel deletes in **5 seconds**.`)
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
  for (const [k, id] of openTickets.entries()) if (id === interaction.channel.id) openTickets.delete(k);
  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

async function handleClaimTicket(interaction) {
  const adminRole = interaction.guild.roles.cache.find(r => r.name === '⚙️ Admin');
  const staffRole = interaction.guild.roles.cache.find(r => r.name === '🎫 Support Staff');
  const isStaff = interaction.member.roles.cache.has(staffRole?.id) || interaction.member.roles.cache.has(adminRole?.id) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (!isStaff) return interaction.reply({ content: '❌ Only staff can claim tickets.', ephemeral: true });
  await interaction.channel.setName(`claimed-${interaction.channel.name.slice(0, 85)}`).catch(() => {});
  return interaction.reply({ content: `✋ **${interaction.user.username}** claimed this ticket.` });
}

async function handleTranscript(interaction) {
  const messages = await interaction.channel.messages.fetch({ limit: 100 });
  const lines = [...messages.values()].reverse().map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || '[embed/attachment]'}`);
  const content = lines.join('\n');
  const { AttachmentBuilder } = require('discord.js');
  const buf = Buffer.from(content, 'utf8');
  const att = new AttachmentBuilder(buf, { name: `transcript-${interaction.channel.name}.txt` });
  return interaction.reply({ content: '📄 Transcript generated:', files: [att], ephemeral: true });
}

module.exports = { handleOpenTicket, handleCloseTicket, handleClaimTicket, handleTranscript, openTickets };
