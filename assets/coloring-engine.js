/* Pure, bounded per-picture session state; shared by UI and Node checks. */
(function (root) {
  'use strict';
  const LIMIT = 80;
  const validColor = c => /^#[0-9a-f]{6}$/i.test(c);
  function validPicture(p) {
    return !!p && /^[a-z][a-z0-9-]*$/.test(p.id) && Number.isFinite(p.width) && p.width > 0 && p.width <= 2000 &&
      Number.isFinite(p.height) && p.height > 0 && p.height <= 2000 &&
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.ink) && Array.isArray(p.regions) && p.regions.length > 0 &&
      p.regions.length <= 60 && p.regions.every(r => r && /^[a-z][a-z0-9-]*$/.test(r.id) && typeof r.d === 'string' &&
        /^[MLZmlz0-9.,\s-]+$/.test(r.d) && validColor(r.defaultColor)) &&
      new Set(p.regions.map(r => r.id)).size === p.regions.length;
  }
  function create(p) {
    if (!validPicture(p)) throw new Error('Invalid picture');
    return { picture: p.id, color: '#3db8f5', defaults: Object.fromEntries(p.regions.map(r => [r.id, r.defaultColor])),
      fills: Object.fromEntries(p.regions.map(r => [r.id, r.defaultColor])), past: [], future: [] };
  }
  function change(s, action) {
    if (action.type === 'select') return validColor(action.color) ? { ...s, color: action.color } : s;
    if (action.type === 'undo' && s.past.length) return { ...s, fills: s.past.at(-1), past: s.past.slice(0, -1), future: [s.fills, ...s.future].slice(0, LIMIT) };
    if (action.type === 'redo' && s.future.length) return { ...s, fills: s.future[0], past: [...s.past, s.fills].slice(-LIMIT), future: s.future.slice(1) };
    let fills;
    if (action.type === 'fill' && Object.hasOwn(s.fills, action.region)) fills = { ...s.fills, [action.region]: s.color };
    if (action.type === 'reset') fills = { ...s.defaults };
    if (!fills || Object.keys(fills).every(k => fills[k] === s.fills[k])) return s;
    return { ...s, fills, past: [...s.past, s.fills].slice(-LIMIT), future: [] };
  }
  const api = { LIMIT, validPicture, create, change };
  if (typeof module !== 'undefined') module.exports = api;
  else root.BailabuColoring = api;
})(globalThis);
