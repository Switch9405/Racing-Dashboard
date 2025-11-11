const driverheaderUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1266790449";
const driverstatisticsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1147657149";

const escapeHTML = str =>
  str.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

function getDriverFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const driverName = urlParams.get('driver');
  if (driverName) {
    document.body.dataset.driverName = decodeURIComponent(driverName);
  }
}

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, '').trim();
}

async function loadDriverHeaderBlock() {
  try {
    const response = await fetch(driverheaderUrl);
    const csvText = await response.text();
    const rows = csvText.trim().split("\n").map(row => row.split(","));

    const driverName = document.body.getAttribute("data-driver-name")?.trim().toLowerCase();
    if (!driverName) return;

    const columnIndex = {
      DRIVER_FULL_NAME: 9,
      DRIVER_FIRST_NAME: 10,
      DRIVER_LAST_NAME: 11,
      DRIVER_TEAM: 12,
      DRIVER_NUMBER: 13,
      TEAM_NAME: 0,
      TEAM_COLOUR_2: 2,
    };

    const teamRacingSuits = {
      "Apex Dynamics": "https://i.postimg.cc/1tSfG87W/Team01-Suit.png",
      "Pinecrest Motorsports": "https://i.postimg.cc/nrRrf0F5/Team03-Suit.png",
      "Whiteline Racing": "https://i.postimg.cc/3NJNqPTm/Team02-Suit.png",
      "Retired": "https://i.postimg.cc/432Fqs5v/Retired-Suit.png"
    };

    const driverImageMap = {
      "thomas davis": "https://i.postimg.cc/VsDdtLqR/Tom.png",
      "byron fourie": "https://i.postimg.cc/2yzLD14q/Byron.png",
      "tim harms": "https://i.postimg.cc/vmHtzG8M/Tim.png",
      "doug johnson": "https://i.postimg.cc/65p4bGWg/Doug.png",
      "iain davis": "https://i.postimg.cc/ZYcyLLS6/Iain.png",
      "ivar holsvik": "https://i.postimg.cc/vTWnyK83/Ivar.png",
      "mechiel couvaras": "https://i.postimg.cc/Gt0DZRR4/Mechiel.png",
      "mj schmaltz": "https://i.postimg.cc/Y9rwrGxg/MJ.png",
      "lance roux": "https://i.postimg.cc/vZp1mqrw/Lance.png",
      "bryan schmaltz": "https://i.postimg.cc/nr0jcnk3/Bryan.png",
      "keaghan brown": "https://i.postimg.cc/DwWJnkbc/Keaghan.png",
      "bronwyn davis": "https://i.postimg.cc/cJMSGMf0/Bronwyn.png",
      "matt sansom": "https://i.postimg.cc/y6FTkW3v/Matt.png",
      "dylan mayer": "https://i.postimg.cc/d3pkcXSx/Dylan.png",
      "sam bartlett": "https://i.postimg.cc/DzJnKwnT/Sam.png",
      "shaun baard": "https://i.postimg.cc/bv78Yfw2/Shaun.png"
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fullName = `${row[columnIndex.DRIVER_FIRST_NAME]} ${row[columnIndex.DRIVER_LAST_NAME]}`.toLowerCase();

      if (normalize(fullName) === normalize(driverName)) {
        const driverTeamName = row[columnIndex.DRIVER_TEAM]?.trim();
        const imageUrl = driverImageMap[fullName];
        const suitImage = teamRacingSuits[driverTeamName] || ""; // ✅ suit based on team name
        let teamColour2 = "#ccc"; // default

        // 🔍 Look up team colour2
        for (let j = 1; j < rows.length; j++) {
          const teamRow = rows[j];
          const teamName = teamRow[columnIndex.TEAM_NAME]?.trim();
          if (teamName && teamName.toLowerCase() === driverTeamName?.toLowerCase()) {
            teamColour2 = teamRow[columnIndex.TEAM_COLOUR_2]?.trim() || "#ccc";
            break;
          }
        }

        const blockHTML = `
          <div class="driver-block" style="
            background-image: url('https://i.postimg.cc/C5ZXwyWj/Driver-Background-Mask.png');
            background-repeat: no-repeat;
            background-size: cover;
            background-position: center;
          ">
            <div class="driver-info-left">
              <div class="driver-first-name">${escapeHTML(row[columnIndex.DRIVER_FIRST_NAME])}</div>
              <div class="driver-last-name">${escapeHTML(row[columnIndex.DRIVER_LAST_NAME])}</div>
              <div class="driver-team">${escapeHTML(driverTeamName)}</div>
              <div class="driver-number">${escapeHTML(row[columnIndex.DRIVER_NUMBER])}</div>
            </div>
            <div class="header-image-right">
              <div class="header-image-stack">
                ${suitImage ? `<img src="${suitImage}" alt="${escapeHTML(driverTeamName)} Suit" class="team-suit">` : ""}
                ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHTML(fullName)}" class="driver-image">` : ""}
              </div>
            </div>
          </div>
        `;

        const container = document.getElementById("driver-header");
        if (container) {
          container.innerHTML = blockHTML;
        }

        break;
      }
    }
  } catch (err) {
    console.error("❌ Failed to load driver header block:", err);
  }
}

function navigateToDriver(driverName) {
  window.location.href = `IndividualDriver.html?driver=${driverName}`;
}

function toOrdinal(n) {
  n = parseInt(n, 10);
  if (isNaN(n)) return n;
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

async function loadDriverStats() {
  try {
    const driverName = document.body.dataset.driverName;
    if (!driverName) throw new Error("Driver name not specified in data-driver-name.");

    const response = await fetch(driverstatisticsUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    const delimiter = rows[0].includes('\t') ? '\t' : ',';
    const headers = rows[0].split(delimiter).map(h => h.trim());

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(delimiter).map(c => escapeHTML(c.trim()));
      const driver = cols[0];

      if (driver.toLowerCase() === driverName.toLowerCase()) {
        const seasonStats = {
          SeasonPosition: cols[1],
          SeasonPoints: cols[2],
        };

        const sprintStats = {
          SprintRaces: cols[3], SprintPoints: cols[4], SprintWins: cols[5], SprintPodiums: cols[6], SprintPoles: cols[7], SprintFastestLaps: cols[8]
        };

        const multiclassStats = {
          MulticlassRaces: cols[9], MulticlassPoints: cols[10], MulticlassWins: cols[11], MulticlassPodiums: cols[12], MulticlassPoles: cols[13], MulticlassFastestLaps: cols[14]
        };

        const featureStats = {
          FeatureRaces: cols[15], FeaturePoints: cols[16], FeatureWins: cols[17], FeaturePodiums: cols[18], FeaturePoles: cols[19], FeatureFastestLaps: cols[20]
        };

        const careerStats = {
          RacesEntered: cols[21],
          CareerPoints: cols[22],
          HighestRaceFinish: `${toOrdinal(cols[23])} ( x${cols[24]} )`,
          Wins: cols[25],
          Podiums: cols[26],
          HighestGridPosition: `${toOrdinal(cols[27])} ( x${cols[28]} )`,
          PolePositions: cols[29],
          DriverChampionships: cols[30],
          TeamChampionships: cols[31]
        };

        renderDriverStats(driverName, seasonStats, sprintStats, multiclassStats, featureStats, careerStats);
        break;
      }
    }

    document.getElementById('loading-spinner-race-calendar').style.display = 'none';
  } catch (error) {
    console.error('Failed to load driver stats:', error);
    document.querySelector('#driver-stats').innerHTML = '<div class="error">Failed to load driver stats.</div>';
  }
}



function renderDriverStats(driverName, seasonStats, sprintStats, multiclassStats, featureStats, careerStats) {
  const container = document.getElementById('driver-stats');

  const createStatDivs = (titleOrStatsObj, maybeStatsObj) => {
    const hasTitle = typeof maybeStatsObj !== 'undefined';
    const statsObj = hasTitle ? maybeStatsObj : titleOrStatsObj;
    const title = hasTitle ? titleOrStatsObj : null;

    // ✅ Trophy and medal image URLs
    const trophyImg = 'https://i.postimg.cc/R067fssD/Drivers-Trophy.png';
    const medalImg = 'https://i.postimg.cc/HWwVNsqp/Teams-Medal.png';

    // ✅ Build trophy + medal icons if applicable
    let awardIcons = '';
    const driverCount = parseInt(statsObj.DriverChampionships, 10) || 0;
    const teamCount = parseInt(statsObj.TeamChampionships, 10) || 0;

    if (driverCount > 0 || teamCount > 0) {
      const trophies = Array.from({ length: driverCount }, () =>
        `<img src="${trophyImg}" alt="Driver Trophy" class="award-icon">`
      ).join('');

      const medals = Array.from({ length: teamCount }, () =>
        `<img src="${medalImg}" alt="Team Medal" class="award-icon">`
      ).join('');

      awardIcons = `
        <div class="award-container">
          ${trophies}
          ${medals}
        </div>
      `;
    }

    return `
      <div class="stat-block">
        ${title ? `<h3>${title}</h3>` : ''}
        <div class="stat-grid">
          ${Object.entries(statsObj).map(([key, val]) => `
            <div class="stat-row">
              <div class="stat-label">${key.replace(/([a-z])([A-Z])/g, '$1 $2')}</div>
              <div class="stat-value">${val}</div>
            </div>
          `).join('')}
        </div>
        ${awardIcons} <!-- 🏆🥇 Awards appear here -->
      </div>
    `;
  };

  // ✅ Final layout
  container.innerHTML = `
    <div class="stats-container">
      <div class="stats-columns">
        <div class="season-stats">${createStatDivs("CURRENT SEASON", seasonStats)}</div>
        <div class="sprint-stats">${createStatDivs(sprintStats)}</div>
        <div class="multiclass-stats">${createStatDivs(multiclassStats)}</div>
        <div class="feature-stats">${createStatDivs(featureStats)}</div>
      </div>
      <div class="career-column">
        ${createStatDivs("CAREER STATS", careerStats)}
      </div>
    </div>
  `;
}

// Prevent scrollbar flash
document.body.classList.add('hide-scrollbar');

// Wait for all data to be loaded before re-enabling scroll
Promise.all([
  getDriverFromURL(),
  loadDriverHeaderBlock(),
  loadDriverStats()
]).then(() => {
  document.body.classList.remove('hide-scrollbar');
}).catch(() => {
  document.body.classList.remove('hide-scrollbar');
});
