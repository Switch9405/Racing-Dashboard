const standingsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJNRN4O9DQ_YAtReDZzF_KFaMVkQFdqs3f5iTYaD9LNUrVQeVnv1zS0u5nvjlZzUgwLdS2wC48PuNs/pub?output=csv&gid=368672798";

const escapeHTML = str => str.replace(/[&<>"']/g, 
  ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[ch]);

async function loadStandingsData() {
  try {
    const response = await fetch(standingsUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csv = await response.text();
    const rows = csv.split('\n').filter(r => r.trim() !== '');
    if (rows.length < 2) throw new Error('Not enough data in CSV');
    
    const teamBody = document.querySelector('#team-standings tbody');
    const driverBody = document.querySelector('#drivers-standings tbody');
    const rosterBody = document.querySelector('#team-rosters tbody');
    
    teamBody.innerHTML = '';
    driverBody.innerHTML = '';
    rosterBody.innerHTML = '';
    
    const teamMap = new Map();
    const teamData = [];
    const driverData = [];
    
    // Process all rows
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split(',').map(escapeHTML);
      if (cells.length < 3) continue;
      
      // Team data (first 3 columns)
      if (cells[0] && cells[1] && cells[2]) {
        teamData.push({
          pos: cells[0],
          team: cells[1],
          points: cells[2]
        });
        teamMap.set(cells[1], []);
      }
      
      // Driver data (columns 4-6)
      if (cells[4] && cells[5] && cells[6]) {
        driverData.push({
          pos: cells[4],
          driver: cells[5],
          points: cells[6],
          team: cells[9] || '' // Team association in column 9
        });
      }
    }
    
    // Process team rosters (columns 8-10)
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split(',').map(escapeHTML);
      if (cells.length < 11) continue;
      
      if (cells[8] && cells[9] && cells[10]) {
        const team = cells[8];
        const driver1 = cells[9];
        const driver2 = cells[10];
        
        if (teamMap.has(team)) {
          teamMap.get(team).push(driver1, driver2);
        }
      }
    }
    
    // Render team standings
    teamData.forEach(team => {
      const row = document.createElement('tr');
      const posClass = ['1', '2', '3'].includes(team.pos) ? `podium-${team.pos}` : '';
      
      row.innerHTML = `
        <td class="${posClass}">${team.pos}</td>
        <td><strong>${team.team}</strong></td>
        <td><strong>${team.points}</strong></td>
      `;
      teamBody.appendChild(row);
    });
    
    // Render driver standings
    driverData.forEach(driver => {
      const row = document.createElement('tr');
      const posClass = ['1', '2', '3'].includes(driver.pos) ? `podium-${driver.pos}` : '';
      
      row.innerHTML = `
        <td class="${posClass}">${driver.pos}</td>
        <td><strong>${driver.driver}</strong></td>
        <td><strong>${driver.points}</strong></td>
      `;
      driverBody.appendChild(row);
    });
    
    // Render team rosters
    teamMap.forEach((drivers, team) => {
      if (!team || drivers.length === 0) return;
      
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td><strong>${team}</strong></td>
        <td class="team-roster">
          ${drivers.map((driver, index) => `
            <div class="driver-item">
              <span class="driver-number">${index + 1}</span>
              <span>${driver}</span>
            </div>
          `).join('')}
        </td>
      `;
      rosterBody.appendChild(row);
    });
    
  } catch (error) {
    console.error('Failed to load standings data:', error);
    
    document.querySelector('#team-standings tbody').innerHTML = `
      <tr><td colspan="3" class="error">Error: ${error.message}</td></tr>
    `;
    
    document.querySelector('#drivers-standings tbody').innerHTML = `
      <tr><td colspan="4" class="error">Error: ${error.message}</td></tr>
    `;
    
    document.querySelector('#team-rosters tbody').innerHTML = `
      <tr><td colspan="2" class="error">Error: ${error.message}</td></tr>
    `;
  }
}

document.addEventListener('DOMContentLoaded', loadStandingsData);