const calendarUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJNRN4O9DQ_YAtReDZzF_KFaMVkQFdqs3f5iTYaD9LNUrVQeVnv1zS0u5nvjlZzUgwLdS2wC48PuNs/pub?output=csv&gid=163325457";

const escapeHTML = str => str.replace(/[&<>"']/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

async function loadCalendarData() {
  try {
    const response = await fetch(calendarUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    if (rows.length < 2) throw new Error('Not enough data in CSV');

    const calendarTable = document.querySelector('#calendar-table tbody');
    calendarTable.innerHTML = '';
    calendarTable.innerHTML += '<tr class="spacer-row"><td colspan="100%"></td></tr>';

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
            <td rowspan="${event.races.length}">${event.date}</td>
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
        const spacer = document.createElement('tr');
        spacer.classList.add('spacer-row');
        spacer.innerHTML = `<td colspan="7"></td>`;
        calendarTable.appendChild(spacer);
    });

  } catch (error) {
    console.error('Failed to load calendar data:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadCalendarData);