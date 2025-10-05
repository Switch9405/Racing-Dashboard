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
      const response = await fetch(standingsUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const csv = await response.text();
      const rows = csv.split('\n').filter(r => r.trim() !== '');
      if (rows.length < 2) throw new Error('Not enough data in CSV');

      const eventHeaderIndex = rows.findIndex(row =>
        row.toLowerCase().includes("event number")
      );
      if (eventHeaderIndex === -1) return;

      const today = new Date();
      for (let i = eventHeaderIndex + 1; i < rows.length; i++) {
        const cells = rows[i].split(',').map(c => c.trim());
        if (cells.length < 12) continue;

        const eventNum = cells[0];
        const eventDate = cells[9];
        const eventLocation = cells[10];
        const eventTime = cells[11];
        if (!eventNum || !eventDate || !eventLocation || !eventTime) continue;

        const eventDateTime = new Date(`${eventDate} ${eventTime}:00+01:00`);
        if (isNaN(eventDateTime.getTime())) continue;

        if (eventDateTime > today || isEventLive(eventDateTime)) {
          currentEvent = { dateTime: eventDateTime, location: eventLocation, date: eventDate, time: eventTime };
          break;
        }
      }

      if (currentEvent) {
        document.getElementById('event-location').textContent = currentEvent.location;
        document.getElementById('event-date').textContent = `${currentEvent.date} at ${currentEvent.time}`;
        countdownInterval = setInterval(updateCountdown, 1000);
      } else {
        setToNoUpcomingEvent();
      }
    } catch (error) {
      console.error("Error loading event data:", error);
      setToNoUpcomingEvent();
    }
  }

  function updateCountdown() {
    const now = new Date();
    const eventTime = currentEvent.dateTime;

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
    labelEls[0].textContent = labels[0];
    labelEls[1].textContent = labels[1];
    labelEls[2].textContent = labels[2];
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

  window.loadUpcomingEvent = loadUpcomingEvent;
  document.addEventListener('DOMContentLoaded', loadUpcomingEvent);
})();
