const teamschampUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1594244845";

const escapeHTML = str =>
  str.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export async function loadTeamData() {
  try {
    const response = await fetch(teamschampUrl);
    if (!response.ok) throw new Error(`Error status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    if (rows.length < 2) throw new Error('Not enough data in CSV');

    const teamTbody = document.querySelector('#tc-points-table tbody');
    const teamThead = document.querySelector('#tc-points-table thead tr');
    teamThead.classList.add('mb-tableheading-height');
    teamTbody.innerHTML = '';

    const teamData = [];
    const racePointsTeams = Array(9).fill().map(() => []);

    for (let i = 1; i < rows.length && i <= 7; i++) {
      const cells = rows[i].split(',').map(escapeHTML);
      if (cells.length < 32) continue;

      const pos = cells[18];
      const team = cells[19];
      const teamColor = cells[20];
      const movement = cells[21];
      const pts = cells[22];
      const raceResults = cells.slice(23, 32);
      const fl = cells[32];

      if (!team.trim()) continue;

      teamData.push({ pos, team, teamColor, movement, pts, raceResults, fl });
      raceResults.forEach((points, idx) => {
        const numPoints = parseInt(points) || 0;
        racePointsTeams[idx].push(numPoints);
      });
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
    const raceThresholdsTeams = thresholds(racePointsTeams);

    // Headers
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

    // Render
    teamData
      .sort((a, b) => parseInt(b.pts) - parseInt(a.pts))
      .forEach((t, i) => {
        const row = renderRow(t, raceThresholdsTeams, false, i);
        teamTbody.appendChild(row);
        row.classList.add('hover-row');
        const spacer = document.createElement('tr');
        spacer.innerHTML = '<td colspan="100%"></td>';
        spacer.classList.add('spacer-row');
        teamTbody.appendChild(spacer);
      });

    document.getElementById('loading-spinner-teams').style.display = 'none';
    document.getElementById('tc-points-table').style.display = 'table';
  } catch (error) {
    console.error(error);
    document.getElementById('loading-spinner-teams').innerHTML = '<p>Error loading team data.</p>';
  }
}

// The same renderRow method (adjusted for team layout) as in your original script:
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

  row += `<td class="tc-empty" data-team="${entity.team}" style="--team-color:${entity.teamColor}"><div class="row-content">${entity.team}</div></td>
    <td class="tc-driver-placeholder"><div class="row-content"></div></td>`;

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
    <td class="r_s-fastestlap-points"><div class="row-content">${parseInt(entity.fl) > 0 ? entity.fl : '-'}</div></td>
    <td class="mb-divider-cell"><div class="row-content"></div></td>
    <td class="dc-poleposition-column tc-final-empty"><div class="row-content"></div></td>`;
  tr.innerHTML = row;

  return tr;
}
