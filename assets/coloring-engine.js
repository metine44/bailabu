/* Pure, bounded per-picture session state; shared by UI and Node checks. */
(function (root) {
  'use strict';
  const LIMIT = 80, MAX_STROKES = 160, MAX_POINTS = 1024;
  const SIZES = { small: 8, medium: 20, large: 40 };
  const BLANK = { id: 'blank', width: 800, height: 1000, blank: true, modes: { color:false, draw:true }, regions: [] };
  const MAX_SESSION_POINTS = 300000, MAX_SESSION_STROKES = 800;
  const validColor = c => /^#[0-9a-f]{6}$/i.test(c);
  const validPath = d => typeof d === 'string' && d.length <= 100000 && /^[MLHVCAQSTZmlhvcaqstz0-9.,\s-]+$/.test(d);
  const capabilities = p => p.modes || { color: p.regions.length > 0, draw:true };
  function validPicture(p) {
    return !!p && /^[a-z][a-z0-9-]*$/.test(p.id) && Number.isFinite(p.width) && p.width > 0 && p.width <= 2000 &&
      Number.isFinite(p.height) && p.height > 0 && p.height <= 2000 &&
      Array.isArray(p.regions) && typeof capabilities(p).color === 'boolean' && capabilities(p).draw === true &&
      capabilities(p).color === (p.regions.length > 0) &&
      ((p.id === 'blank' && p.blank === true && p.regions.length === 0 && !p.ink && !p.vector) ||
      (p.vector === true && !p.ink && p.regions.length > 0 && Array.isArray(p.decoration) && p.decoration.every(validPath) &&
        Array.isArray(p.underlay) && p.underlay.every(validPath)) ||
      (!p.vector && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.ink) && (p.modes || p.regions.length > 0))) &&
      p.regions.length <= 60 && p.regions.every(r => r && /^[a-z][a-z0-9-]*$/.test(r.id) && typeof r.d === 'string' &&
        validPath(r.d) && /[Zz]\s*$/.test(r.d) && validColor(r.defaultColor)) &&
      new Set(p.regions.map(r => r.id)).size === p.regions.length;
  }
  function create(p) {
    if (!validPicture(p)) throw new Error('Invalid picture');
    return { picture: p.id, width: p.width, height: p.height, modes: capabilities(p), mode: capabilities(p).color ? 'color' : 'draw', tool: 'brush', size: 'medium', color: '#3db8f5',
      defaults: Object.fromEntries(p.regions.map(r => [r.id, r.defaultColor])),
      fills: Object.fromEntries(p.regions.map(r => [r.id, r.defaultColor])), strokes: [], past: [], future: [] };
  }
  const snapshot = s => ({ fills: s.fills, strokes: s.strokes });
  // Reject outside samples: the UI ends the gesture at its first exit, never joins a re-entry.
  function point(s, rect, x, y) {
    if (![x,y,rect.left,rect.top,rect.width,rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) return null;
    const px = (x - rect.left) * s.width / rect.width, py = (y - rect.top) * s.height / rect.height;
    return px >= 0 && px <= s.width && py >= 0 && py <= s.height ? { x: px, y: py } : null;
  }
  function validStroke(s, stroke) {
    return stroke && ['brush','crayon','eraser'].includes(stroke.tool) && validColor(stroke.color) &&
      Object.values(SIZES).includes(stroke.width) && Array.isArray(stroke.points) && stroke.points.length > 0 &&
      stroke.points.length <= MAX_POINTS && stroke.points.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
        p.x >= 0 && p.x <= s.width && p.y >= 0 && p.y <= s.height);
  }
  function change(s, action) {
    if (action.type === 'select') return validColor(action.color) ? { ...s, color: action.color } : s;
    if (action.type === 'mode') return s.modes[action.mode] === true ? { ...s, mode: action.mode } : s;
    if (action.type === 'tool') return ['brush','crayon','eraser'].includes(action.tool) ? { ...s, tool: action.tool } : s;
    if (action.type === 'size') return Object.hasOwn(SIZES, action.size) ? { ...s, size: action.size } : s;
    if (action.type === 'undo' && s.past.length) return { ...s, ...s.past.at(-1), past: s.past.slice(0, -1), future: [snapshot(s), ...s.future].slice(0, LIMIT) };
    if (action.type === 'redo' && s.future.length) return { ...s, ...s.future[0], past: [...s.past, snapshot(s)].slice(-LIMIT), future: s.future.slice(1) };
    let fills = s.fills, strokes = s.strokes;
    if (action.type === 'fill' && Object.hasOwn(s.fills, action.region)) fills = { ...s.fills, [action.region]: s.color };
    if (action.type === 'stroke' && s.strokes.length < MAX_STROKES && validStroke(s, action.stroke)) {
      const st = action.stroke;
      strokes = [...s.strokes, { tool: st.tool, color: st.color, width: st.width, points: st.points.map(p => ({ x: p.x, y: p.y })) }];
    }
    if (action.type === 'reset') { fills = { ...s.defaults }; strokes = []; }
    if (strokes === s.strokes && Object.keys(fills).every(k => fills[k] === s.fills[k])) return s;
    if (action.type === 'reset' && !s.strokes.length && Object.keys(fills).every(k => fills[k] === s.fills[k])) return s;
    return { ...s, fills, strokes, past: [...s.past, snapshot(s)].slice(-LIMIT), future: [] };
  }
  function sessionRoom(sessions, incoming) {
    const strokes = new Set();
    for (const s of sessions) {
      for (const snapshot of [s, ...s.past, ...s.future]) for (const stroke of snapshot.strokes) strokes.add(stroke);
    }
    return strokes.size < MAX_SESSION_STROKES && [...strokes].reduce((n,s)=>n+s.points.length,0) + incoming.points.length <= MAX_SESSION_POINTS;
  }
  const api = { LIMIT, MAX_STROKES, MAX_POINTS, MAX_SESSION_POINTS, MAX_SESSION_STROKES, SIZES, BLANK, capabilities, sessionRoom, validPicture, validStroke, point, create, change };
  if (typeof module !== 'undefined') module.exports = api;
  else root.BailabuColoring = api;
})(globalThis);
