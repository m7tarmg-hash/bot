const fs = require('fs');
const path = require('path');
const LEVELS_FILE = path.join(__dirname, '../data/levels.json');

function load() {
  try { return JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf8')); }
  catch { return {}; }
}
function save(data) { fs.writeFileSync(LEVELS_FILE, JSON.stringify(data, null, 2)); }

function xpForLevel(lvl) { return lvl * lvl * 100; }
function levelFromXp(xp) { let l = 0; while (xpForLevel(l + 1) <= xp) l++; return l; }

function addXp(userId, amount) {
  const data = load();
  if (!data[userId]) data[userId] = { xp: 0, level: 0, messages: 0 };
  data[userId].xp += amount;
  data[userId].messages = (data[userId].messages || 0) + 1;
  const newLevel = levelFromXp(data[userId].xp);
  const leveledUp = newLevel > data[userId].level;
  data[userId].level = newLevel;
  save(data);
  return { leveledUp, level: newLevel, xp: data[userId].xp };
}

function getUser(userId) {
  const data = load();
  return data[userId] || { xp: 0, level: 0, messages: 0 };
}

function getLeaderboard(limit = 10) {
  const data = load();
  return Object.entries(data)
    .sort(([, a], [, b]) => b.xp - a.xp)
    .slice(0, limit)
    .map(([id, d], i) => ({ rank: i + 1, userId: id, ...d }));
}

module.exports = { addXp, getUser, getLeaderboard, xpForLevel, levelFromXp };
