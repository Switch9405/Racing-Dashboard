const driversUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1594244845";

const escapeHTML = str => str.replace(/[&<>"']/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

async function loadDriversData() {
  try {
    const response = await fetch(driversUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    if (rows.length < 2) throw new Error('Not enough data in CSV');

    const driverTbody = document.querySelector('#dc-points-table tbody');
    const driverThead = document.querySelector('#dc-points-table thead tr');
    driverThead.classList.add('mb-tableheading-height');
    driverTbody.innerHTML = '';

    const teamTbody = document.querySelector('#tc-points-table tbody');
    const teamThead = document.querySelector('#tc-points-table thead tr');
    teamThead.classList.add('mb-tableheading-height');
    teamTbody.innerHTML = '';

    const driverData = [];
    const teamData = [];
    const racePointsDrivers = Array(9).fill().map(() => []);
    const racePointsTeams = Array(9).fill().map(() => []);

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split(',').map(escapeHTML);
      if (cells.length < 32) continue;

      // Driver Data
      const posD = cells[0];
      const driver = cells[1];
      const teamD = cells[2];
      const movementD = cells[3];
      const ptsD = cells[4];
      const raceResultsD = cells.slice(5, 14);
      const flD = cells[14];
      const ppD = cells[15];

      driverData.push({
        pos: posD,
        driver,
        team: teamD,
        movement: movementD,
        pts: ptsD,
        raceResults: raceResultsD,
        fl: flD,
        pp: ppD
      });

      raceResultsD.forEach((points, idx) => {
        const numPoints = parseInt(points) || 0;
        if (numPoints > 0) racePointsDrivers[idx].push(numPoints);
      });

      // Team Data (only process rows 1 to 7)
      if (i <= 7) {
        const posT = cells[17];
        const movementT = cells[19];
        const teamName = cells[18];
        const ptsT = cells[20];
        const raceResultsT = cells.slice(21, 30);
        const flT = cells[30];

        const hasValidData =
          teamName && teamName.trim() !== '' &&
          (parseInt(ptsT) || raceResultsT.some(p => parseInt(p)) || parseInt(flT));

        if (!hasValidData) continue;

        teamData.push({
          pos: posT,
          team: teamName,
          movement: movementT,
          pts: ptsT,
          raceResults: raceResultsT,
          fl: flT
        });

        raceResultsT.forEach((points, idx) => {
          const numPoints = parseInt(points) || 0;
          if (numPoints > 0) racePointsTeams[idx].push(numPoints);
        });
      }
    }

    const thresholds = arr =>
      arr.map(points => {
        const sorted = [...new Set(points)].sort((a, b) => b - a);
        return {
          gold: sorted[0] || 0,
          silver: sorted[1] || 0,
          bronze: sorted[2] || 0
        };
      });

    const raceThresholdsDrivers = thresholds(racePointsDrivers);
    const raceThresholdsTeams = thresholds(racePointsTeams);

    // --- HEADERS ---
    driverThead.innerHTML = `
      <th>Rank</th>
      <th class="mb-divider-cell"></th>
      <th class="dc-movement-column"></th>
      <th class="dc-driver-column">Driver</th>
      <th class="dc-team-column">Team</th>
      <th class="r_s-total-points-column">Pts.</th>
      <th class="mb-divider-cell"></th>
      ${Array(9).fill(0).map((_, i) => `<th class="r_s-race-points-columns">${i + 1}</th>`).join('')}
      <th class="r_s-fastestlap-column">FL</th>
      <th class="mb-divider-cell"></th>
      <th class="dc-poleposition-column">Pole Pos.</th>`;

    teamThead.innerHTML = `
      <th>Rank</th>
      <th class="mb-divider-cell"></th>
      <th class="tc-movement-column"></th>
      <th class="tc-teams-column">Team</th>
      <th class="tc-driver-placeholder"></th>
      <th class="r_s-total-points-column">Pts.</th>
      <th class="mb-divider-cell"></th>
      ${Array(9).fill(0).map((_, i) => `<th class="r_s-race-points-columns">${i + 1}</th>`).join('')}
      <th class="r_s-fastestlap-column">FL</th>
      <th class="mb-divider-cell"></th>
      <th class="dc-poleposition-column"></th>`;

    const renderRow = (entity, thresholds, isDriver, rankIndex) => {
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
        row += `<td class="r_s-drivers"><div class="row-content">${entity.driver}</div></td>
                <td class="dc-teams"><div class="row-content">${entity.team}</div></td>`;
      } else {
        row += `<td class="tc-empty"><div class="row-content">${entity.team}</div></td>
                <td class="tc-driver-placeholder"><div class="row-content"></div></td>`;
      }

      row += `<td class="r_s-total-points"><div class="row-content">${parseInt(entity.pts) > 0 ? entity.pts : '-'}</div></td>
              <td class="mb-divider-cell"><div class="row-content"></div></td>`;

      entity.raceResults.forEach((r, i) => {
        const val = parseInt(r) || 0;
        let label = '-';
        let cls = 'r_s-race-points'; // default class

        if (val > 0) {
          label = val;
          const { gold, silver, bronze } = thresholds[i];
          if (val === gold) cls = 'r_s-race-point-colored podium-points-1';
          else if (val === silver) cls = 'r_s-race-point-colored podium-points-2';
          else if (val === bronze) cls = 'r_s-race-point-colored podium-points-3';
          else cls = 'r_s-race-points';
        }

        row += `<td><div class="row-content"><span class="${cls}">${label}</span></div></td>`;
      });

      row += `<td class="r_s-fastestlap-points"><div class="row-content">${parseInt(entity.fl) > 0 ? entity.fl : '-'}</div></td>`;

      if (isDriver) {
        row += `<td class="mb-divider-cell"><div class="row-content"></div></td>
                <td class="dc-poleposition-number"><div class="row-content">${parseInt(entity.pp) > 0 ? entity.pp : '-'}</div></td>`;
      } else {
        row += `<td class="mb-divider-cell"><div class="row-content"></div></td>
                <td class="dc-poleposition-column tc-final-empty"><div class="row-content"></div></td>`;
      }

      tr.innerHTML = row;
      return tr;
    };

    // ✅ Sort by total points (descending)
    driverData.sort((a, b) => parseInt(b.pts) - parseInt(a.pts));
    teamData.sort((a, b) => parseInt(b.pts) - parseInt(a.pts));

    // Render Driver Rows
    driverData.forEach((driver, i) => {
      const row = renderRow(driver, raceThresholdsDrivers, true, i);
      driverTbody.appendChild(row);
      row.classList.add('hover-row');
      const spacer = document.createElement('tr');
      spacer.innerHTML = `<td colspan="100%"></td>`;
      spacer.classList.add('spacer-row');
      driverTbody.appendChild(spacer);
    });

    // Render Team Rows
    teamData.forEach((team, i) => {
      const row = renderRow(team, raceThresholdsTeams, false, i);
      teamTbody.appendChild(row);
      row.classList.add('hover-row');
      const spacer = document.createElement('tr');
      spacer.innerHTML = `<td colspan="100%"></td>`;
      spacer.classList.add('spacer-row');
      teamTbody.appendChild(spacer);
    });

    document.getElementById('loading-spinner-drivers').style.display = 'none';
    document.getElementById('dc-points-table').style.display = 'table';
    document.getElementById('tc-points-table').style.display = 'table';
    document.getElementById('loading-spinner-teams').style.display = 'none';

  } catch (error) {
    console.error('Failed to load drivers or teams:', error);
    document.getElementById('loading-spinner-drivers').innerHTML = '<p>Error loading driver data.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadDriversData);
