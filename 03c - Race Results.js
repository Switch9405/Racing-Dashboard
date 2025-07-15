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

  const ths = [
    { label: "Rank", className: "rank" },
    { label: "Driver", className: "driver" },
    { label: "Car", className: "car" },
    { label: "Time", className: "time" },
    { label: "Gap", className: "gap" },
    { label: "Best Lap", className: "best-lap" },
    { label: "Grid Pos.", className: "grid-pos" },
    { label: "Laps Led", className: "laps-led" },
  ];

  races.forEach(r => {
    const raceDiv = document.createElement("div");
    raceDiv.classList.add("race-block");
    const h2 = document.createElement("h2");
    h2.textContent = r.number;
    raceDiv.appendChild(h2);

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    ths.forEach((th) => {
      const thEl = document.createElement("th");
      thEl.textContent = th.label;
      thEl.classList.add(th.className);
      trHead.appendChild(thEl);
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

    const carTypeIndex = 2; // "Car" column index
    const posIndex = 0;     // "Pos" column index
    const bestLapIndex = ths.findIndex(th => th.label === "Best Lap");

    if (r.data.length > 1) {
      const preferredCarType = r.data[0][carTypeIndex];

      // Group rows by car type
      const carGroups = {};
      r.data.forEach(row => {
        const carType = row[carTypeIndex];
        if (!carGroups[carType]) carGroups[carType] = [];
        carGroups[carType].push(row);
      });

      // Sort each group by position
      Object.keys(carGroups).forEach(type => {
        carGroups[type].sort((a, b) => parseInt(a[posIndex]) - parseInt(b[posIndex]));
      });

      // Determine fastest best lap per car type
      const fastestLapsByCar = {};
      Object.entries(carGroups).forEach(([carType, rows]) => {
        let best = Infinity;
        rows.forEach(row => {
          const lap = parseFloat(row[bestLapIndex]);
          if (!isNaN(lap) && lap < best) best = lap;
        });
        fastestLapsByCar[carType] = best;
      });

      // Build sorted rows
      const orderedTypes = [preferredCarType, ...Object.keys(carGroups).filter(ct => ct !== preferredCarType)];
      const sortedRows = orderedTypes.flatMap(type => carGroups[type]);

      sortedRows.forEach(row => {
        const tr = document.createElement("tr");
        const carType = row[carTypeIndex];
        const fastestLap = fastestLapsByCar[carType];
        const rowBestLap = parseFloat(row[bestLapIndex]);

        row.forEach((cell, i) => {
          const td = document.createElement("td");
          td.textContent = cell.trim();
          td.classList.add(ths[i]?.className);

          if (i === bestLapIndex && !isNaN(rowBestLap) && rowBestLap === fastestLap) {
            td.style.color = "var(--fastestlap)";
          }

          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    } else {
      // Single row fallback
      r.data.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach((cell, i) => {
          const td = document.createElement("td");
          td.textContent = cell.trim();
          td.classList.add(ths[i]?.className);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    // Fill empty rows up to MAX_ROWS
    for (let i = r.data.length; i < MAX_ROWS; i++) {
      const tr = document.createElement("tr");
      ths.forEach(th => {
        const td = document.createElement("td");
        td.textContent = ""; 
        td.classList.add(th.className);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    raceDiv.appendChild(table);
    container.appendChild(raceDiv);
  });
}

loadRaceResults();
