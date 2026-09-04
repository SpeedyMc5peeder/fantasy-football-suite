import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The 5 DFL Seasons
const SEASONS = [
  { year: '2026', leagueId: '1326430815118163968', status: 'in_season' },
  { year: '2025', leagueId: '1180927258699984896', status: 'complete', champion: 'MattyiceR' },
  { year: '2024', leagueId: '1049032536938143744', status: 'complete', champion: 'JayZone13' },
  { year: '2023', leagueId: '919666277331877888', status: 'complete', champion: 'PoppinChunkies' },
  { year: '2022', leagueId: '818736141783109632', status: 'complete', champion: 'LMcVicker' },
];

// Mapping historical user IDs to the 10 active franchises
const USER_TO_FRANCHISE = {
  // Dom / Rhymenoceros
  '210210360165146624': 'Rhymenoceros',
  // Tyler / PoppinChunkies
  '342378135662120960': 'PoppinChunkies',
  // David / DukeofWales
  '342378125914718208': 'DukeofWales',
  // Sam / SamBaugh
  '342413053171707904': 'SamBaugh',
  // Matt / MattyiceR
  '607019506535030784': 'MattyiceR',
  // Trent / doesntfleeze / fleezus
  '601901607843602432': 'doesntfleeze',
  // Matt James / MaffuJames
  '729936180401004544': 'MaffuJames',
  // Jason / JayZone13
  '738575384441954304': 'JayZone13',
  // Tony / Tklumb86 (Inherited from Jake)
  '864234119402532864': 'Tklumb86',
  '76407602476892160': 'Tklumb86', // Jake / TakeTheCakeJake
  // Lauren / LMcVicker (Inherited from Tre)
  '342378667474796544': 'LMcVicker',
  '736461309394210816': 'LMcVicker', // Tre / AsaltySwordsman
  '998719915186118656': 'LMcVicker', // slaywithtre
};

const FRANCHISE_INFO = {
  Rhymenoceros: {
    name: 'Dom',
    username: 'Rhymenoceros',
    teamName: "Scott's Totts",
    role: 'Commissioner',
    bio: "DFL Commissioner and founder. Known for taking an eternity to draft due to haircuts ('The Barbershop Rule') and authoring Jake's emotional retirement eulogy.",
    mascot: 'War Rhinoceros',
    defaultPin: '1234',
    accentColor: '#38bdf8', // Cyan
  },
  PoppinChunkies: {
    name: 'Tyler',
    username: 'PoppinChunkies',
    teamName: 'Poppinchunkies',
    role: 'Manager',
    bio: "The undisputed DFL powerhouse (44-12, 78% win rate). Won the historic undefeated 2023 championship, which rivals jokingly call a 'Mickey Mouse ring'.",
    mascot: 'Chunky Juggernaut',
    defaultPin: '1234',
    accentColor: '#fbbf24', // Amber
  },
  MattyiceR: {
    name: 'Matt',
    username: 'MattyiceR',
    teamName: "Heisenberg's Hitmen",
    role: 'Manager',
    bio: "The reigning 2025 DFL Champion. Loud, proud, and frequently reminding everyone ('League champ btw') while demanding his official championship profile ribbon.",
    mascot: 'Hazmat Heisenberg',
    defaultPin: '1234',
    accentColor: '#34d399', // Emerald
  },
  SamBaugh: {
    name: 'Sam',
    username: 'SamBaugh',
    teamName: "Dude, Where's Lamar?",
    role: 'Manager',
    bio: "Perennial contender and top-tier trade shark. Traded for Amon-Ra St. Brown and orchestrated the Mahomes & Hurts mega-swap with Tony. Always lurking in the playoff mix.",
    mascot: 'Gunslinger QB',
    defaultPin: '1234',
    accentColor: '#a78bfa', // Purple
  },
  Tklumb86: {
    name: 'Tony',
    username: 'Tklumb86',
    teamName: 'Who Dey',
    role: 'Manager',
    bio: "Took over the franchise in 2026 from Jake (Takethecakejake), who he previously defeated in redraft. Renamed his entire QB room to '2027 picks' on the block.",
    mascot: 'Cyber Wolf',
    defaultPin: '1234',
    accentColor: '#f97316', // Orange
  },
  LMcVicker: {
    name: 'Lauren',
    username: 'LMcVicker',
    teamName: 'Laces Out, Ladies',
    role: 'Manager',
    bio: "Carries on the franchise legacy of Tre (AsaltySwordsman), the beloved 2022 inaugural Champion. Fiery competitor, connoisseur of the 'SHAME' gif, and recently traded down from 1.06.",
    mascot: 'Valkyrie Blade',
    defaultPin: '1234',
    accentColor: '#ec4899', // Pink
  },
  doesntfleeze: {
    name: 'Trent',
    username: 'doesntfleeze',
    teamName: 'Washed🫩',
    role: 'Manager',
    bio: "Self-deprecating trade cynic who always claims his team is cursed and washed. Infamously traded away Keon Coleman for the 4.06.",
    mascot: 'Washed Laundry',
    defaultPin: '1234',
    accentColor: '#94a3b8', // Slate
  },
  MaffuJames: {
    name: 'Matt James',
    username: 'MaffuJames',
    teamName: "I don't Gibbs a Shough",
    role: 'Manager',
    bio: "Trade enthusiast and meme maestro. Famous for entering chat debates with 'wanna be where the people are' and reminding the commish about the legendary Bitcoin payout.",
    mascot: 'Meme Maestro',
    defaultPin: '1234',
    accentColor: '#eab308', // Yellow
  },
  JayZone13: {
    name: 'Jason',
    username: 'JayZone13',
    teamName: 'Ronin',
    role: 'Manager',
    bio: "The 2024 DFL Champion. Survived regular season turbulence to orchestrate one of the most incredible Cinderella playoff runs in league history.",
    mascot: 'Shadow Ronin',
    defaultPin: '1234',
    accentColor: '#ef4444', // Red
  },
  DukeofWales: {
    name: 'David',
    username: 'DukeofWales',
    teamName: 'Hands for Jobs',
    role: 'Manager',
    bio: "Basement dweller by record, king by vibes. Famous for escaping to the Philippines during key league drafts and executing the Keon Coleman heist for a 4.06.",
    mascot: 'Island Wanderer',
    defaultPin: '1234',
    accentColor: '#06b6d4', // Sky blue
  },
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.json();
}

