# 🖤 Black Host — Ultimate Discord Store Bot

## ✅ Features
- 🎫 **Ticket system** — Order, Support & General Question tickets
- ✅ **Verification** — Button-click verification with welcome embed
- 👋 **Welcome messages** — Custom banner on member join
- 📦 **Product embeds** — All products with prices, styled beautifully
- ✏️ **Edit products with one click** — `/edit-product` shows ONLY to you
- 🔄 **Refresh embeds** — `/refresh-embeds` updates all channels
- 📣 **Announcements** — `/announce` with ping options
- 🔥 **Deals** — `/deal` posts to deals channel
- 🛡️ **Moderation** — `/kick` `/ban` `/warn` `/purge`
- 👑 **Role management** — `/add-role` `/remove-role`
- 📊 **Info commands** — `/userinfo` `/serverinfo` `/stock` `/products`
- 21 slash commands total

## 🖊️ How to Edit Products (One Click)
1. Type `/edit-product` and pick the product
2. A preview + **Edit** button appears — **only visible to you**
3. Click ✏️ **Edit This Product** — a form pops up
4. Edit description, prices, and note
5. Submit — the channel embed updates **instantly**

## 🌐 How to Host 24/7 for Free

### 🚂 Railway (Recommended — Easiest)
1. Go to [railway.app](https://railway.app) → sign up with GitHub
2. Create a new GitHub repo and upload this folder (drag & drop all files)
3. In Railway → New Project → Deploy from GitHub → pick your repo
4. Add environment variable: `DISCORD_TOKEN` = your token
5. Railway auto-deploys. Done! ✅ Free 500 hours/month

### 🎨 Render (Free)
1. Go to [render.com](https://render.com) → New → Background Worker
2. Connect GitHub repo
3. Build Command: `npm install`
4. Start Command: `node bot.js`
5. Add env var: `DISCORD_TOKEN` = your token

### 🔁 Always-free: Replit + UptimeRobot
1. Go to [replit.com](https://replit.com) → New Repl → Node.js
2. Upload files, add token as secret
3. Run the bot, then use UptimeRobot to ping it every 5 min

## ⚠️ Required: Enable Privileged Intents
[discord.com/developers](https://discord.com/developers/applications) → Your App → Bot tab:
- ✅ **SERVER MEMBERS INTENT**
- ✅ **MESSAGE CONTENT INTENT**

## 📋 All Slash Commands
| Command | Description | Who |
|---------|-------------|-----|
| `/ping` | Check latency | Everyone |
| `/help` | Show commands | Everyone |
| `/products` | List all products | Everyone |
| `/price` | Show product pricing | Everyone |
| `/order` | Open order ticket | Everyone |
| `/support` | Open support ticket | Everyone |
| `/invite` | Get invite link | Everyone |
| `/stock` | Check stock status | Everyone |
| `/userinfo` | User information | Everyone |
| `/serverinfo` | Server information | Everyone |
| `/add-role` | Give role to user | Staff |
| `/remove-role` | Remove role from user | Staff |
| `/warn` | Warn a member | Mod |
| `/kick` | Kick a member | Mod |
| `/ban` | Ban a member | Mod |
| `/purge` | Bulk delete messages | Mod |
| `/announce` | Post announcement | Admin |
| `/deal` | Post deal/sale | Admin |
| `/edit-product` | Edit product (ephemeral) | Admin |
| `/update-product` | Quick update product | Admin |
| `/refresh-embeds` | Refresh all embeds | Admin |
