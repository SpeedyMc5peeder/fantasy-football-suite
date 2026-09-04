const fs = require('fs');
const path = require('path');
const { postToSleeper } = require('./src/poster');
const imageClient = require('./src/imageClient');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const dfl = config.leagues.find(l => l.name === 'DFL');
const LEAGUE_ID = dfl.sleeper_league_id;
const USER_TOKEN = config.sleeper_user_token;
const EVENTS_FILE = path.join(__dirname, 'data', 'processed_events.json');

const PART_1_OPEN = `There is a distinct, tragic beauty to early September. It’s the only time of year where ten otherwise rational adults can look at a digital roster of men in spandex, convince themselves they possess the strategic mind of Bill Belichick, and voluntarily subject their blood pressure to seventeen weeks of pure agony. 

Walking into a new fantasy season is like walking into a Vegas casino at 2:00 AM with your rent money. Mathematically, nine of you are leaving this building broke, humiliated, and questioning your life choices. Yet you strut in like James Bond anyway. I’ve crunched the numbers, simulated the matchups, and calculated the exact trajectory of your impending heartbreak. The book is open. Welcome to the 2026 DFL Over/Under Gambling Manifesto.

Here is how the hierarchy shakes out for 2026:
• TIER 1: The Heavyweight Title Contenders
• TIER 2: The Dangerous Middle Class
• TIER 3: The Cellar Dwellers & Rebuild Trench

Full lines and locked picks dropping in two minutes. Get your bankrolls ready...`;

const PART_2_PICKS = `Here are your official 2026 DFL Over/Under Lines & Locked Picks:

### 🏆 TIER 1: The Heavyweight Title Contenders

Washed (Trent): Over/Under 9.5 Wins
THE PICK: OVER
Trent’s roster is downright disgusting. Justin Jefferson, Puka Nacua, Caleb Williams, Malik Nabers, and Brock Bowers. That’s not a dynasty team; that’s a Pro Bowl roster masquerading as a fantasy squad. He’s got the schedule breaks, he’s got the youth, and he’s got the firepower. Trent will spend the entire season crying in the group chat that his team is "cursed" while sleepwalking into 11 wins and a first-round bye. Lock it in.

Heisenberg’s Hitmen (Matt): Over/Under 8.5 Wins
THE PICK: OVER
The reigning champion enters 2026 with Josh Allen and Jayden Daniels leading the charge in Superflex, paired with De'Von Achane and Jonathan Taylor. Having two top-tier franchise quarterbacks in a 2QB format is like having two sets of keys to a Ferrari while everyone else is trying to hotwire a moped. Matt operates with the cold, ruthless precision of Walter White in a hazmat suit. Double-digit wins are on the menu.

I don't Gibbs a Shough (Matt James): Over/Under 8.5 Wins
THE PICK: UNDER
Jahmyr Gibbs, Amon-Ra St. Brown, and Drake London give Matt one of the most explosive, electric young cores in the entire league. But asking for nine wins in a 14-game season is a razor-thin margin. Matt guards his roster value like a dragon sleeping on a mountain of gold—trying to pry an asset away from him requires a presidential pardon and three notarized forms. While that diamond-handed discipline means he never gets fleeced, it also means he rarely makes the mid-season luxury trades that push teams over the top when bye weeks hit. Expect plenty of high-scoring fireworks, but 8.5 is just high enough to take the Under on pure mathematical discipline.

### ⚖️ TIER 2: The Dangerous Middle Class

Scott’s Totts (Dom): Over/Under 7.5 Wins
THE PICK: OVER
The commissioner has put together a genuinely terrifying offensive core: Ja'Marr Chase and A.J. Brown at receiver, anchored by Trevor Lawrence and Kyler Murray in Superflex. In a 2QB format, having two locked-in franchise signal-callers is the ultimate luxury. Dom’s schedule has some landmines, but Chase and Brown alone will steal him three or four weeks on pure 40-point explosion. Over 7.5 is the sharp play.

Poppinchunkies (Tyler): Over/Under 7.0 Wins
THE PICK: UNDER
Tyler, Tyler, Tyler. You spent the offseason talking big game in the chat, declaring you're pushing for the title and telling Lauren that she’s destined to lose to you. Then the football gods intervened: Josh Jacobs gets slapped with the Commissioner's Exempt List and faces a potential season-long suspension, turning your backfield into a smoking crater. Lauren already claimed she’s your kryptonite, and now she’s circling like a shark. Seven wins is too rich for a team that just lost its workhorse. Smash the Under.

Laces Out, Ladies (Lauren): Over/Under 6.5 Wins
THE PICK: OVER
Lauren carries the banner of Tre’s championship legacy, and her core of Bijan Robinson, Christian McCaffrey, and Jaylen Waddle is built for immediate violence. Her 14-week schedule is a brutal gauntlet, but if CMC and Bijan stay upright, this team will drag opponents into the deep water and drown them. Plus, watching her beat Tyler will be the comedy event of the season. Over.

Hands for Jobs (David): Over/Under 6.5 Wins
THE PICK: UNDER
David has Lamar Jackson, which gives him a weekly cheat code in Superflex, but the depth behind his top stars is held together with duct tape, prayers, and positive thinking. David’s roster construction reminds me of a 90s boy band reunion tour—great nostalgia, huge names from a few years ago, but the knees are creaky and nobody can hit the high notes anymore. Under.

### 💀 TIER 3: The Cellar Dwellers & Rebuild Trench

Dude, Where's Lamar? (Sam): Over/Under 6.0 Wins
THE PICK: UNDER
Sam’s team is anchored by Jalen Hurts, Bo Nix, and DK Metcalf. That’s a solid quarterback floor for Superflex, but the offensive skill positions feel like a regional accounting firm: reliable, functional, but completely devoid of explosive upside. You’re not bad enough to land the 1.01 rookie pick, but you’re not dynamic enough to crack the top four. You’re stuck in the dreaded fantasy purgatory: a dull 5-9 season. Under.

Who Dey (Tony): Over/Under 5.5 Wins
THE PICK: OVER
Tony has Patrick Mahomes and Jared Goff. In a Superflex league, having Mahomes alone guarantees you stay competitive in games you have no business winning. Tony has been wheeling and dealing like a Wall Street broker during a market crash, but with two reliable starting QBs in a 2QB format, 5.5 wins is simply too low of a bar. He sneaks over on Mahomes magic alone.

Ronin (Jason): Over/Under 5.0 Wins
THE PICK: UNDER
Jason won it all in 2024, but that championship banner is waving over a team that has clearly transitioned into a full-scale renovation. Joe Burrow and Tee Higgins are fantastic building blocks, but the rest of the roster is young, developing, and not ready for a 2026 playoff run. A brutal 14-week schedule will expedite the tank. Take the Under and prepare for the 2027 rookie draft.`;

