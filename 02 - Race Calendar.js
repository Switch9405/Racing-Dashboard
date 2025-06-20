const calendarUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=1246590172";

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
    if (rows.length === 0) throw new Error('Empty CSV data');

    const delimiter = rows[0].includes('\t') ? '\t' : ',';
    const headers = rows[0].split(delimiter).map(h => h.trim().toUpperCase());

    const eventIndex = headers.indexOf('EVENT NUMBER');
    const dateIndex = headers.indexOf('DATE');
    const raceIndex = headers.indexOf('RACE NUMBER');
    const trackIndex = headers.indexOf('LOCATION');
    const layoutIndex = headers.indexOf('LAYOUT');
    const formatIndex = headers.indexOf('RACE FORMAT');
    const car1Index = headers.indexOf('CLASS 1 CAR');
    const car2Index = headers.indexOf('CLASS 2 CAR');
    const pole1Index = headers.indexOf('CLASS 1 POLE');
    const pole2Index = headers.indexOf('CLASS 2 POLE');
    const fastdriver1Index = headers.indexOf('CLASS 1 FASTEST LAP DRIVER');
    const fastlap1Index = headers.indexOf('CLASS 1 FASTEST LAP TIME');
    const fastdriver2Index = headers.indexOf('CLASS 2 FASTEST LAP DRIVER');
    const fastlap2Index = headers.indexOf('CLASS 2 FASTEST LAP TIME');

    const calendarTable = document.querySelector('#calendar-table tbody');
    calendarTable.innerHTML = '';

    const eventsMap = {};
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(delimiter).map(escapeHTML);
      if (cols.length < headers.length) continue;

      const event = cols[eventIndex];
      const date = cols[dateIndex];
      const race = cols[raceIndex];
      const track = cols[trackIndex];
      const layout = cols[layoutIndex];
      const format = cols[formatIndex];
      const car1 = cols[car1Index];
      const car2 = cols[car2Index];
      const pole1 = cols[pole1Index];
      const pole2 = cols[pole2Index];
      const fastdriver1 = cols[fastdriver1Index];
      const fastlap1 = cols[fastlap1Index];
      const fastdriver2 = cols[fastdriver2Index];
      const fastlap2 = cols[fastlap2Index];

      if (!event || !race || !track || !layout) continue;

      if (!eventsMap[event]) {
        eventsMap[event] = {
          date,
          races: [],
        };
      }

      eventsMap[event].races.push({
        race, track, layout, format, car1, car2, pole1, pole2,
        fastdriver1, fastlap1, fastdriver2, fastlap2
      });
    }

    if (Object.keys(eventsMap).length === 0) {
      calendarTable.innerHTML = '<tr><td colspan="100%">No events found in data.</td></tr>';
      return;
    }

    Object.entries(eventsMap).forEach(([eventNumber, { date, races }]) => {
      const headerRow = document.createElement('tr');
      headerRow.classList.add('rc-event-header-row');
      headerRow.innerHTML = `
        <td colspan="100%">
          <strong>
            Event ${eventNumber}
            <span style="color: var(--grey); font-weight: normal;"> – </span>
            <span style="color: var(--white);">${date}</span>
          </strong>
        </td>`;
      calendarTable.appendChild(headerRow);

      races.forEach((race, idx) => {
        const format = race.format.toUpperCase();
        const label1 = format === "FLIGHT CLUB" ? "Arrows Car" : "Class 1";
        const label2 = format === "FLIGHT CLUB" ? "Drivers Car" : "Class 2";
        const label3 = format === "FLIGHT CLUB" ? "Arrow 1" : "";
        const label4 = format === "FLIGHT CLUB" ? "Arrow 2" : "";

        const raceNum = parseInt(race.race, 10);
        const isRace10 = raceNum === 10;

        if (format === "MULTICLASS" || format === "FLIGHT CLUB") {
          const row1 = document.createElement('tr');
          row1.classList.add('race-row');
          row1.innerHTML = `
          <td rowspan="2">${race.race}</td>
          <td rowspan="2">${race.track}</td>
          <td rowspan="2">${race.layout}</td>
          <td rowspan="2">${race.format}</td>
          <td class="rc-classes" style="vertical-align: middle; text-align: center;">${label1}</td>
          <td>${race.car1}</td>
          <td class="rc-classes">${label3}</td>
          <td>${race.pole1}</td>
          <td>${race.fastdriver1}</td>
          <td>${race.fastlap1}</td>
        `;
          if (isRace10) {
            row1.querySelectorAll('td')[8].setAttribute('rowspan', '2');
            row1.querySelectorAll('td')[9].setAttribute('rowspan', '2');
          }
          calendarTable.appendChild(row1);

          const row2 = document.createElement('tr');
          row2.classList.add('race-row');
          row2.innerHTML = `
            <td class="rc-classes">${label2}</td>
            <td>${race.car2}</td>
            <td class="rc-classes">${label4}</td>
            <td>${race.pole2}</td>
            ${isRace10 
              ? '<td></td><td></td>' 
              : `<td>${race.fastdriver2}</td><td>${race.fastlap2}</td>`}
          `;
          calendarTable.appendChild(row2);

          if ([2, 5, 8].includes(raceNum)) {
            const separatorRow = document.createElement('tr');
            separatorRow.innerHTML = `<td></td><td colspan="9" style="border-top: 1px solid var(--grey); padding: 0;"></td>`;
            calendarTable.appendChild(separatorRow);
          }

        } else {
          const row = document.createElement('tr');
          row.classList.add('alt-row', 'race-row');
          row.innerHTML = `
            <td>${race.race}</td>
            <td>${race.track}</td>
            <td>${race.layout}</td>
            <td>${race.format}</td>
            <td></td>
            <td>${race.car1}</td>
            <td></td>
            <td>${race.pole1}</td>
            <td>${race.fastdriver1}</td>
            <td>${race.fastlap1}</td>
          `;
          calendarTable.appendChild(row);

          if ([1, 2, 4, 5, 7, 8].includes(raceNum)) {
            const separatorRow = document.createElement('tr');
            separatorRow.innerHTML = `<td></td><td colspan="9" style="border-top: 1px solid var(--grey); padding: 0;"></td>`;
            calendarTable.appendChild(separatorRow);
          }
        }

        if (raceNum === 3 || raceNum === 6 || raceNum === 9) {
          const spacer = document.createElement('tr');
          spacer.classList.add('spacer-row');
          spacer.innerHTML = `<td colspan="10"></td>`;
          calendarTable.appendChild(spacer);
        }

        if (raceNum === 9) {
          const flightClubRow = document.createElement('tr');
          flightClubRow.classList.add('rc-event-header-row');
          flightClubRow.innerHTML = `<td colspan="100%"><strong>[REDACTED]</strong></td>`;
          calendarTable.appendChild(flightClubRow);

          // Add redacted overlay row
          const overlayRow = document.createElement('tr');
          overlayRow.innerHTML = `
            <td colspan="100%" style="position: relative; padding: 0; height: 300px;">
              <div class="redacted-overlay">[REDACTED]</div>
            </td>
          `;
          calendarTable.appendChild(overlayRow);
          
          // Skip creating the rest of the Flight Club content
          return;
        }
      });
    });

    document.getElementById('calendar-table').style.display = 'table';
    document.getElementById('loading-spinner-race-calendar').style.display = 'none';

  } catch (error) {
    console.error('Failed to load calendar data:', error);
    const calendarTable = document.querySelector('#calendar-table tbody');
    calendarTable.innerHTML = '<tr><td colspan="100%" class="error">Failed to load calendar.</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', loadCalendarData);
