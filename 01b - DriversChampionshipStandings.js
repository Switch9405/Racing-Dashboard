(function() {
  const standingsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv&gid=368672798";

  const escapeHTML = str => str.replace(/[&<>"']/g,
    ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

  async function loadDriverStandings() {
    try {
      const response = await fetch(standingsUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const csv = await response.text();
      const rows = csv.split('\n').filter(r => r.trim() !== '');
      if (rows.length < 2) throw new Error('Not enough data in CSV');

      const driverData = [];
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split(',').map(cell => escapeHTML(cell.trim()));
        if (cells.length < 12) continue;

        if (cells[5]) {
          driverData.push({ pos: cells[4] || '', name: cells[5], points: cells[6] || '' });
        }
        if (cells[0].toLowerCase().includes("event number")) break;
      }

      driverData.sort((a, b) => parseFloat(b.points) - parseFloat(a.points));
      driverData.forEach((entry, index) => entry.pos = index + 1);

      const driverBody = document.querySelector('#pw-driver-standings tbody');
      driverBody.innerHTML = '';
      driverData.forEach(entry => {
        const row = document.createElement('tr');
        row.classList.add('hover-row');
        row.innerHTML = `
          <td class="pw-rank-pos">${entry.pos}</td>
          <td class="mb-divider-cell"></td>
          <td class="pw-drivers-names">${entry.name}</td>
          <td class="pw-total-points">${entry.points}</td>`;
        driverBody.appendChild(row);

        const spacer = document.createElement('tr');
        spacer.classList.add('spacer-row');
        spacer.innerHTML = '<td colspan="4"></td>';
        driverBody.appendChild(spacer);
      });
      document.getElementById('pw-driver-standings').style.display = 'table';
      document.getElementById('loading-spinner-standings-drivers').style.display = 'none';
    } catch (error) {
      console.error(error);
      document.querySelector('#pw-driver-standings tbody').innerHTML = `
        <tr><td colspan="4" class="error">Error: ${error.message}</td></tr>`;
    }
  }

  document.addEventListener('DOMContentLoaded', loadDriverStandings);
})();