async function main() {
  console.log('🚀 Starting Sleeper historical extraction for DFL...');

  const franchiseStats = {};
  for (const [fKey, info] of Object.entries(FRANCHISE_INFO)) {
    franchiseStats[fKey] = {
      ...info,
      allTime: {
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        highScore: 0,
        lowScore: 9999,
        championships: 0,
        runnerUps: 0,
        playoffAppearances: 0,
      },
      yearlyFinishes: {},
      avatar: null,
    };
  }

  const rivalries = {};
  for (const f1 of Object.keys(FRANCHISE_INFO)) {
    rivalries[f1] = {};
    for (const f2 of Object.keys(FRANCHISE_INFO)) {
      if (f1 !== f2) {
        rivalries[f1][f2] = {
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          matchups: [],
        };
      }
    }
  }

  const allTimeGames = [];
  const seasonsData = [];

  for (const season of SEASONS) {
    console.log(`\n📦 Processing Season ${season.year} (${season.leagueId})...`);
    
    // 1. Fetch Users
    const users = await fetchJson(`https://api.sleeper.app/v1/league/${season.leagueId}/users`);
    users.forEach(u => {
      const franchiseKey = USER_TO_FRANCHISE[u.user_id];
      if (franchiseKey && u.avatar && !franchiseStats[franchiseKey].avatar) {
        franchiseStats[franchiseKey].avatar = `https://sleepercdn.com/avatars/thumbs/${u.avatar}`;
      }
    });

    // 2. Fetch Rosters
    const rosters = await fetchJson(`https://api.sleeper.app/v1/league/${season.leagueId}/rosters`);
    const rosterToFranchise = {};
    rosters.forEach(r => {
      const fKey = USER_TO_FRANCHISE[r.owner_id];
      if (fKey) {
        rosterToFranchise[r.roster_id] = fKey;
      }
    });

    // 3. Fetch Playoff Brackets
    let winnersBracket = [];
    let losersBracket = [];
    try {
      winnersBracket = await fetchJson(`https://api.sleeper.app/v1/league/${season.leagueId}/winners_bracket`);
      losersBracket = await fetchJson(`https://api.sleeper.app/v1/league/${season.leagueId}/losers_bracket`);
    } catch (e) {
      console.warn(`Bracket fetch notice for ${season.year}:`, e.message);
    }

    // 4. Fetch Matchups (Weeks 1 to 17)
    for (let week = 1; week <= 17; week++) {
      try {
        const weekMatchups = await fetchJson(`https://api.sleeper.app/v1/league/${season.leagueId}/matchups/${week}`);
        if (!weekMatchups || weekMatchups.length === 0) continue;

        const groups = {};
        for (const m of weekMatchups) {
          if (!m.matchup_id) continue;
          if (!groups[m.matchup_id]) groups[m.matchup_id] = [];
          groups[m.matchup_id].push(m);
        }

        for (const [mId, teamMatchups] of Object.entries(groups)) {
          if (teamMatchups.length === 2) {
            const [t1, t2] = teamMatchups;
            const f1 = rosterToFranchise[t1.roster_id];
            const f2 = rosterToFranchise[t2.roster_id];
            if (!f1 || !f2) continue;

            const pts1 = Number((t1.points || 0).toFixed(2));
            const pts2 = Number((t2.points || 0).toFixed(2));

            if (pts1 > 0 || pts2 > 0) {
              if (pts1 > franchiseStats[f1].allTime.highScore) franchiseStats[f1].allTime.highScore = pts1;
              if (pts1 < franchiseStats[f1].allTime.lowScore && pts1 > 0) franchiseStats[f1].allTime.lowScore = pts1;
              if (pts2 > franchiseStats[f2].allTime.highScore) franchiseStats[f2].allTime.highScore = pts2;
              if (pts2 < franchiseStats[f2].allTime.lowScore && pts2 > 0) franchiseStats[f2].allTime.lowScore = pts2;

              const gameObj = {
                year: season.year,
                week,
                team1: f1,
                pts1,
                team2: f2,
                pts2,
                margin: Number(Math.abs(pts1 - pts2).toFixed(2)),
                winner: pts1 > pts2 ? f1 : pts2 > pts1 ? f2 : 'TIE',
              };

              allTimeGames.push(gameObj);

              if (pts1 > pts2) {
                rivalries[f1][f2].wins++;
                rivalries[f2][f1].losses++;
              } else if (pts2 > pts1) {
                rivalries[f2][f1].wins++;
                rivalries[f1][f2].losses++;
              } else {
                rivalries[f1][f2].ties++;
                rivalries[f2][f1].ties++;
              }

              rivalries[f1][f2].pointsFor += pts1;
              rivalries[f1][f2].pointsAgainst += pts2;
              rivalries[f2][f1].pointsFor += pts2;
              rivalries[f2][f1].pointsAgainst += pts1;

              rivalries[f1][f2].matchups.push(gameObj);
              rivalries[f2][f1].matchups.push(gameObj);
            }
          }
        }
      } catch (err) {
        // week absent or in future
      }
    }

    // 5. Standings from rosters
    const seasonStandings = rosters
      .filter(r => rosterToFranchise[r.roster_id])
      .map(r => {
        const fKey = rosterToFranchise[r.roster_id];
        const wins = r.settings?.wins || 0;
        const losses = r.settings?.losses || 0;
        const ties = r.settings?.ties || 0;
        const pf = Number(((r.settings?.fpts || 0) + (r.settings?.fpts_decimal || 0) / 100).toFixed(2));
        const pa = Number(((r.settings?.fpts_against || 0) + (r.settings?.fpts_against_decimal || 0) / 100).toFixed(2));

        franchiseStats[fKey].allTime.wins += wins;
        franchiseStats[fKey].allTime.losses += losses;
        franchiseStats[fKey].allTime.ties += ties;
        franchiseStats[fKey].allTime.pointsFor += pf;
        franchiseStats[fKey].allTime.pointsAgainst += pa;

        return {
          franchiseKey: fKey,
          name: franchiseStats[fKey].name,
          teamName: franchiseStats[fKey].teamName,
          wins,
          losses,
          ties,
          pf,
          pa,
          winPct: (wins + losses) > 0 ? Number((wins / (wins + losses)).toFixed(3)) : 0,
        };
      })
      .sort((a, b) => b.wins - a.wins || b.pf - a.pf);

    seasonStandings.forEach((st, idx) => {
      franchiseStats[st.franchiseKey].yearlyFinishes[season.year] = {
        rank: idx + 1,
        wins: st.wins,
        losses: st.losses,
        pf: st.pf,
      };
    });

    if (season.champion && franchiseStats[season.champion]) {
      franchiseStats[season.champion].allTime.championships++;
    }

    seasonsData.push({
      year: season.year,
      leagueId: season.leagueId,
      status: season.status,
      champion: season.champion || null,
      standings: seasonStandings,
      winnersBracket,
      losersBracket,
    });
  }

  // Superlatives
  const highestScores = [
    ...allTimeGames.map(g => ({ team: g.team1, pts: g.pts1, vs: g.team2, year: g.year, week: g.week })),
    ...allTimeGames.map(g => ({ team: g.team2, pts: g.pts2, vs: g.team1, year: g.year, week: g.week })),
  ].sort((a, b) => b.pts - a.pts).slice(0, 8);

  const lowestScores = [
    ...allTimeGames.map(g => ({ team: g.team1, pts: g.pts1, vs: g.team2, year: g.year, week: g.week })),
    ...allTimeGames.map(g => ({ team: g.team2, pts: g.pts2, vs: g.team1, year: g.year, week: g.week })),
  ].filter(g => g.pts > 0).sort((a, b) => a.pts - b.pts).slice(0, 8);

  const biggestBlowouts = [...allTimeGames].sort((a, b) => b.margin - a.margin).slice(0, 8);
  const closestNailbiters = [...allTimeGames].sort((a, b) => a.margin - b.margin).slice(0, 8);

  for (const fKey of Object.keys(franchiseStats)) {
    const at = franchiseStats[fKey].allTime;
    at.pointsFor = Number(at.pointsFor.toFixed(2));
    at.pointsAgainst = Number(at.pointsAgainst.toFixed(2));
    at.winPct = (at.wins + at.losses) > 0 ? Number((at.wins / (at.wins + at.losses)).toFixed(3)) : 0;
    if (at.lowScore === 9999) at.lowScore = 0;
  }

  for (const f1 of Object.keys(rivalries)) {
    for (const f2 of Object.keys(rivalries[f1])) {
      rivalries[f1][f2].pointsFor = Number(rivalries[f1][f2].pointsFor.toFixed(2));
      rivalries[f1][f2].pointsAgainst = Number(rivalries[f1][f2].pointsAgainst.toFixed(2));
    }
  }

  const masterData = {
    generatedAt: new Date().toISOString(),
    franchises: franchiseStats,
    rivalries,
    seasons: seasonsData,
    records: {
      highestScores,
      lowestScores,
      biggestBlowouts,
      closestNailbiters,
    },
    champions: [
      {
        year: '2025',
        franchise: 'MattyiceR',
        owner: 'Matt',
        team: "Heisenberg's Hitmen",
        tagline: 'Reigning Champ & Proud Ribbon Holder',
        record: '33-23 All-Time',
      },
      {
        year: '2024',
        franchise: 'JayZone13',
        owner: 'Jason',
        team: 'Ronin',
        tagline: 'The Legendary Cinderella Underdog Title',
        record: '21-35 All-Time',
      },
      {
        year: '2023',
        franchise: 'PoppinChunkies',
        owner: 'Tyler',
        team: 'Poppinchunkies',
        tagline: 'The Undefeated Powerhouse Run',
        record: '44-12 All-Time',
      },
      {
        year: '2022',
        franchise: 'LMcVicker',
        owner: 'Tre (AsaltySwordsman)',
        team: 'Team Pupinsuds',
        tagline: 'Inaugural Champion — In Loving Memory of Tre',
        record: 'Inaugural Title',
      },
    ],
  };

  const outDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, 'dfl_master_data.json'), JSON.stringify(masterData, null, 2));
  console.log(`\n✅ Successfully generated dfl_master_data.json at ${path.join(outDir, 'dfl_master_data.json')}!`);
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
