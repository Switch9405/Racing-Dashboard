const teamheaderUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1266790449";
const teamstatisticsrUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=183032034";

const escapeHTML = str =>
  str.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

function normalize(str) {
  return str.trim().toLowerCase().normalize("NFKD");
}

async function loadTeamHeader() {
  try {
    const response = await fetch(teamheaderUrl);
    const csvText = await response.text();
    const rows = csvText.trim().split("\n").map(row => row.split(","));

    const teamName = document.body.getAttribute("data-team-name")?.trim();

    const columnIndex = {
      TEAM_NAME: 0,
      TEAM_COLOUR_1: 1,
      TEAM_COLOUR_2: 2,
      TEAM_COLOUR_3: 3,
      DRIVER_1: 4,
      DRIVER_2: 5,
      DRIVER_3: 6,
      DRIVER_4: 7,
    };

    const getTeamImage = (teamName) => {
      switch (normalize(teamName)) {
        case normalize("Apex Dynamics"):
          return `<img src="https://i.postimg.cc/76L3cmZZ/PEX-Racing.png" alt="Æpex Racing Car" width="466">`;
        case normalize("Pinecrest Motorsports"):
          return `<img src="https://i.postimg.cc/HxPwCXr4/Pinecrest-Racing.png" alt="Pinecrest Racing Car" width="466">`;
        case normalize("Whiteline Racing"):
          return `<img src="https://i.postimg.cc/Bvp5Mdsz/Whiteline-Racing.png" alt="Whiteline Racing Car" width="466">`;
        default:
          return "";
      }
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sheetTeamName = row[columnIndex.TEAM_NAME]?.trim();

      if (normalize(sheetTeamName) === normalize(teamName)) {
        const teamColour1 = row[columnIndex.TEAM_COLOUR_1];
        const teamColour2 = row[columnIndex.TEAM_COLOUR_2];
        const teamColour3 = row[columnIndex.TEAM_COLOUR_3];
        const driver1 = escapeHTML(row[columnIndex.DRIVER_1]);
        const driver2 = escapeHTML(row[columnIndex.DRIVER_2]);
        const driver3 = escapeHTML(row[columnIndex.DRIVER_3]);
        const driver4 = escapeHTML(row[columnIndex.DRIVER_4]);
        const teamImage = getTeamImage(sheetTeamName);

        const teamHeaderDiv = document.getElementById("team-header");
        if (teamHeaderDiv) {
          teamHeaderDiv.innerHTML = `
            <div class="team-header-card" style="
              background-color: ${teamColour2};
              background-image: url('https://i.postimg.cc/jS5bF9j4/Team-Background-Mask.png');
              background-size: cover;
              background-repeat: no-repeat;
              background-position: center;
            ">
              ${teamImage}
              <div class="team-name-lines">
                <div class="line-group">
                  <div class="line top-line" style="background-color: ${teamColour1};"></div>
                  <div class="line bottom-line" style="background-color: ${teamColour3};"></div>
                </div>
                <h2>${escapeHTML(sheetTeamName)}</h2>
                <div class="line-group">
                  <div class="line top-line" style="background-color: ${teamColour1};"></div>
                  <div class="line bottom-line" style="background-color: ${teamColour3};"></div>
                </div>
              </div>
              <div class="team-driver-lineup">
                ${[driver1, driver2, driver3, driver4].filter(Boolean).map(d => `<span>${d}</span>`).join("")}
              </div>
            </div>
          `;
        }

        break;
      }
    }

    document.getElementById("loading-spinner-race-calendar").style.display = "none";
  } catch (error) {
    console.error("❌ Failed to load team header:", error);
  }
}

