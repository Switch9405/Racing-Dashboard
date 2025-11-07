const alldriversUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1266790449"; 

const escapeHTML = str =>
  str.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

function normalize(str) {
  return str.trim().toLowerCase().normalize("NFKD");
}

// NEW: team car image function
function getTeamImage(teamName) {
  switch (normalize(teamName)) {
    case normalize("Apex Dynamics"):
      return `<img src="https://i.postimg.cc/fWgnp5D0/Apex-Dynamics-Panther.png" alt="Æpex Racing Car" width="250" class="team-image">`;
    case normalize("Pinecrest Motorsports"):
      return `<img src="https://i.postimg.cc/hvhFhQbj/Pinecrest-Motorsports-Panther.png" alt="Pinecrest Racing Car" width="250" class="team-image">`;
    case normalize("Whiteline Racing"):
      return `<img src="https://i.postimg.cc/3NqsGrnZ/Whiteline-Racing-Panther.png" alt="Whiteline Racing Car" width="250" class="team-image" style="margin-top: 1rem;">`;
    default:
      return "";
  }
}

// Team block template (logo + name left, car image right)
function createTeamBlock(teamName, teamColor, teamBackgroundImage, teamLogos) {
  const logoUrl = teamLogos[teamName] || "";
  const teamImage = getTeamImage(teamName);

  return `
    <div class="team-block">
      <div class="team-name-row">
        <div class="team-name-left">
          ${logoUrl ? `<img src="${logoUrl}" alt="${escapeHTML(teamName)} Logo" class="team-logo">` : ""}
        </div>
      </div>
    </div>
  `;
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

    const teamRacingSuits = {
      "Apex Dynamics": "https://i.postimg.cc/DZKG9gd2/Team01-Suit.png",
      "Pinecrest Motorsports": "https://i.postimg.cc/JzvZqmsH/Team03-Suit.png",
      "Whiteline Racing": "https://i.postimg.cc/9f9TgS98/Team02-Suit.png",
      "Retired": "https://i.postimg.cc/dtg066q0/Retired-Suit.png"
    };

    const teamLogos = {
      "Apex Dynamics": "https://i.postimg.cc/G34PF0JN/Apex-Dynamics-H-Transparent.png",
      "Pinecrest Motorsports": "https://i.postimg.cc/y8MydLS5/Pinecrest-Motorsports-H-Transparent.png",
      "Whiteline Racing": "https://i.postimg.cc/Nj9xB3Lm/Whiteline-Racing-H-Transparent.png"
    };

    const teamBackgroundImages = {
      "Apex Dynamics": "https://i.postimg.cc/Zq7dpXMB/Aepex-Small-Driver-Background.png",
      "Pinecrest Motorsports": "https://i.postimg.cc/sXbG07y3/Pinecrest-Small-Driver-Background.png",
      "Whiteline Racing": "https://i.postimg.cc/638G0zkH/Whiteline-Small-Driver-Background.png"
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
      "bryan schmaltz": "https://i.postimg.cc/MKPftxnb/Bryan.png",
      "keaghan brown": "https://i.postimg.cc/Z5c4zkB7/Keaghan.png",
      "bronwyn davis": "https://i.postimg.cc/tRKXhNG5/Bronwyn.png",
      "matt sansom": "https://i.postimg.cc/vHZ6bmr1/Matt.png",
      "dylan mayer": "https://i.postimg.cc/SRq17TGH/Dylan.png",
      "sam bartlett": "https://i.postimg.cc/nhNNBYby/Sam.png",
      "shaun baard": "https://i.postimg.cc/PqZ94pdP/Shaun.png"
    };

    // Map team → color
    const teamColorMap = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const teamName = row[columnIndex.TEAM_NAME]?.trim();
      const color = row[columnIndex.TEAM_COLOUR_2]?.trim();
      if (teamName && color && !teamColorMap[teamName]) {
        teamColorMap[teamName] = color;
      }
    }

    // Group drivers by team
    const teams = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const driverFullName = row[columnIndex.DRIVER_FULL_NAME]?.trim();
      const driverFirstName = row[columnIndex.DRIVER_FIRST_NAME]?.trim();
      const driverLastName = row[columnIndex.DRIVER_LAST_NAME]?.trim();
      const driverTeam = row[columnIndex.DRIVER_TEAM]?.trim();
      const driverNumber = row[columnIndex.DRIVER_NUMBER]?.trim();

      if (!driverFullName || !driverTeam) continue;

      const fullNameKey = `${driverFirstName} ${driverLastName}`.toLowerCase();
      const imageUrl = driverHelmets[fullNameKey];
      const teamColor = teamColorMap[driverTeam] || "#ccc";
      const suitImage = teamRacingSuits[driverTeam];

      const driverBlock = `
        <div class="driver-block" style="
              background-image: url('https://i.postimg.cc/g2bq09CG/Small-Driver-Background-MASK.png');
              background-size: cover;
              background-repeat: no-repeat;
              background-position: center;
              "
          onclick="navigateToDriver('${encodeURIComponent(driverFullName)}')">

          <div class="driver-info-left">
            <div class="driver-first-name">${escapeHTML(driverFirstName)}</div>
            <div class="driver-last-name">${escapeHTML(driverLastName)}</div>
            <div class="driver-team">${escapeHTML(driverTeam)}</div>
            <div class="driver-number">${escapeHTML(driverNumber)}</div>
          </div>
          <div class="driver-image-right">
            <div class="image-stack">
              ${suitImage ? `<img src="${suitImage}" alt="${escapeHTML(driverTeam)} Racing Suit" class="team-suit">` : ''}
              ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHTML(driverFullName)}" class="driver-image">` : ''}
            </div>
          </div>
        </div>
      `;

      if (!teams[driverTeam]) teams[driverTeam] = [];
      teams[driverTeam].push(driverBlock);
    }

    // Define custom team order
    const customOrder = ["Apex Dynamics", "Whiteline Racing", "Pinecrest Motorsports"];

    function sortTeams(a, b) {
      const indexA = customOrder.indexOf(a);
      const indexB = customOrder.indexOf(b);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB; // both in custom order
      } else if (indexA !== -1) {
        return -1; // A is in custom order, B is not
      } else if (indexB !== -1) {
        return 1; // B is in custom order, A is not
      }
      return a.localeCompare(b); // fallback alphabetical
    }

    // Render current drivers
    const allDriversContainer = document.getElementById("all-drivers");
    if (allDriversContainer) {
      let htmlOutput = "";

      const teamNames = Object.keys(teams)
        .filter(t => t !== "Retired")
        .sort(sortTeams);

      for (const teamName of teamNames) {
        const drivers = teams[teamName];
        const teamColor = teamColorMap[teamName] || "#333";
        const teamBackground = teamBackgroundImages[teamName] || "";

        // Insert Team Block (with logo + car image)
        htmlOutput += createTeamBlock(teamName, teamColor, teamBackground, teamLogos);

        // Insert driver blocks in rows of 4
        for (let i = 0; i < drivers.length; i++) {
          if (i % 4 === 0) htmlOutput += `<div class="driver-grid-wrapper">`;
          htmlOutput += drivers[i];
          if (i % 4 === 3 || i === drivers.length - 1) {
            htmlOutput += `</div>`;
          }
        }
      }

      allDriversContainer.innerHTML = htmlOutput;
    }

    // Render retired drivers (no team block, just rows of 4)
    const retiredDriversContainer = document.getElementById("retired-drivers");
    if (retiredDriversContainer && teams["Retired"]) {
      let retiredHTML = "";
      const retiredDrivers = teams["Retired"];

      for (let i = 0; i < retiredDrivers.length; i++) {
        if (i % 4 === 0) retiredHTML += `<div class="driver-grid-wrapper">`;
        retiredHTML += retiredDrivers[i];
        if (i % 4 === 3 || i === retiredDrivers.length - 1) {
          retiredHTML += `</div>`;
        }
      }

      retiredDriversContainer.innerHTML = retiredHTML;
    }

  } catch (err) {
    console.error("Failed to load driver blocks:", err);
  } finally {
    const spinner = document.getElementById("loading-spinner-race-calendar");
    if (spinner) spinner.style.display = "none";
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

  loadTeamDriverBlocks();
});
