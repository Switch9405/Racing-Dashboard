const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1266790449";

async function loadTeamData() {
  const res = await fetch(csvUrl);
  const text = await res.text();
  const rows = text.trim().split("\n").map(row => row.replace(/\r/g, '').split(",").map(cell => cell.trim()));

  const teams = [];
  const driversData = new Map();

  // Identify start of Table 2
  const table2StartIndex = rows.findIndex(row => row[0] === "Driver" && row[1] === "team");
  const table1 = rows.slice(1, table2StartIndex);

  // Parse Table 1 - Team Info
  table1.forEach(([name, c1, c2, c3, d1, d2, d3, d4]) => {
    if (!name) return;
    const driverEntries = [d1, d2, d3, d4].map((d, idx) => d ? { name: d, number: idx + 1 } : null).filter(Boolean);

    teams.push({
      name,
      colors: [c1, c2, c3],
      drivers: driverEntries
    });
  });

  // Parse Table 2 - Driver Stats
  for (let i = table2StartIndex + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (!cells[9]) continue; // driver column

    const driver = cells[9]?.trim();
    const pos = cells[11]?.trim();
    const points = cells[12]?.trim();
    const wins = cells[15]?.trim();

    driversData.set(driver.toLowerCase(), {
      pos: pos || "-",
      points: points || "0",
      wins: wins || "0"
    });
  }

  renderTeams(teams, driversData);
}

function renderTeams(teams, stats) {
  const container = document.getElementById("teams-container");
  container.innerHTML = "";

  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "team-card";

    // Header row with name and color bar (reordered)
    const headerRow = document.createElement("div");
    headerRow.className = "team-header-row";

    const title = document.createElement("div");
    title.className = "team-header";
    title.textContent = team.name;
    title.style.color = "white";  // changed here
    headerRow.appendChild(title);

    const stripeWrap = document.createElement("div");
    stripeWrap.className = "color-bar";
    team.colors.forEach(c => {
      const stripe = document.createElement("div");
      stripe.style.backgroundColor = c;
      stripe.className = "color-stripe";
      stripeWrap.appendChild(stripe);
    });

    const headerContainer = document.createElement("div");
    headerContainer.className = "team-header-container";
    headerContainer.appendChild(title);
    headerContainer.appendChild(stripeWrap);

    headerRow.appendChild(headerContainer);
    card.appendChild(headerRow);

    // Driver Table
    const driverTable = document.createElement("div");
    driverTable.className = "team-drivers";
    const table = document.createElement("table");
    table.className = "team-table";

    table.innerHTML = `
      <thead>
        <tr>
          <th>No.</th>
          <th>Driver</th>
          <th>Pos.</th>
          <th>Points</th>
          <th>Wins</th>
        </tr>
      </thead>
      <tbody>
      ${team.drivers.map((driver, idx) => {
        const key = driver.name.trim().toLowerCase();
        const s = stats.get(key) || {};

        const driverRow = `
          <tr>
            <td>${driver.number}</td>
            <td>${driver.name}</td>
            <td>${s.pos || "-"}</td>
            <td>${s.points || "0"}</td>
            <td>${s.wins || "0"}</td>
          </tr>
        `;

        // Spacer row (after every driver except the last)
        const spacerRow = `
          <tr class="spacer-row">
            <td colspan="5" style="height: 10px;"></td>
          </tr>
        `;

        return driverRow + (idx < team.drivers.length - 1 ? spacerRow : "");
      }).join("")}
      </tbody>
    `;
    driverTable.appendChild(table);
    card.appendChild(driverTable);

    container.appendChild(card);
  });
}

loadTeamData();
