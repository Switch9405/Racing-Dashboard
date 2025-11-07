// 03a - DriversChampionshipTable.js

const escapeHTML = str =>
  str.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export async function loadDriverData() {
  try {
    // ✅ Use SeasonManager to get the correct URL for the selected season
    const driversUrl = SeasonManager.getUrl("tabledrivers");

    const response = await fetch(driversUrl);
    if (!response.ok) throw new Error(`Error status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    if (rows.length < 2) throw new Error('Not enough data in CSV');

    const driverTbody = document.querySelector('#dc-points-table tbody');
    const driverThead = document.querySelector('#dc-points-table thead tr');
    driverThead.classList.add('mb-tableheading-height');
    driverTbody.innerHTML = '';

    const driverData = [];
    const racePointsDrivers = [];

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split(',').map(escapeHTML);

      // ✅ Adjusted to your sheet (first 17 columns matter)
      if (cells.length < 17) continue;

      const pos = cells[0];
      const driver = cells[1];
      const team = cells[2];
      const teamColor = cells[3];
      const movement = cells[4];
      const pts = cells[5];
      const raceResults = cells.slice(6, 15); // Race 1–9
      const fl = cells[15];
      const pp = cells[16];

      driverData.push({ pos, driver, team, teamColor, movement, pts, raceResults, fl, pp });

      raceResults.forEach((points, idx) => {
        const numPoints = parseInt(points) || 0;
        if (!racePointsDrivers[idx]) racePointsDrivers[idx] = [];
        if (numPoints > 0) racePointsDrivers[idx].push(numPoints);
      });
    }

    // Podium thresholds
    const raceThresholdsDrivers = racePointsDrivers.map(points => {
      const sorted = [...new Set(points)].sort((a, b) => b - a);
      return {
        gold: sorted[0] || 0,
        silver: sorted[1] || 0,
        bronze: sorted[2] || 0
      };
    });

    // ✅ Dynamic header (based on raceResults length)
    const numRaces = driverData[0]?.raceResults.length || 9;
    driverThead.innerHTML = `
      <th>Rank</th>
      <th class="mb-divider-cell"></th>
      <th class="dc-movement-column"></th>
      <th class="dc-driver-column">Driver</th>
      <th class="dc-team-column">Team</th>
      <th class="r_s-total-points-column">Pts.</th>
      <th class="mb-divider-cell"></th>
      ${Array(numRaces).fill(0).map((_, i) => `<th class="r_s-race-points-columns">${i + 1}</th>`).join('')}
      <th class="r_s-fastestlap-column">FL</th>
      <th class="mb-divider-cell"></th>
      <th class="dc-poleposition-column">Pole Pos.</th>`;

    // Render rows
    driverData
      .sort((a, b) => parseInt(b.pts) - parseInt(a.pts))
      .forEach((d, i) => {
        const row = renderRow(d, raceThresholdsDrivers, true, i);
        driverTbody.appendChild(row);

        const spacer = document.createElement('tr');
        spacer.innerHTML = '<td colspan="100%"></td>';
        spacer.classList.add('spacer-row');
        driverTbody.appendChild(spacer);
      });

    // Show table
    document.getElementById('loading-spinner-drivers').style.display = 'none';
    document.getElementById('dc-points-table').style.display = 'table';
  } catch (error) {
    console.error(error);
    document.getElementById('loading-spinner-drivers').innerHTML = '<p>Error loading driver data.</p>';
  }
}

// Render row function
function renderRow(entity, thresholds, isDriver, rankIndex) {
  const tr = document.createElement('tr');
  const movementHtml = entity.movement && !isNaN(parseInt(entity.movement, 10))
    ? (() => {
        const value = parseInt(entity.movement, 10);
        if (value === 0) return '';
        const symbol = value > 0 ? '▲' : '▼';
        const className = value > 0 ? 'r_s-movement-up' : 'r_s-movement-down';
        return `<span class="r_s-movement ${className}">${Math.abs(value)} ${symbol}</span>`;
      })()
    : '';

  let row = `
    <td class="r_s-rank-pos"><div class="row-content">${rankIndex + 1}</div></td>
    <td class="mb-divider-cell"><div class="row-content"></div></td>
    <td class="r_s-movement-column"><div class="row-content">${movementHtml}</div></td>`;

  if (isDriver) {
    row += `
      <td class="r_s-drivers"><div class="row-content">${entity.driver}</div></td>
      <td class="dc-teams" data-team="${entity.team}" style="--team-color:${entity.teamColor}">
        <div class="row-content">${entity.team}</div>
      </td>`;
  }

  row += `
    <td class="r_s-total-points"><div class="row-content">${parseInt(entity.pts) > 0 ? entity.pts : '-'}</div></td>
    <td class="mb-divider-cell"><div class="row-content"></div></td>`;

  entity.raceResults.forEach((r, i) => {
    const val = parseInt(r) || 0;
    let label = '-';
    let cls = 'r_s-race-points';
    if (val > 0) {
      label = val;
      const { gold, silver, bronze } = thresholds[i];
      if (val === gold) cls = 'r_s-race-point-colored podium-points-1';
      else if (val === silver) cls = 'r_s-race-point-colored podium-points-2';
      else if (val === bronze) cls = 'r_s-race-point-colored podium-points-3';
    }
    row += `<td><div class="row-content"><span class="${cls}">${label}</span></div></td>`;
  });

  row += `
    <td class="r_s-fastestlap-points"><div class="row-content">${parseInt(entity.fl) > 0 ? entity.fl : '-'}</div></td>`;

  if (isDriver) {
    row += `
      <td class="mb-divider-cell"><div class="row-content"></div></td>
      <td class="dc-poleposition-number"><div class="row-content">${parseInt(entity.pp) > 0 ? entity.pp : '-'}</div></td>`;
  }

  tr.innerHTML = row;
  return tr;
}
