(function () {
  let currentEvent = null;
  let liveMode = false;
  let countdownInterval = null;

  async function loadUpcomingEvent() {
    try {
      if (countdownInterval) clearInterval(countdownInterval);
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

      const headerIndex = rows.findIndex(row =>
        row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes("event date"))
      );
      if (headerIndex === -1)
        throw new Error("Couldn't find header row containing 'Event Date'");

      const headerRow = rows[headerIndex].map(c => (c || '').toString().trim().toLowerCase());
      let colDate = headerRow.findIndex(h => h.includes('event date') || h === 'date');
      let colLocation = headerRow.findIndex(h => h.includes('location'));
      let colLayout = headerRow.findIndex(h => h.includes('layout'));
      let colTime = headerRow.findIndex(h => h.includes('time'));
      let colClass1 = headerRow.findIndex(h => h.includes('class 1'));
      let colClass2 = headerRow.findIndex(h => h.includes('class 2'));
      if (colDate === -1 && headerRow.length >= 5) colDate = 4;
      if (colLocation === -1 && headerRow.length >= 6) colLocation = 5;
      if (colLayout === -1 && headerRow.length >= 7) colLayout = 6;
      if (colTime === -1 && headerRow.length >= 8) colTime = 7;
      if (colClass1 === -1 && headerRow.length >= 9) colClass1 = 8;
      if (colClass2 === -1 && headerRow.length >= 10) colClass2 = 9;

      const today = new Date();

      for (let i = headerIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length <= Math.max(colDate, colLocation, colTime)) continue;

        const dateStr = (row[colDate] || '').trim();
        const locationStr = (row[colLocation] || '').trim();
        const layoutStr = (row[colLayout] || '').trim();
        const timeStr = (row[colTime] || '').trim();
        const class1Str = (row[colClass1] || '').trim();
        const class2Str = (row[colClass2] || '').trim();


        if (!dateStr || !locationStr || !timeStr) continue;

        const eventDateTime = parseDateTimeLondon(dateStr, timeStr);
        if (!eventDateTime || isNaN(eventDateTime.getTime())) continue;

        if (eventDateTime > today || isEventLive(eventDateTime)) {
          currentEvent = { dateTime: eventDateTime, location: locationStr, layout: layoutStr, date: dateStr, time: timeStr,  class1: class1Str, class2: class2Str };
          break;
        }
      }

      if (currentEvent) {
        const ukTime = currentEvent.dateTime.toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
        });
        const viewerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const isUKViewer = viewerTZ === 'Europe/London' || viewerTZ === 'GMT' || viewerTZ.startsWith('GB');

        document.getElementById('event-location').textContent = `${currentEvent.location} (${currentEvent.layout})`;
        document.getElementById('event-date').textContent = `${currentEvent.date}`;
        document.getElementById('event-car').textContent = `${currentEvent.class1}/${currentEvent.class2}`;

        console.log('📅 Event in UK Time:', currentEvent.date, currentEvent.time);
        console.log('🕒 UK datetime (ISO):', currentEvent.dateTime.toISOString());
        console.log('🌍 Viewer timezone:', viewerTZ);
        console.log('⏱ Countdown based on UK time regardless of viewer');

        countdownInterval = setInterval(updateCountdown, 1000);
      } else setToNoUpcomingEvent();
    } catch (err) {
      console.error('Error loading event data:', err);
      setToNoUpcomingEvent();
    }
  }

  // Countdown logic
  function updateCountdown() {
    if (!currentEvent) return;
    const now = new Date();
    const eventTime = currentEvent.dateTime;

    if (now.toDateString() === eventTime.toDateString() && !liveMode)
      document.getElementById('event-date').textContent = "It's Race Day!";

    const threeHours = 1000 * 60 * 60 * 3;
    const msSinceStart = now - eventTime;

    if (msSinceStart >= 0 && msSinceStart < threeHours) return showLiveMode();
    if (msSinceStart >= threeHours) return clearInterval(countdownInterval);

    const diff = Math.max(0, eventTime - now);
    if (diff < 1000 * 60 * 60 * 24) {
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimerBoxes(h, m, s, ['Hours', 'Minutes', 'Seconds']);
    } else {
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimerBoxes(d, h, m, ['Days', 'Hours', 'Minutes']);
    }
  }

  function setTimerBoxes(a, b, c, labels) {
    document.getElementById('days').textContent = a;
    document.getElementById('hours').textContent = b;
    document.getElementById('minutes').textContent = c;
    const els = document.querySelectorAll('.countdown-boxes .label');
    if (els.length >= 3) [0,1,2].forEach(i => els[i].textContent = labels[i]);
  }

  function showLiveMode() {
    liveMode = true;
    document.querySelector('.countdown-boxes').innerHTML = '<div class="count-box live-box">LIVE</div>';
  }

  function setToNoUpcomingEvent() {
    document.getElementById('event-location').textContent = "TBD";
    document.getElementById('event-date').textContent = "No upcoming events";
    ['days','hours','minutes'].forEach(id => document.getElementById(id).textContent = '--');
  }

  function isEventLive(dt) {
    const now = new Date();
    const diff = now - dt;
    return diff >= 0 && diff <= 1000 * 60 * 60 * 3;
  }

  // --- Parse all dates as Europe/London time (so countdown fixed globally) ---
  function parseDateTimeLondon(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;

    const parts = dateStr.replace(',', '').split(/\s+/);
    if (parts.length < 2) return null;
    const day = parseInt(parts[0]);
    const monthMap = { january:0,february:1,march:2,april:3,may:4,june:5,
      july:6,august:7,september:8,october:9,november:10,december:11 };
    const month = monthMap[parts[1].toLowerCase()];
    const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
    const [hh, mm] = timeStr.split(':').map(x => parseInt(x)||0);

    // Construct time as if it's in Europe/London, then convert to UTC
    const candidate = Date.UTC(year, month, day, hh, mm);
    const offset = getTzOffsetMs(new Date(candidate), 'Europe/London');
    const utcMs = candidate - offset;
    return new Date(utcMs);
  }

  function getTzOffsetMs(date, tz) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour:'2-digit',minute:'2-digit',second:'2-digit',
      year:'numeric',month:'2-digit',day:'2-digit',hour12:false
    });
    const parts = Object.fromEntries(fmt.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    const asUTC = Date.UTC(parts.year, parts.month-1, parts.day, parts.hour, parts.minute, parts.second);
    return asUTC - date.getTime();
  }

  // --- CSV parser ---
  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const out = [];
    for (const rawLine of lines) {
      const fields = []; let cur = '', inQuotes = false;
      for (let i=0;i<rawLine.length;i++){
        const ch=rawLine[i];
        if(ch==='"'){ if(inQuotes && rawLine[i+1]==='"'){cur+='"';i++;} else inQuotes=!inQuotes; }
        else if(ch===','&&!inQuotes){fields.push(cur);cur='';}
        else cur+=ch;
      }
      fields.push(cur);
      const trimmed = fields.map(f=>f.trim());
      if(trimmed.some(c=>c)) out.push(trimmed);
    }
    return out;
  }

  document.addEventListener('DOMContentLoaded', loadUpcomingEvent);
})();
