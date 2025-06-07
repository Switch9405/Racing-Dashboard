const driversUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJNRN4O9DQ_YAtReDZzF_KFaMVkQFdqs3f5iTYaD9LNUrVQeVnv1zS0u5nvjlZzUgwLdS2wC48PuNs/pub?output=csv&gid=163325457";

const escapeHTML = str => str.replace(/[&<>"']/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

function createVerticalDate(dateText) {
  return `<div style="writing-mode: vertical-rl; transform: rotate(180deg); font-size: 12px;">${dateText}</div>`;
}

async function loadDriversData() {
  try {
    const response = await fetch(driversUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    if (rows.length < 2) throw new Error('Not enough data in CSV');

    const calendarTable = document.querySelector('#calendar-table tbody');
    const pointsTable = document.querySelector('#points-table');
    const pointsTbody = pointsTable.querySelector('tbody');
    const pointsThead = pointsTable.querySelector('thead tr');

    calendarTable.innerHTML = '';
    pointsTbody.innerHTML = '';

    // Process calendar (first 10 rows)
    const events = [];
    let currentEvent = null;

    for (let i = 1; i <= 10; i++) {
      const cols = rows[i].split(',').map(escapeHTML);
      if (cols.length < 7) continue;

      const [event, date, race, track, layout, format, time] = cols;

      if (event) {
        currentEvent = { event, date, races: [] };
        events.push(currentEvent);
      }

      if (currentEvent) {
        currentEvent.races.push({ race, track, layout, format, time });
      }
    }

    events.forEach(event => {
      event.races.forEach((race, idx) => {
        const tr = document.createElement('tr');
        if (idx === 0) {
          tr.innerHTML = `
            <td rowspan="${event.races.length}">${event.event}</td>
            <td rowspan="${event.races.length}" class="vertical-date">${createVerticalDate(event.date)}</td>
            <td>${race.race}</td>
            <td>${race.track}</td>
            <td>${race.layout}</td>
            <td>${race.format}</td>
            <td>${race.time}</td>
          `;
        } else {
          tr.innerHTML = `
            <td>${race.race}</td>
            <td>${race.track}</td>
            <td>${race.layout}</td>
            <td>${race.format}</td>
            <td>${race.time}</td>
          `;
        }
        calendarTable.appendChild(tr);
      });
    });

    // Process driver points
    const driverData = [];
    const racePoints = Array(10).fill().map(() => []);

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split(',').map(escapeHTML);
      if (cells.length < 17) continue;

      const pos = cells[8] || '';
      const driver = cells[9] || '';
      const movement = cells[10] || '';
      const pts = cells[11] || '0';
      const raceResults = cells.slice(12, 22);
      const fl = cells[22] || '0';
      const pp = cells[23] || '0';

      driverData.push({ pos, driver, movement, pts, raceResults, fl, pp });

      raceResults.forEach((points, idx) => {
        const numPoints = parseInt(points) || 0;
        if (numPoints > 0) racePoints[idx].push(numPoints);
      });
    }

    const raceThresholds = racePoints.map(points => {
      const sorted = [...new Set(points)].sort((a, b) => b - a);
      return {
        gold: sorted[0] || 0,
        silver: sorted[1] || 0,
        bronze: sorted[2] || 0
      };
    });

    pointsThead.innerHTML = `
      <th>Pos</th>
      <th>Driver</th>
      <th class="move-header"></th>
      <th>Pts</th>
    `;
    for (let i = 0; i < 10; i++) {
      pointsThead.innerHTML += `<th>${i + 1}</th>`;
    }
    pointsThead.innerHTML += `<th>FL</th><th>PP</th>`;

    driverData.forEach(driver => {
      const tr = document.createElement('tr');
      const posClass = ['1', '2', '3'].includes(driver.pos) ? `podium-${driver.pos}` : '';

      let movementHtml = '';
      if (driver.movement && (driver.movement.endsWith('▲') || driver.movement.endsWith('▼'))) {
        const arrow = driver.movement.slice(-1);
        const dir = arrow === '▲' ? 'movement-up' : 'movement-down';
        const number = driver.movement.slice(0, -1);
        movementHtml = `<span class="movement ${dir}">${number}${arrow}</span>`;
      }

      const ptsDisplay = parseInt(driver.pts) > 0 ? driver.pts : '-';
      const flDisplay = parseInt(driver.fl) > 0 ? driver.fl : '-';
      const ppDisplay = parseInt(driver.pp) > 0 ? driver.pp : '-';

      let rowHTML = `
        <td class="${posClass}">${driver.pos}</td>
        <td><strong>${driver.driver}</strong></td>
        <td>${movementHtml}</td>
        <td><strong>${ptsDisplay}</strong></td>
      `;

      driver.raceResults.forEach((result, index) => {
        const points = parseInt(result);
        const display = points > 0 ? points : '-';
        const { gold, silver, bronze } = raceThresholds[index];
        let className = '';

        if (points > 0) {
          if (points === gold) className = 'podium-1';
          else if (points === silver) className = 'podium-2';
          else if (points === bronze) className = 'podium-3';
        }

        rowHTML += className
          ? `<td><span class="race-point ${className}">${display}</span></td>`
          : `<td>${display}</td>`;
      });

      rowHTML += `<td>${flDisplay}</td><td>${ppDisplay}</td>`;
      tr.innerHTML = rowHTML;
      pointsTbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Failed to load drivers data:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadDriversData);
