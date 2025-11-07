(function () {
  const escapeHTML = str =>
    str.replace(/[&<>"']/g, ch =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
    );

  async function loadTeamStandings() {
    try {
      const standingsUrl = SeasonManager.getUrl("pitwallteams", "Active");
      const response = await fetch(standingsUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const csv = await response.text();
      const rows = csv.split('\n').filter(r => r.trim() !== '');
      if (rows.length < 2) throw new Error('Not enough data in CSV');

      const teamData = [];
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split(',').map(cell => escapeHTML(cell.trim()));
        if (cells.length < 12) continue;

        if (cells[1]) {
          teamData.push({
            pos: cells[0] || '',
            name: cells[1],
            points: cells[2] || ''
          });
        }
        if (cells[0].toLowerCase().includes("event number")) break;
      }

      teamData.sort((a, b) => parseFloat(b.points) - parseFloat(a.points));
      teamData.forEach((entry, index) => entry.pos = index + 1);

      const teamBody = document.querySelector('#pw-team-standings tbody');
      teamBody.innerHTML = '';
      teamData.forEach(entry => {
        const row = document.createElement('tr');
        row.classList.add('hover-row');
        row.innerHTML = `
          <td class="pw-rank-pos">${entry.pos}</td>
          <td class="mb-divider-cell"></td>
          <td class="pw-drivers-names">${entry.name}</td>
          <td class="pw-total-points">${entry.points}</td>`;
        teamBody.appendChild(row);

        const spacer = document.createElement('tr');
        spacer.classList.add('spacer-row');
        spacer.innerHTML = '<td colspan="4"></td>';
        teamBody.appendChild(spacer);
      });

      document.getElementById('pw-team-standings').style.display = 'table';
      document.getElementById('loading-spinner-standings-teams').style.display = 'none';
    } catch (error) {
      console.error(error);
      document.querySelector('#pw-team-standings tbody').innerHTML = `
        <tr><td colspan="4" class="error">Error: ${error.message}</td></tr>`;
    }
  }

  window.loadTeamStandings = loadTeamStandings;
  document.addEventListener('DOMContentLoaded', loadTeamStandings);
})();