async function loadTeamDriverBlocks() {
  try {
    const response = await fetch(teamheaderUrl);
    const csvText = await response.text();
    const rows = csvText.trim().split("\n").map(row => row.split(","));

    const teamName = document.body.getAttribute("data-team-name")?.trim();

    const columnIndex = {
      TEAM_NAME: 0,
      TEAM_COLOUR_2: 2,
      DRIVER_1: 4,
      DRIVER_2: 5,
      DRIVER_3: 6,
      DRIVER_4: 7,
      DRIVER_FULL_NAME: 9,
      DRIVER_FIRST_NAME: 10,
      DRIVER_LAST_NAME: 11,
      DRIVER_TEAM: 12,
      DRIVER_NUMBER: 13,
    };

              const teamRacingSuits = {
      "Apex Dynamics": "https://i.postimg.cc/DZKG9gd2/Team01-Suit.png",
      "Pinecrest Motorsports": "https://i.postimg.cc/JzvZqmsH/Team03-Suit.png",
      "Whiteline Racing": "https://i.postimg.cc/9f9TgS98/Team02-Suit.png",
      "Retired": "https://i.postimg.cc/dtg066q0/Retired-Suit.png"
    };

        const driverHelmets = {

      "thomas davis": "https://i.postimg.cc/gjcrqBdT/Thomas.png",
      "byron fourie": "https://i.postimg.cc/YCvGsVgc/Bryon.png",
      "tim harms": "https://i.postimg.cc/7PVTFz28/Tim.png",
      "doug johnson": "https://i.postimg.cc/L6jmvgHM/Doug.png",
      "iain davis": "https://i.postimg.cc/VNMSYCDD/Iain.png",
      "ivar holsvik": "https://i.postimg.cc/pL3hbZYm/Ivar.png",
      "mechiel couvaras": "https://i.postimg.cc/9MkRyh0x/Mechiel.png",
      "mj schmaltz": "https://i.postimg.cc/pLxRSVT5/MJ.png",
      "lance roux": "https://i.postimg.cc/FR4Y1H6m/Lance.png",
      "bryan schmaltz": "https://i.postimg.cc/nr0jcnk3/Bryan.png",
      "keaghan brown": "https://i.postimg.cc/Z5c4zkB7/Keaghan.png",
      "bronwyn davis": "https://i.postimg.cc/tRKXhNG5/Bronwyn.png",
      "matt sansom" : "https://i.postimg.cc/vHZ6bmr1/Matt.png",
      "dylan mayer": "https://i.postimg.cc/SRq17TGH/Dylan.png",
      "sam bartlett": "https://i.postimg.cc/nhNNBYby/Sam.png",
      "shaun baard": "https://i.postimg.cc/PqZ94pdP/Shaun.png"
    };

    let teamDrivers = [];
    let teamColour2 = "#ccc";

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (normalize(row[columnIndex.TEAM_NAME]) === normalize(teamName)) {
        teamDrivers = [
          row[columnIndex.DRIVER_1],
          row[columnIndex.DRIVER_2],
          row[columnIndex.DRIVER_3],
          row[columnIndex.DRIVER_4]
        ].filter(Boolean).map(normalize);
        teamColour2 = row[columnIndex.TEAM_COLOUR_2]?.trim() || "#ccc";
        break;
      }
    }

    const driverBlocks = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fullName = normalize(row[columnIndex.DRIVER_FULL_NAME]);

      if (teamDrivers.includes(fullName)) {
        const fullNameKey = `${row[columnIndex.DRIVER_FIRST_NAME]} ${row[columnIndex.DRIVER_LAST_NAME]}`.toLowerCase();
        const imageUrl = driverHelmets[fullNameKey];
        const driverFullName = row[columnIndex.DRIVER_FULL_NAME];
        const driverTeamName = row[columnIndex.DRIVER_TEAM]?.trim(); // e.g., "Pinecrest Motorsports"
        const suitImage = teamRacingSuits[driverTeamName];

        const blockHTML = `
          <div class="driver-block" style="
                background-color: ${teamColour2};
                background-image: url('https://i.postimg.cc/g2bq09CG/Small-Driver-Background-MASK.png');
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
              "
               onclick="navigateToDriver('${encodeURIComponent(driverFullName)}')">
            <div class="driver-info-left">
              <div class="driver-first-name">${escapeHTML(row[columnIndex.DRIVER_FIRST_NAME])}</div>
              <div class="driver-last-name">${escapeHTML(row[columnIndex.DRIVER_LAST_NAME])}</div>
              <div class="driver-team">${escapeHTML(row[columnIndex.DRIVER_TEAM])}</div>
              <div class="driver-number">${escapeHTML(row[columnIndex.DRIVER_NUMBER])}</div>
            </div>
            <div class="driver-image-right">
              <div class="image-stack">
              ${suitImage ? `<img src="${suitImage}" alt="${escapeHTML(driverTeamName)} Racing Suit" class="team-suit">` : ''}
              ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHTML(driverFullName)}" class="driver-image">` : ''}
              </div>
            </div>
          </div>
        `;

        driverBlocks.push(blockHTML);
      }
    }

    const driverGridContainer = document.getElementById("team-driver-grid");
    if (driverGridContainer) {
      driverGridContainer.innerHTML = `
        <div class="driver-grid-wrapper">
          ${driverBlocks.join("")}
        </div>
      `;
    }
  } catch (err) {
    console.error("Failed to load team driver blocks:", err);
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

async function loadTeamStats() {
  try {
    const teamName = document.body.dataset.teamName;
    if (!teamName) throw new Error("Team name not specified in data-team-name.");

    const response = await fetch(teamstatisticsrUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    const delimiter = rows[0].includes('\t') ? '\t' : ',';
    const headers = rows[0].split(delimiter).map(h => h.trim());

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(delimiter).map(c => escapeHTML(c.trim()));
      const driver = cols[0];

      if (normalize(driver) === normalize(teamName)) {
        const seasonStats = { SeasonPosition: cols[1], SeasonPoints: cols[2] };
        const sprintStats = { SprintRaces: cols[3], SprintPoints: cols[4], SprintWins: cols[5], SprintPodiums: cols[6], SprintPoles: cols[7], SprintFastestLaps: cols[8] };
        const multiclassStats = { MulticlassRaces: cols[9], MulticlassPoints: cols[10], MulticlassWins: cols[11], MulticlassPodiums: cols[12], MulticlassPoles: cols[13], MulticlassFastestLaps: cols[14] };
        const featureStats = { FeatureRaces: cols[15], FeaturePoints: cols[16], FeatureWins: cols[17], FeaturePodiums: cols[18], FeaturePoles: cols[19], FeatureFastestLaps: cols[20] };
        const careerStats = {
          RacesEntered: cols[21],
          CareerPoints: cols[22],
          HighestRaceFinish: `${toOrdinal(cols[23])} ( x${cols[24]} )`,
          Wins: cols[25],
          Podiums: cols[26],
          HighestGridPosition: `${toOrdinal(cols[27])} ( x${cols[28]} )`,
          PolePositions: cols[29],
          TeamChampionships: cols[30]
        };

        renderDriverStats(driver, seasonStats, sprintStats, multiclassStats, featureStats, careerStats);
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

// ✅ DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get('team');
  if (teamName) {
    document.body.setAttribute('data-team-name', teamName);
  }

  // Prevent scrollbar flash
  document.body.classList.add('hide-scrollbar');

  // Wait for all data to be loaded before re-enabling scroll
  Promise.all([
    loadTeamHeader(),
    loadTeamDriverBlocks(),
    loadTeamStats()
  ]).then(() => {
    document.body.classList.remove('hide-scrollbar');
  }).catch(() => {
    // In case of error, still remove to avoid blocking scroll forever
    document.body.classList.remove('hide-scrollbar');
  });
});
