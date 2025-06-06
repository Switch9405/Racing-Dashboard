const DRIVERS_GID = "1927281734"; // Replace with the GID for Drivers Championship sheet
const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbuqGhtyNYck2VWGreRLHBjzX3dDJivYbAT999MtrPFQOjfP-GYZ_izBODqIrveDZcDO987PlJftMS/pub?output=csv&gid=1819431125";

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

const fullURL = `${SHEET_BASE}&gid=${DRIVERS_GID}`;
loadCSV(fullURL)
  .then(data => renderTable(data, "drivers-container"))
  .catch(err => {
    document.getElementById("drivers-container").innerHTML = "Failed to load data.";
    console.error(err);
  });
