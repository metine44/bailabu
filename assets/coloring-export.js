(function () {
  'use strict';
  window.downloadColoring = async function (svg, id, state) {
    if (!window.Blob || !URL.createObjectURL) throw new Error('Download unavailable');
    const copy = svg.cloneNode(true);
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // Focus outlines and interaction attributes are never part of the exported artwork.
    copy.querySelectorAll('[tabindex]').forEach(n => {
      ['tabindex', 'role', 'aria-label'].forEach(a => n.removeAttribute(a));
      n.removeAttribute('class');
    });
    const source = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = source; });
      const canvas = document.createElement('canvas');
      canvas.width = 1200; canvas.height = Math.round(1200 * svg.viewBox.baseVal.height / svg.viewBox.baseVal.width);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (state) {
        const drawing = document.createElement('canvas');
        window.BailabuDrawing.render(drawing, state, canvas.width, canvas.height);
        ctx.drawImage(drawing, 0, 0);
      }
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Image unavailable');
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = `bailabu-${id}.png`; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } finally { URL.revokeObjectURL(source); }
  };
})();
