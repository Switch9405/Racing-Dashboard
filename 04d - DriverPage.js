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

    const driverImageMap = {
      "thomas davis": "https://i.postimg.cc/wjZKBMy9/Tom-Driver.png",
      "byron fourie": "https://i.postimg.cc/SsWb34Kk/Byron-Driver.png",
      "tim harms": "https://i.postimg.cc/Dw8kFLzC/Tim-Driver.png",
      "doug johnson": "https://i.postimg.cc/DZVKx0nx/Doug-Driver.png",
      "iain davis": "https://i.postimg.cc/C5SpV2ZD/Iain-Driver.png",
      "ivar holsvik": "https://i.postimg.cc/NFDqGxTn/Ivar-Driver.png",
      "mechiel couvaras" : "https://i.postimg.cc/9XJ2kkVD/Mechiel-Driver.png",
      "mj schmaltz": "https://i.postimg.cc/15WhLJyn/MJ-Driver.png",
      "lance roux": "https://i.postimg.cc/sDfC6tCC/Lance-Driver.png",
      "bryan schmaltz": "https://i.postimg.cc/W4qvmgLD/Bryan-Driver.png",
      "keaghan brown": "https://i.postimg.cc/ZYxhLJgL/Keegan-Driver.png",
      "bronwyn davis": "https://i.postimg.cc/52RJFpGd/Bronwyn-Driver.png"
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fullName = `${row[columnIndex.DRIVER_FIRST_NAME]} ${row[columnIndex.DRIVER_LAST_NAME]}`.toLowerCase();

      if (normalize(fullName) === normalize(driverName)) {
        const imageUrl = driverImageMap[fullName];
        const driverTeamName = row[columnIndex.DRIVER_TEAM]?.trim();
        let teamColour2 = "#ccc"; // Default fallback color

        // 🔍 Find team color by matching TEAM_NAME to DRIVER_TEAM
        for (let j = 1; j < rows.length; j++) {
          const teamRow = rows[j];
          const teamName = teamRow[columnIndex.TEAM_NAME]?.trim();
          if (teamName && teamName.toLowerCase() === driverTeamName?.toLowerCase()) {
            teamColour2 = teamRow[columnIndex.TEAM_COLOUR_2]?.trim() || "#ccc";
            break;
          }
        }

        const blockHTML = `
          <div class="driver-block" style="background-color: ${teamColour2};">
            <div class="driver-info-left">
              <div class="driver-first-name">${escapeHTML(row[columnIndex.DRIVER_FIRST_NAME])}</div>
              <div class="driver-last-name">${escapeHTML(row[columnIndex.DRIVER_LAST_NAME])}</div>
              <div class="driver-team">${escapeHTML(row[columnIndex.DRIVER_TEAM])}</div>
              <div class="driver-number">${escapeHTML(row[columnIndex.DRIVER_NUMBER])}</div>
            </div>
            <div class="driver-image-right">
              ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHTML(fullName)}" class="driver-image">` : ''}
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

    document.getElementById("loading-spinner-race-calendar").style.display = "none";
  } catch (err) {
    console.error("Failed to load driver block:", err);
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
      </div>
    `;
  };

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
