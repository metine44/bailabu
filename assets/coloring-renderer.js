/* Shared deterministic drawing renderer. Erasing happens only on this transparent layer. */
(function () {
  'use strict';
  function stroke(ctx, st, from = 0) {
    if (from >= st.points.length) return;
    const points = st.points.slice(Math.max(0, from - 1));
    if (!points.length) return;
    const a = points[0];
    ctx.save();
    ctx.globalCompositeOperation = st.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = st.color; ctx.fillStyle = st.color;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function line(width, offset, alpha, dash) {
      ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(a.x + offset, a.y);
      if (points.length === 1) {
        ctx.arc(a.x + offset, a.y, width / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x + offset, points[i].y);
        ctx.stroke();
      }
    }
    if (st.tool === 'crayon') {
      line(st.width * .85, 0, .28, []);
      // Fixed translucent wax ridges: no random textures, identical on replay/export.
      for (let i = -2; i <= 2; i++) line(st.width * .09, i * st.width * .16, .45, [st.width * .2, st.width * .13]);
    } else line(st.width, 0, 1, []);
    ctx.restore();
  }
  function render(canvas, state, width, height) {
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,width,height);
    ctx.setTransform(width / state.width,0,0,height / state.height,0,0);
    state.strokes.forEach(st => stroke(ctx, st)); return ctx;
  }
  window.BailabuDrawing = { stroke, render };
})();
