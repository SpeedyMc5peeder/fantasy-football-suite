# 🚀 JARVIS Background Hosting Guide (PM2)

This guide explains how to run JARVIS continuously in the background of your laptop. This allows JARVIS to scan the Sleeper league every 2 minutes without you needing to keep a terminal window open!

## Step 1: Install PM2
PM2 is a tiny process manager that runs Node.js scripts silently in the background. Open PowerShell and run this command to install it globally on your laptop:
```powershell
npm install -g pm2
```

## Step 2: Navigate to the JARVIS Folder
If you aren't already there, point your terminal to the JARVIS code folder:
```powershell
cd C:\Users\dommy\OneDrive\Documents\AntiGravity\FantasyFootball\JARVIS
```

## Step 3: Start the 2-Minute Background Daemon
Tell PM2 to start the bot with our special `--watch` flag. This flag tells the script to enter its 2-minute polling loop instead of shutting down.
```powershell
pm2 start index.js --name "sleeper-bot" "--" --check-transactions --watch
```
*Done! You can now safely close the PowerShell window. As long as your laptop is awake, JARVIS will scan the league every 2 minutes.*

---

## 🛠️ How to Manage the Bot Once It's Running

### See What the Bot is Doing
Because PM2 runs invisibly, you won't see it printing text to your screen. If you want to "peek behind the curtain" and read the live logs to see what JARVIS is currently thinking, open a terminal and run:
```powershell
pm2 logs sleeper-bot
```
*(Press `Ctrl + C` when you are done reading the logs to exit the log viewer; the bot will safely keep running).*

### Check if the Bot is Online
To see a list of all your running background scripts and their status:
```powershell
pm2 list
```

### Turn the Bot Off
If the fantasy football season ends, or you just want to silence JARVIS for a bit:
```powershell
pm2 stop sleeper-bot
```

### Restart the Bot
If you ever edit the code or want to give JARVIS a quick reboot:
```powershell
pm2 restart sleeper-bot
```
