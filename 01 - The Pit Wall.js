// ==========================
// CONFIG & GLOBAL VARIABLES
// ==========================

// URL to the CSV file published from Google Sheets
const standingsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=368672798";

// Used to escape HTML for safety
const escapeHTML = str => str.replace(/[&<>"']/g,
  ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

// Event and countdown variables
let currentEvent = null;
let liveMode = false;
let countdownInterval = null;


// ==================================
// LOAD STANDINGS FROM GOOGLE SHEETS
// ==================================

async function loadStandingsData() {
  try {
    const response = await fetch(standingsUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    if (rows.length < 2) throw new Error('Not enough data in CSV');

    const teamBody = document.querySelector('#pw-team-standings tbody');
    const driverBody = document.querySelector('#pw-driver-standings tbody');

    teamBody.innerHTML = '';
    driverBody.innerHTML = '';

    const teamData = [];
    const driverData = [];

    // Loop through CSV rows and collect team/driver data
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split(',').map(cell => escapeHTML(cell.trim()));
      if (cells.length < 12) continue;

      // Team data
      if (cells[1]) {
        teamData.push({
          pos: cells[0] || '',
          name: cells[1],
          points: cells[2] || ''
        });
      }

      // Driver data
      if (cells[5]) {
        driverData.push({
          pos: cells[4] || '',
          name: cells[5],
          points: cells[6] || ''
        });
      }

      // Break when reaching "Event Number" header
      if (cells[0].toLowerCase().includes("event number")) break;
    }

    // Sort standings by points
    teamData.sort((a, b) => parseFloat(b.points) - parseFloat(a.points));
    driverData.sort((a, b) => parseFloat(b.points) - parseFloat(a.points));

    // Reassign positions after sorting
    teamData.forEach((entry, index) => entry.pos = index + 1);
    driverData.forEach((entry, index) => entry.pos = index + 1);

    // Render to table
    function renderStandings(data, container, colspan) {
      data.forEach(entry => {
        const row = document.createElement('tr');
        row.classList.add('hover-row');
        row.innerHTML = `
          <td class="pw-rank-pos">${entry.pos}</td>
          <td class="mb-divider-cell"></td>
          <td class="pw-drivers-names">${entry.name}</td>
          <td class="pw-total-points">${entry.points}</td>
        `;
        container.appendChild(row);

        const spacer = document.createElement('tr');
        spacer.classList.add('spacer-row');
        spacer.innerHTML = `<td colspan="${colspan}"></td>`;
        container.appendChild(spacer);
      });
    }

    renderStandings(teamData, teamBody, 4);
    renderStandings(driverData, driverBody, 4);

    // Show tables and hide loading spinners
    document.getElementById('pw-team-standings').style.display = 'table';
    document.getElementById('pw-driver-standings').style.display = 'table';
    document.getElementById('loading-spinner-standings-teams').style.display = 'none';
    document.getElementById('loading-spinner-standings-drivers').style.display = 'none';

    // Load next event for countdown
    loadNextEvent(rows);

  } catch (error) {
    console.error('Failed to load standings data:', error);

    document.querySelector('#pw-team-standings tbody').innerHTML = `
      <tr><td colspan="4" class="error">Error: ${error.message}</td></tr>
    `;
    document.querySelector('#pw-driver-standings tbody').innerHTML = `
      <tr><td colspan="4" class="error">Error: ${error.message}</td></tr>
    `;
  }
}


// ============================
// EVENT & COUNTDOWN FUNCTIONS
// ============================

// Load next upcoming event from CSV rows
function loadNextEvent(rows) {
  try {
    const eventHeaderIndex = rows.findIndex(row =>
      row.toLowerCase().includes("event number")
    );
    if (eventHeaderIndex === -1) return;

    const today = new Date();
    for (let i = eventHeaderIndex + 1; i < rows.length; i++) {
      const cells = rows[i].split(',').map(c => c.trim());
      if (cells.length < 12) continue;

      const eventNum = cells[8];
      const eventDate = cells[9];
      const eventLocation = cells[10];
      const eventTime = cells[11];

      if (!eventNum || !eventDate || !eventLocation || !eventTime) continue;

      const eventDateTime = new Date(`${eventDate} ${eventTime} :00+01:00`);
      if (isNaN(eventDateTime.getTime())) continue;

      if (eventDateTime > today || isEventLive(eventDateTime)) {
        currentEvent = {
          dateTime: eventDateTime,
          location: eventLocation,
          date: eventDate,
          time: eventTime
        };
        break;
      }
    }

    // Display countdown
    if (currentEvent) {
      document.getElementById('event-location').textContent = currentEvent.location;
      document.getElementById('event-date').textContent = `${currentEvent.date} at ${currentEvent.time}`;

      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(updateCountdown, 1000);
    } else {
      setToNoUpcomingEvent();
    }

  } catch (err) {
    console.error("Error loading event data:", err);
  }
}

// Update countdown every second
function updateCountdown() {
  const now = new Date();
  const eventTime = currentEvent.dateTime;
  const raceDayEl = document.getElementById('event-date');

  const isToday = now.toDateString() === eventTime.toDateString();
  if (isToday && !liveMode) {
    raceDayEl.textContent = "It's Race Day!";
  }

  const threeHours = 1000 * 60 * 60 * 3;
  const msSinceStart = now - eventTime;
  const inLiveWindow = msSinceStart >= 0 && msSinceStart < threeHours;

  if (inLiveWindow) {
    showLiveMode();
    return;
  }

  if (msSinceStart >= threeHours) {
    clearInterval(countdownInterval);
    liveMode = false;
    loadStandingsData(); // Reload data
    return;
  }

  const diff = eventTime - now;
  const remaining = Math.max(0, diff);

  if (remaining < 1000 * 60 * 60 * 24) {
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    setTimerBoxes(hours, minutes, seconds, ['Hours', 'Minutes', 'Seconds']);
  } else {
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    setTimerBoxes(days, hours, minutes, ['Days', 'Hours', 'Minutes']);
  }
}

// Set values and labels for countdown boxes
function setTimerBoxes(val1, val2, val3, labels) {
  document.getElementById('days').textContent = val1;
  document.getElementById('hours').textContent = val2;
  document.getElementById('minutes').textContent = val3;

  const labelEls = document.querySelectorAll('.countdown-boxes .label');
  labelEls[0].textContent = labels[0];
  labelEls[1].textContent = labels[1];
  labelEls[2].textContent = labels[2];
}

// Show LIVE mode box
function showLiveMode() {
  liveMode = true;
  const container = document.querySelector('.countdown-boxes');
  const labels = document.querySelectorAll('.countdown-boxes .label');
  container.innerHTML = `<div class="count-box live-box">LIVE</div>`;
  labels.forEach(label => label.style.display = 'none');
}

// Fallback if there are no future events
function setToNoUpcomingEvent() {
  document.getElementById('event-location').textContent = "TBD";
  document.getElementById('event-date').textContent = "No upcoming events";
  ['days', 'hours', 'minutes'].forEach(id => {
    document.getElementById(id).textContent = '--';
  });
}

// Check if current time is within 3 hours after event start
function isEventLive(eventDateTime) {
  const now = new Date();
  const diff = now - eventDateTime;
  return diff >= 0 && diff <= 1000 * 60 * 60 * 3;
}


// =====================
// START ON PAGE LOAD
// =====================

document.addEventListener('DOMContentLoaded', () => {
  loadStandingsData();
});
