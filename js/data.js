/* ============================================================
   DataService — loads and caches competitions.json
   ============================================================ */

(function () {
  'use strict';

  var _cache = null;

  async function fetchData() {
    if (_cache) return _cache;
    const res = await fetch('/data/competitions.json');
    if (!res.ok) throw new Error('Failed to load competition data');
    _cache = await res.json();
    return _cache;
  }

  async function getCompetitions() {
    const data = await fetchData();
    return data.competitions || [];
  }

  async function getCompetition(id) {
    const competitions = await getCompetitions();
    return competitions.find(function (c) { return c.id === id; }) || null;
  }

  async function getClass(competitionId, classId) {
    const competition = await getCompetition(competitionId);
    if (!competition) return null;
    return (competition.classes || []).find(function (cl) { return cl.id === classId; }) || null;
  }

  window.DataService = {
    getCompetitions: getCompetitions,
    getCompetition: getCompetition,
    getClass: getClass
  };
})();
