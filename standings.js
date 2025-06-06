const STANDINGS_GID = "0"; // Replace with the GID of the Standings sheet if not 0
const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbuqGhtyNYck2VWGreRLHBjzX3dDJivYbAT999MtrPFQOjfP-GYZ_izBODqIrveDZcDO987PlJftMS/pub?output=csv&gid=1124784776";

async function loadCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  return text.split("\n").map(row => row.split(","));
}

function renderTable(data, containerId) {
  const container = document.getElementById(containerId);
  const table = document.createElement("table");

  data.forEach((row, i) => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const tag = i === 0 ? "th" : "td";
      const cellElem = document.createElement(tag);
      cellElem.textContent = cell;
      tr.appendChild(cellElem);
    });
    table.appendChild(tr);
  });

  container.innerHTML = "";
  container.appendChild(table);
}

const fullURL = `${SHEET_BASE}&gid=${STANDINGS_GID}`;
loadCSV(fullURL)
  .then(data => renderTable(data, "standings-container"))
  .catch(err => {
    document.getElementById("standings-container").innerHTML = "Failed to load data.";
    console.error(err);
  });
