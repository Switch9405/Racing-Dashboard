const allteamsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1266790449";

const escapeHTML = str =>
  str.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

function normalize(str) {
  return str.trim().toLowerCase().normalize("NFKD");
}

async function loadTeamBlocks() {
  try {
    const response = await fetch(allteamsUrl);
    const csvText = await response.text();
    const rows = csvText.trim().split("\n").map(row => row.split(","));

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
        case normalize("Æpex Performance"):
          return `<img src="https://i.postimg.cc/76L3cmZZ/PEX-Racing.png" alt="Æpex Racing Car" width="250" class="team-image">`;
        case normalize("Pinecrest Motorsports"):
          return `<img src="https://i.postimg.cc/HxPwCXr4/Pinecrest-Racing.png" alt="Pinecrest Racing Car" width="250" class="team-image">`;
        case normalize("Whiteline Racing"):
          return `<img src="https://i.postimg.cc/Bvp5Mdsz/Whiteline-Racing.png" alt="Whiteline Racing Car" width="250" class="team-image" style="margin-top: 1rem;">`;
        default:
          return "";
      }
    };

    const allTeamsDiv = document.getElementById("all-teams");
    allTeamsDiv.innerHTML = ""; // Clear previous content

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rawTeamName = row[columnIndex.TEAM_NAME]?.trim();

      // ✅ Skip empty or invalid rows
      if (!rawTeamName) continue;

      const teamName = escapeHTML(rawTeamName);
      const teamColour2 = row[columnIndex.TEAM_COLOUR_2];
      const driver1 = escapeHTML(row[columnIndex.DRIVER_1]);
      const driver2 = escapeHTML(row[columnIndex.DRIVER_2]);
      const driver3 = escapeHTML(row[columnIndex.DRIVER_3]);
      const driver4 = escapeHTML(row[columnIndex.DRIVER_4]);
      const teamImage = getTeamImage(rawTeamName);

      const teamBlockHTML = `
        <div 
          class="team-header-card" 
          style="background-color: ${teamColour2}; cursor: pointer;" 
          onclick="navigateToDriver('${encodeURIComponent(rawTeamName)}')"
        >
          <h2>${teamName}</h2>
          <div class="team-driver-lineup">
            ${[driver1, driver2, driver3, driver4].filter(Boolean).map(d => `<span>${d}</span>`).join("")}
          </div>
          ${teamImage}
        </div>
      `;

      allTeamsDiv.insertAdjacentHTML("beforeend", teamBlockHTML);
    }

    const spinner = document.getElementById("loading-spinner-race-calendar");
    if (spinner) spinner.style.display = "none";
  } catch (error) {
    console.error("❌ Failed to load team blocks:", error);
    const spinner = document.getElementById("loading-spinner-race-calendar");
    if (spinner) spinner.style.display = "none";
  }
}

function navigateToDriver(teamName) {
  window.location.href = `IndividualTeam.html?team=${teamName}`;
}

document.addEventListener('DOMContentLoaded', () => {
  loadTeamBlocks();
});
