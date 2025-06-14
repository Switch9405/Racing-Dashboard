const calendarUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAnZWYLaHUrFJ7ra_a58MqU_HSPQqpfiloMMGQ0EqgHPgkJ5-szPKago8DjEX1-l9RUsDL40SQ6Eiv/pub?output=csv&gid=163325457";

const escapeHTML = str =>
  str.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

async function loadCalendarData() {
  try {
    const response = await fetch(calendarUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    const headers = rows[0].split(',').map(h => h.trim().toUpperCase());

    const eventIndex = headers.indexOf('EVENT');
    const dateIndex = headers.indexOf('DATE');
    const raceIndex = headers.indexOf('RACE');
    const trackIndex = headers.indexOf('TRACK');
    const layoutIndex = headers.indexOf('LAYOUT');
    const formatIndex = headers.indexOf('FORMAT');
    const timeIndex = headers.indexOf('TIME');

    const calendarTable = document.querySelector('#calendar-table tbody');
    calendarTable.innerHTML = '';
    calendarTable.innerHTML += '<tr class="spacer-row"><td colspan="100%"></td></tr>';

    // Group races by EVENT
    const eventsMap = {};
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',').map(escapeHTML);
      const event = cols[eventIndex];
      const date = cols[dateIndex];
      const race = cols[raceIndex];
      const track = cols[trackIndex];
      const layout = cols[layoutIndex];
      const format = cols[formatIndex];
      const time = cols[timeIndex];

      // Skip rows without valid race data
      if (!event || !race || !track || !layout) continue;

      if (!eventsMap[event]) {
        eventsMap[event] = {
          date,
          races: [],
        };
      }

      eventsMap[event].races.push({ race, track, layout, format, time });
    }

    // Render events and their races
    Object.entries(eventsMap).forEach(([eventNumber, { date, races }]) => {
      // Header row for the event
      const headerRow = document.createElement('tr');
      headerRow.classList.add('event-header-row');
      headerRow.innerHTML = `
        <td colspan="5"><strong>Event ${eventNumber}</strong> — <span class="event-date">${date}</span></td>
      `;
      calendarTable.appendChild(headerRow);

      // Add race rows
      races.forEach(race => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${race.race}</td>
          <td>${race.track}</td>
          <td>${race.layout}</td>
          <td>${race.format}</td>
          <td>${race.time}</td>
        `;
        calendarTable.appendChild(tr);
      });

      // Spacer after each event
      const spacer = document.createElement('tr');
      spacer.classList.add('spacer-row');
      spacer.innerHTML = `<td colspan="5"></td>`;
      calendarTable.appendChild(spacer);
    });

  } catch (error) {
    console.error('Failed to load calendar data:', error);
    const calendarTable = document.querySelector('#calendar-table tbody');
    calendarTable.innerHTML = '<tr><td colspan="5" class="error">Failed to load calendar.</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', loadCalendarData);
