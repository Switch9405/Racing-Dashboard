const alldriversUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1266790449";

const escapeHTML = str =>
  str.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

function normalize(str) {
  return str.trim().toLowerCase().normalize("NFKD");
}

async function loadTeamDriverBlocks() {
  try {
    const response = await fetch(alldriversUrl);
    const csvText = await response.text();
    const rows = csvText.trim().split("\n").map(row => row.split(","));

    const columnIndex = {
      TEAM_NAME: 0,
      TEAM_COLOUR_2: 2,
      DRIVER_FULL_NAME: 9,
      DRIVER_FIRST_NAME: 10,
      DRIVER_LAST_NAME: 11,
      DRIVER_TEAM: 12,
      DRIVER_NUMBER: 13,
    };

    const driverImageMap = {
      "thomas davis": "https://i.postimg.cc/0QF3cdzK/Tom-Team-Bust.png",
      "byron fourie": "https://i.postimg.cc/Z5xG4dMX/Byron-Team-Bust.png",
      "tim harms": "https://i.postimg.cc/TwpFVH3X/Tim-Team-Bust.png",
      "doug johnson": "https://i.postimg.cc/c4wqkjMx/Doug-Team-Bust.png",
      "iain davis": "https://i.postimg.cc/yN6wdNqx/Iain-Team-Bust.png",
      "ivar holsvik": "https://i.postimg.cc/xdsBbSYR/Ivar-Team-Bust.png",
      "mechiel couvaras" : "https://i.postimg.cc/ryWyYjsW/Mechiel-Team-Bust.png",
      "mj schmaltz": "https://i.postimg.cc/ZRJH5q0n/MJ-Team-Bust.png",
      "lance roux": "https://i.postimg.cc/wT6nqkCH/Lance-Team-Bust.png",
      "bryan schmaltz": "https://i.postimg.cc/T36zz9Cr/Bryan-Team-Bust.png",
      "keaghan brown": "https://i.postimg.cc/GmxT1bnq/Keegan-Team-Bust.png",
      "bronwyn davis": "https://i.postimg.cc/7Pp8VDzt/Bronwyn-Team-Bust.png"
    };

    // Step 1: Build team-to-color map
    const teamColorMap = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const teamName = row[columnIndex.TEAM_NAME]?.trim();
      const color = row[columnIndex.TEAM_COLOUR_2]?.trim();
      if (teamName && color && !teamColorMap[teamName]) {
        teamColorMap[teamName] = color;
      }
    }

    // Step 2: Build driver blocks
    const driverBlocks = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const driverFullName = row[columnIndex.DRIVER_FULL_NAME]?.trim();
      const driverFirstName = row[columnIndex.DRIVER_FIRST_NAME]?.trim();
      const driverLastName = row[columnIndex.DRIVER_LAST_NAME]?.trim();
      const driverTeam = row[columnIndex.DRIVER_TEAM]?.trim();
      const driverNumber = row[columnIndex.DRIVER_NUMBER]?.trim();

      if (!driverFullName || !driverTeam) continue;

      const fullNameKey = `${driverFirstName} ${driverLastName}`.toLowerCase();
      const imageUrl = driverImageMap[fullNameKey];
      const teamColor = teamColorMap[driverTeam] || "#ccc";

      const blockHTML = `
        <div class="driver-block" style="background-color: ${teamColor};"
             onclick="navigateToDriver('${encodeURIComponent(driverFullName)}')">
          <div class="driver-info-left">
            <div class="driver-first-name">${escapeHTML(driverFirstName)}</div>
            <div class="driver-last-name">${escapeHTML(driverLastName)}</div>
            <div class="driver-team">${escapeHTML(driverTeam)}</div>
            <div class="driver-number">${escapeHTML(driverNumber)}</div>
          </div>
          <div class="driver-image-right">
            ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHTML(driverFullName)}" class="driver-image">` : ''}
          </div>
        </div>
      `;

      driverBlocks.push(blockHTML);
    }

    const allDriversContainer = document.getElementById("all-drivers");
    if (allDriversContainer) {
      allDriversContainer.innerHTML = `
        <div class="driver-grid-wrapper">
          ${driverBlocks.join("")}
        </div>
      `;

      // ✅ Hide the spinner after content is loaded
      const spinner = document.getElementById("loading-spinner-race-calendar");
      if (spinner) {
        spinner.style.display = "none";
      }
    }
  } catch (err) {
    console.error("Failed to load driver blocks:", err);

    // ✅ Also hide spinner if there's an error
    const spinner = document.getElementById("loading-spinner-race-calendar");
    if (spinner) {
      spinner.style.display = "none";
    }
  }
}

function navigateToDriver(driverName) {
  window.location.href = `IndividualDriver.html?driver=${driverName}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get("team");

  if (teamName) {
    document.body.setAttribute("data-driver-name", decodeURIComponent(teamName));
  }

  loadTeamDriverBlocks(); // ✅ Correct function name
});
