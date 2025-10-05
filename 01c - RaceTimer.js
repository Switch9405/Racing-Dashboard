(function () {
  let currentEvent = null;
  let liveMode = false;
  let countdownInterval = null;

  async function loadUpcomingEvent() {
    try {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      currentEvent = null;
      liveMode = false;

      document.getElementById('event-location').textContent = "Loading...";
      document.getElementById('event-date').textContent = "Loading...";
      ['days', 'hours', 'minutes'].forEach(id => {
        document.getElementById(id).textContent = '--';
      });

      const standingsUrl = SeasonManager.getUrl("pitwallevents", "Active");
      console.log("Fetching:", standingsUrl);
      const resp = await fetch(standingsUrl);
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);

      const csvText = await resp.text();
      const rows = parseCSV(csvText);
      console.log("CSV rows loaded:", rows.length);
      console.table(rows.slice(0, 8));

      // find header row (contains "Event Date")
      const headerIndex = rows.findIndex(row =>
        row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes("event date"))
      );
      if (headerIndex === -1) {
        throw new Error("Couldn't find header row containing 'Event Date'");
      }

      const headerRow = rows[headerIndex].map(c => (c || '').toString().trim().toLowerCase());

      // detect columns by header names (fallback to expected offsets if not detected)
      let colDate = headerRow.findIndex(h => h.includes('event date') || h === 'date');
      let colLocation = headerRow.findIndex(h => h.includes('location'));
      let colTime = headerRow.findIndex(h => h.includes('time'));

      // fallback to the positions in your CSV sample (D..H => after trimming header the important data was at indexes 4/5/7)
      if (colDate === -1 && headerRow.length >= 5) colDate = 4;
      if (colLocation === -1 && headerRow.length >= 6) colLocation = 5;
      if (colTime === -1 && headerRow.length >= 8) colTime = 7;

      if (colDate === -1 || colLocation === -1 || colTime === -1) {
        throw new Error(`Could not detect required columns (date:${colDate}, location:${colLocation}, time:${colTime})`);
      }

      const today = new Date();

      // iterate rows after header, find next upcoming or live event
      for (let i = headerIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        // Ensure row has at least up to highest column index
        if (!row || row.length <= Math.max(colDate, colLocation, colTime)) continue;

        const dateStr = (row[colDate] || '').trim();
        const locationStr = (row[colLocation] || '').trim();
        const timeStr = (row[colTime] || '').trim();

        // skip if no useful data
        if (!dateStr || !locationStr || !timeStr) continue;

        const eventDateTime = parseDateTime(dateStr, timeStr);
        if (!eventDateTime || isNaN(eventDateTime.getTime())) {
          console.debug('Could not parse date/time:', dateStr, timeStr, 'row', i);
          continue;
        }

        // pick the first event that is in the future OR is currently live
        if (eventDateTime > today || isEventLive(eventDateTime)) {
          currentEvent = {
            dateTime: eventDateTime,
            location: locationStr,         // user asked to show: WHISTLE VALLEY
            date: dateStr,                 // preserve the original date string (e.g. "5 September 2025")
            time: timeStr
          };
          break;
        }
      }

      if (currentEvent) {
        document.getElementById('event-location').textContent = currentEvent.location;
        document.getElementById('event-date').textContent = `${currentEvent.date}`;
        // keep the original logic for the clock
        countdownInterval = setInterval(updateCountdown, 1000);
      } else {
        setToNoUpcomingEvent();
      }
    } catch (error) {
      console.error("Error loading event data:", error);
      setToNoUpcomingEvent();
    }
  }

  // ---------- countdown logic (left intact) ----------
  function updateCountdown() {
    if (!currentEvent) return;

    const now = new Date();
    const eventTime = currentEvent.dateTime;

    // show "It's Race Day!" if same calendar day
    if (now.toDateString() === eventTime.toDateString() && !liveMode) {
      document.getElementById('event-date').textContent = "It's Race Day!";
    }

    const threeHours = 1000 * 60 * 60 * 3;
    const msSinceStart = now - eventTime;

    if (msSinceStart >= 0 && msSinceStart < threeHours) {
      showLiveMode();
      return;
    }
    if (msSinceStart >= threeHours) {
      clearInterval(countdownInterval);
      liveMode = false;
      countdownInterval = null;
      return;
    }

    const diff = Math.max(0, eventTime - now);
    if (diff < 1000 * 60 * 60 * 24) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimerBoxes(hours, minutes, seconds, ['Hours', 'Minutes', 'Seconds']);
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimerBoxes(days, hours, minutes, ['Days', 'Hours', 'Minutes']);
    }
  }

  function setTimerBoxes(val1, val2, val3, labels) {
    document.getElementById('days').textContent = val1;
    document.getElementById('hours').textContent = val2;
    document.getElementById('minutes').textContent = val3;

    const labelEls = document.querySelectorAll('.countdown-boxes .label');
    if (labelEls.length >= 3) {
      labelEls[0].textContent = labels[0];
      labelEls[1].textContent = labels[1];
      labelEls[2].textContent = labels[2];
    }
  }

  function showLiveMode() {
    liveMode = true;
    document.querySelector('.countdown-boxes').innerHTML =
      '<div class="count-box live-box">LIVE</div>';
  }

  function setToNoUpcomingEvent() {
    document.getElementById('event-location').textContent = "TBD";
    document.getElementById('event-date').textContent = "No upcoming events";
    ['days', 'hours', 'minutes'].forEach(id => {
      document.getElementById(id).textContent = '--';
    });
  }

  function isEventLive(eventDateTime) {
    const now = new Date();
    const diff = now - eventDateTime;
    return diff >= 0 && diff <= 1000 * 60 * 60 * 3;
  }

  // ---------- Helpers ----------

  // parse date string like "5 September 2025" and time like "20:00" into a Date (local timezone)
  function parseDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    // try direct parse first (handles many locales)
    const direct = new Date(`${dateStr} ${timeStr}`);
    if (!isNaN(direct.getTime())) return direct;

    // fallback: parse "D Month YYYY"
    const parts = dateStr.trim().replace(',', '').split(/\s+/);
    if (parts.length < 2) return null;
    let day = parseInt(parts[0], 10);
    let monthName, year;
    if (isNaN(day)) {
      // maybe format "September 5 2025"
      monthName = parts[0].toLowerCase();
      day = parseInt(parts[1], 10);
      year = parts[2] ? parseInt(parts[2], 10) : (new Date()).getFullYear();
    } else {
      monthName = parts[1].toLowerCase();
      year = parts[2] ? parseInt(parts[2], 10) : (new Date()).getFullYear();
    }

    const monthMap = {
      january:0, february:1, march:2, april:3, may:4, june:5,
      july:6, august:7, september:8, october:9, november:10, december:11
    };
    const month = monthMap[monthName.toLowerCase()] ?? NaN;
    if (isNaN(month) || isNaN(day) || isNaN(year)) return null;

    const [hh, mm] = timeStr.split(':').map(n => parseInt(n, 10) || 0);
    return new Date(year, month, day, hh, mm, 0, 0);
  }

  // Robust CSV parser (handles quoted fields and commas inside quotes)
  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const out = [];
    for (const rawLine of lines) {
      // treat empty lines as empty arrays (we'll filter later)
      const line = rawLine;
      const fields = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { // escaped quote
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          fields.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      fields.push(cur);
      // trim each field
      const trimmed = fields.map(f => (f === undefined || f === null) ? '' : f.toString().trim());
      // push if line is not completely empty
      if (trimmed.some(cell => cell !== '')) out.push(trimmed);
    }
    return out;
  }

  // expose
  window.loadUpcomingEvent = loadUpcomingEvent;
  document.addEventListener('DOMContentLoaded', loadUpcomingEvent);
})();
