const DRIVERS_GID = "1819431125"; // Replace with the GID for Drivers Championship sheet
const SHEET_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJNRN4O9DQ_YAtReDZzF_KFaMVkQFdqs3f5iTYaD9LNUrVQeVnv1zS0u5nvjlZzUgwLdS2wC48PuNs/pub?output=csv";

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