const PART_3_CHALLENGE = `🗳️ THE COMMISSIONER'S CHALLENGE

Think you know better than the AI?

Dom is setting up an official league prediction portal to track everyone's picks on the ledger all season long. You will be submitting your locked OVER or UNDER for all 10 teams.

Winner takes the 2026 DFL Prophet Crown. Loser gets publicly roasted by JARVIS at the end-of-season banquet.

Stay tuned for the link before Week 1 kickoff!`;

async function run(dryRun = false) {
  console.log('🚀 Executing 3-Part Season Preview Post (dryRun=' + dryRun + ')...');

  let events = {};
  if (fs.existsSync(EVENTS_FILE)) {
    try { events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8')); } catch (e) {}
  }
  if (!events.seasonPreview) events.seasonPreview = [];
  if (events.seasonPreview.includes('preview_2026') && !process.argv.includes('--force')) {
    console.log('✅ Season Preview 2026 has already been posted! Skipping to prevent duplicates.');
    return;
  }
  
  // 1. Upload Clean Las Vegas Cover Graphic
  let imageMd = '';
  const cleanImg = 'preview_2026_clean.jpg';
  if (fs.existsSync(path.join(__dirname, 'images', cleanImg))) {
    console.log('🎨 Using clean Las Vegas Over/Under Cover Art (no overlapping badge)...');
    imageMd = await imageClient.pushAndGetMarkdown(cleanImg, dryRun);
  }

  // 2. Post Part 1: Graphic + Intro + Category Tiers (no teams)
  console.log('📡 [1/3] Posting Part 1 (Graphic + Intro + Tiers)...');
  const part1Content = (imageMd ? imageMd.trim() + '\n\n' : '') + PART_1_OPEN;
  await postToSleeper(USER_TOKEN, LEAGUE_ID, part1Content, dryRun, 'general', false);

  // 3. Wait 2 Minutes
  console.log('⏳ Waiting 2 minutes before dropping Part 2 (Picks)...');
  if (!dryRun) {
    await new Promise(r => setTimeout(r, 120000));
  }

  // 4. Post Part 2: All 10 Teams & Locked Picks
  console.log('📡 [2/3] Posting Part 2 (Picks)...');
  await postToSleeper(USER_TOKEN, LEAGUE_ID, PART_2_PICKS, dryRun, 'general', true);

  // 5. Wait 2 Minutes
  console.log('⏳ Waiting 2 minutes before dropping Part 3 (Challenge)...');
  if (!dryRun) {
    await new Promise(r => setTimeout(r, 120000));
  }

  // 6. Post Part 3: Commissioner's Challenge Portal Announcement
  console.log('📡 [3/3] Posting Part 3 (Commissioner Challenge)...');
  await postToSleeper(USER_TOKEN, LEAGUE_ID, PART_3_CHALLENGE, dryRun, 'general', true);

  if (!dryRun) {
    events.seasonPreview.push('preview_2026');
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
  }

  console.log('✅ All 3 parts of Season Preview successfully posted to Sleeper!');
}

const isDryRun = process.argv.includes('--dry-run');
run(isDryRun).catch(console.error);
