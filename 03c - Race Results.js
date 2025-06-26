const raceesultsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1488323674";
const MAX_ROWS = 12;

async function loadRaceResults() {
  const resp = await fetch(raceesultsUrl);
  const text = await resp.text();
  const lines = text.trim().split("\n");

  let races = [];
  let currentRace = null;

  lines.forEach(line => {
    const columns = line.split(",");
    if (columns[0].toLowerCase().includes("race")) {
      if (currentRace && currentRace.data.length) races.push(currentRace);
      currentRace = { number: columns[0].trim(), data: [] };
    } else if (columns[0] === "Pos" || columns[0] === "") {
      // skip headers or blank lines
    } else if (currentRace) {
      if (columns.length >= 4) {
        currentRace.data.push(columns.map(c => c.trim()));
      } else {
        console.warn("Skipping malformed row:", columns);
      }
    }
  });
  if (currentRace && currentRace.data.length) races.push(currentRace);

  const container = document.getElementById("results-table-container");
  container.innerHTML = "";
  if (!races.length) {
    container.textContent = "No races found.";
    return;
  }

  races.forEach(r => {
    const raceDiv = document.createElement("div");
    raceDiv.classList.add("race-block");
    const h2 = document.createElement("h2");
    h2.textContent = r.number;
    raceDiv.appendChild(h2);

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    const thead = document.createElement("thead");
    const ths = ["Rank", "Driver", "Car", "Time", "Gap", "Best Lap", "Grid Position", "Laps Led"];
    const trHead = document.createElement("tr");
    ths.forEach((label, i) => {
      const th = document.createElement("th");
      th.textContent = label;
      th.style.textAlign = i === 1 ? "left" : "center";
      if (i > 1) th.style.width = "125px";
      if (i === 0) th.style.width = "65px";
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const spacerRow = document.createElement("tr");
    const spacerCell = document.createElement("td");
    spacerCell.colSpan = ths.length;
    spacerCell.style.height = "10px";
    spacerRow.appendChild(spacerCell);
    tbody.appendChild(spacerRow);

    r.data.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach((cell, i) => {
        const td = document.createElement("td");
        td.textContent = cell.trim();
        td.style.textAlign = i === 1 ? "left" : "center";
        if (i > 1) td.style.width = "125px";
        if (i === 0) td.style.width = "65px";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    for (let i = r.data.length; i < MAX_ROWS; i++) {
      const tr = document.createElement("tr");
      for (let j = 0; j < ths.length; j++) {
        const td = document.createElement("td");
        td.textContent = "";
        td.style.textAlign = j === 1 ? "left" : "center";
        if (j > 1) td.style.width = "125px";
        if (j === 0) td.style.width = "65px";
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    raceDiv.appendChild(table);
    container.appendChild(raceDiv);
  });
}

loadRaceResults();
