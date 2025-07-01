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

    const calendarContainer = document.querySelector('#calendar-grid');
    calendarContainer.innerHTML = '';

    const getIndex = name => headers.indexOf(name.toUpperCase());

    const eventsMap = {};
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(delimiter).map(escapeHTML);
      if (cols.length < headers.length) continue;

      const event = cols[getIndex('EVENT NUMBER')];
      const date = cols[getIndex('DATE')];
      const race = cols[getIndex('RACE NUMBER')];
      const track = cols[getIndex('LOCATION')];
      const layout = cols[getIndex('LAYOUT')];
      const format = cols[getIndex('RACE FORMAT')];
      const car1 = cols[getIndex('CLASS 1 CAR')];
      const car2 = cols[getIndex('CLASS 2 CAR')];
      const quali = cols[getIndex('QUALIFICATION')];
      const duration = cols[getIndex('RACE DURATION')];
      const tirewear = cols[getIndex('TIRE WEAR')];
      const fuel = cols[getIndex('FUEL CONSUMPTION')];
      const damage = cols[getIndex('DAMAGE')];
      const pole1 = cols[getIndex('CLASS 1 POLE')];
      const pole2 = cols[getIndex('CLASS 2 POLE')];
      const fastdriver1 = cols[getIndex('CLASS 1 FASTEST LAP DRIVER')];
      const fastlap1 = cols[getIndex('CLASS 1 FASTEST LAP TIME')];
      const fastdriver2 = cols[getIndex('CLASS 2 FASTEST LAP DRIVER')];
      const fastlap2 = cols[getIndex('CLASS 2 FASTEST LAP TIME')];
      const arrow1 = cols[getIndex('ARROW 1')];
      const arrow2 = cols[getIndex('ARROW 2')];

      if (!event || !race || !track || !layout) continue;

      if (!eventsMap[event]) {
        eventsMap[event] = {
          date,
          races: []
        };
      }

      eventsMap[event].races.push({
        race, track, layout, format, car1, car2, quali, duration, tirewear, fuel, damage,
        pole1, pole2, fastdriver1, fastlap1, fastdriver2, fastlap2, arrow1, arrow2
      });
    }

    Object.entries(eventsMap).forEach(([eventNumber, { date, races }]) => {
      const eventWrapper = document.createElement('div');
      eventWrapper.classList.add('event-wrapper');

      const eventHeader = document.createElement('div');
      eventHeader.classList.add('event-header');
      eventHeader.innerHTML = `<div class="event-header-content">
        <strong>Event ${eventNumber}</strong><span> - </span><span>${date}</span>
      </div>`;
      eventWrapper.appendChild(eventHeader);

      const raceGrid = document.createElement('div');
      raceGrid.classList.add('race-grid');

      const flightClubRows = [];

      races.forEach(race => {
        const format = race.format.toUpperCase();
        const isFlightClub = format === "FLIGHT CLUB";
        const isMulticlass = format === "MULTICLASS" || isFlightClub;

        if (isFlightClub) {
          const fcRow = document.createElement('div');
          fcRow.classList.add('flight-club-row');

          const fcTop = document.createElement('div');
          fcTop.classList.add('flight-club-col-left');
          fcTop.innerHTML = `
            <div class="flighclub-race-settings"> 
              <div><strong>TRACK: </strong> ${race.track}</div> 
              <div><strong>LAYOUT: </strong> ${race.layout}</div>
              <div><strong>RACE DURATION: </strong> ${race.duration}</div>
              <div><strong>TIRE WEAR: </strong> ${race.tirewear}</div>
              <div><strong>FUEL CONSUMPTION: </strong> ${race.fuel}</div>
              <div><strong>DAMAGE: </strong> ${race.damage}</div>
            </div>
          `;

          const fcLeft = document.createElement('div');
          fcLeft.classList.add('flight-club-col-mid');
          fcLeft.innerHTML = `
            <div class="fc-event-details"><strong>DRIVERS</strong></div>
            <div class="race-car"><strong>CAR: </strong> ${race.car1}</div>
            <div class="race-pole"><strong>POLE POSITION: </strong> ${race.pole1}</div>
            <div class="fastest-lap-container">
              <div class="race-fast-driver"><strong>FASTEST LAP: </strong> ${race.fastdriver1}</div>
              <div class="race-fast-time"><strong>LAP TIME: </strong> ${race.fastlap1}</div>
            </div>
          `;

          const fcRight = document.createElement('div');
          fcRight.classList.add('flight-club-col-right');
          fcRight.innerHTML = `
            <div class="fc-event-details"><strong>ARROWS</strong></div>
            <div class="race-car"><strong>CAR: </strong> ${race.car2}</div>
            <div class="race-pole"><strong>Arrow 1: </strong> ${race.arrow1}</div>
            <div class="race-pole"><strong>Arrow 2: </strong> ${race.arrow2}</div>
          `;

          fcRow.appendChild(fcTop);
          fcRow.appendChild(fcLeft);
          fcRow.appendChild(fcRight);

          flightClubRows.push(fcRow);
          return;
        }

        const card = document.createElement('div');
        card.classList.add('race-card');

        const raceTitle = `RACE ${race.race}`;
        const raceSettings = `
          <div class="race-settings">
            <div><strong>TRACK: </strong> ${race.track}</div>
            <div><strong>LAYOUT: </strong> ${race.layout}</div>
            <div><strong>FORMAT: </strong> ${format}</div>
            <div><strong>CAR: </strong> ${isMulticlass ? `${race.car1} / ${race.car2}` : race.car1}</div>
            <div><strong>QUALIFICATION: </strong> ${race.quali}</div>
            <div><strong>RACE DURATION: </strong> ${race.duration}</div>
            <div><strong>TIRE WEAR: </strong> ${race.tirewear}</div>
            <div><strong>FUEL CONSUMPTION: </strong> ${race.fuel}</div>
          </div>
        `;

        let bottomLeftContent = `
          <div class="event-details"><strong>EVENT RESULTS</strong></div>
          <div class="class-label">Class 1</div>
          <div class="race-car"><strong>CAR: </strong> ${race.car1}</div>
          <div class="race-pole"><strong>POLE POSITION: </strong> ${race.pole1}</div>
          <div class="fastest-lap-container">
            <div class="race-fast-driver"><strong>FASTEST LAP: </strong> ${race.fastdriver1}</div>
            <div class="race-fast-time"><strong>LAP TIME: </strong> ${race.fastlap1}</div>
          </div>
        `;

        const raceBottomRight = document.createElement('div');
        raceBottomRight.classList.add(isMulticlass ? 'race-bottom-right-multiclass' : 'race-bottom-right');

        if (isMulticlass) {
          raceBottomRight.classList.add('multiclass');
          raceBottomRight.innerHTML = `
            <div class="class-label">Class 2</div>
            <div class="race-car"><strong>CAR: </strong> ${race.car2}</div>
            <div class="race-pole"><strong>POLE POSITION: </strong> ${race.pole2}</div>
            <div class="fastest-lap-container">
              <div class="race-fast-driver"><strong>FASTEST LAP: </strong> ${race.fastdriver2}</div>
              <div class="race-fast-time"><strong>LAP TIME: </strong> ${race.fastlap2}</div>
            </div>
          `;
        } else {
        }

        card.innerHTML = `
          <div class="race-title"><div>${raceTitle}</div></div>
          <div class="race-top">${raceSettings}</div>
          <div class="race-bottom">
            <div class="race-bottom-left">${bottomLeftContent}</div>
          </div>
        `;

        // Append the bottom right box AFTER setting innerHTML
        const raceBottom = card.querySelector('.race-bottom');
        raceBottom.appendChild(raceBottomRight);

        raceGrid.appendChild(card);
      });

      eventWrapper.appendChild(raceGrid);
      calendarContainer.appendChild(eventWrapper);

      // Append Flight Club block separately
      if (flightClubRows.length > 0) {
        const fcWrapper = document.createElement('div');
        fcWrapper.classList.add('event-wrapper');

        const fcHeader = document.createElement('div');
        fcHeader.classList.add('event-header');
        fcHeader.innerHTML = `<div class="fc-event-header-content"><strong>Flight Club</strong></div>`;

        fcWrapper.appendChild(fcHeader);
        flightClubRows.forEach(row => fcWrapper.appendChild(row));
        calendarContainer.appendChild(fcWrapper);
      }
    });

    document.getElementById('loading-spinner-race-calendar').style.display = 'none';
  } catch (error) {
    console.error('Failed to load calendar data:', error);
    document.querySelector('#calendar-grid').innerHTML = '<div class="error">Failed to load calendar.</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadCalendarData);
