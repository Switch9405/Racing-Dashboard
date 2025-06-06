const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbuqGhtyNYck2VWGreRLHBjzX3dDJivYbAT999MtrPFQOjfP-GYZ_izBODqIrveDZcDO987PlJftMS/pub?output=csv";

async function loadCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  return text.split("\n").map(row => row.split(","));
}

function renderTable(data) {
  const container = document.getElementById("standings-container");
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

loadCSV(SHEET_CSV_URL)
  .then(renderTable)
  .catch(err => {
    document.getElementById("standings-container").innerHTML =
      "<p>Failed to load data. Check the link or try again later.</p>";
    console.error("CSV load error:", err);
  });
