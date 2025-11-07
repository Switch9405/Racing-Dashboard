// seasonManager.js
const SeasonManager = (function () {
  const DEFAULT_SEASON = "Active";

  // Base sheet per season
  const baseUrls = {
    "Season 1": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTc9v5XVRiJzio636UufyeErMW5oKGuW4NhZTOrKmkK191NeNZtsVW-CNAA5QEVJJ316aq6eMe77cVb/pub?output=csv",
    "Active":   "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCpD4P7hsdJXV-7Im8nxzWP-O8hakVp-9NHmKWRnmshWzZXxYdnKLcV6JgdFaXCv_vAVERiqrdbvPr/pub?output=csv"
  };

  // gid values per data type (same for all seasons)
  const gids = {
    pitwallteams:    "368672798",
    pitwalldrivers:  "368672798",
    pitwallevents:   "1994956112",
    racecalendar: "1246590172",  
    tabledrivers: "1594244845",
    tableteams: "1594244845",
    tableresults: "1488323674"
  };

  // Load season from storage or default
  let currentSeason = localStorage.getItem("mlc-season") || DEFAULT_SEASON;

  function setSeason(season) {
    if (baseUrls[season]) {
      currentSeason = season;
      localStorage.setItem("mlc-season", season);
      document.querySelectorAll(".season-text").forEach(el => {
        el.textContent = currentSeason;
      });
    }
  }

  function getSeason() {
    return currentSeason;
  }

  /**
   * Build the URL for a given data type.
   * @param {string} type - One of "teams", "drivers", "events", "calendar".
   * @param {string} [seasonOverride] - Optional season (e.g. "Active").
   *                                    If omitted, uses currentSeason.
   */
  function getUrl(type, seasonOverride) {
    const season = seasonOverride || currentSeason;
    const base = baseUrls[season];
    const gid = gids[type];
    if (!base || !gid) throw new Error(`Missing URL config for ${type} in ${season}`);
    return `${base}&gid=${gid}`;
  }

  return { setSeason, getSeason, getUrl };
})();

window.SeasonManager = SeasonManager;
