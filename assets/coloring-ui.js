(function () {
  'use strict';
  const root = document.querySelector('#online-coloring');
  const engine = window.BailabuColoring;
  const keys = ['title','hint','back','undo','redo','reset','more','save','print','loading','error','retry','done','saved','fallback','part','pictures','palette','red','orange','yellow','green','blue','purple','pink','white','apple','ball','star'];
  const words = {
    en: ['Color on Bailabu Island','🎨 → 👆 Choose a color, tap the picture!','Home','Undo','Redo','Start again','More','Save picture','Print on paper','Opening your picture…','This picture could not open. Try another one.','Try again','Lovely colors!','Your picture is ready.','Saving did not work here. Try another browser or color a paper picture.','Part','Choose a picture','Choose a color','Red','Orange','Yellow','Green','Blue','Purple','Pink','White','Apple','Ball','Star'],
    de: ['Malen auf der Bailabu Insel','🎨 → 👆 Farbe wählen, Bild antippen!','Start','Zurück','Wiederholen','Neu anfangen','Mehr','Bild speichern','Auf Papier malen','Dein Bild wird geöffnet…','Dieses Bild konnte nicht geöffnet werden. Probiere ein anderes.','Noch einmal','Schöne Farben!','Dein Bild ist fertig.','Speichern klappt hier nicht. Probiere einen anderen Browser oder ein Ausmalbild auf Papier.','Teil','Bild wählen','Farbe wählen','Rot','Orange','Gelb','Grün','Blau','Lila','Rosa','Weiß','Apfel','Ball','Stern'],
    es: ['Colorea en la Isla Bailabu','🎨 → 👆 ¡Elige un color y toca el dibujo!','Inicio','Deshacer','Rehacer','Empezar de nuevo','Más','Guardar dibujo','Colorear en papel','Abriendo tu dibujo…','No se pudo abrir este dibujo. Prueba otro.','Reintentar','¡Qué bonitos colores!','Tu dibujo está listo.','No se pudo guardar aquí. Prueba otro navegador o un dibujo en papel.','Parte','Elige un dibujo','Elige un color','Rojo','Naranja','Amarillo','Verde','Azul','Morado','Rosa','Blanco','Manzana','Pelota','Estrella'],
    pt: ['Pinte na Ilha Bailabu','🎨 → 👆 Escolha uma cor e toque no desenho!','Início','Desfazer','Refazer','Recomeçar','Mais','Salvar desenho','Colorir no papel','Abrindo seu desenho…','Não foi possível abrir este desenho. Tente outro.','Tentar de novo','Que cores lindas!','Seu desenho está pronto.','Não foi possível salvar aqui. Tente outro navegador ou um desenho no papel.','Parte','Escolha um desenho','Escolha uma cor','Vermelho','Laranja','Amarelo','Verde','Azul','Roxo','Rosa','Branco','Maçã','Bola','Estrela'],
    tr: ['Tontiş Ada’da boya','🎨 → 👆 Renk seç, resme dokun!','Ana sayfa','Geri al','Yinele','Yeniden başla','Diğer','Resmi kaydet','Kağıtta boya','Resmin açılıyor…','Bu resim açılamadı. Başka bir resim dene.','Tekrar dene','Ne güzel renkler!','Resmin hazır.','Burada kaydedilemedi. Başka bir tarayıcı veya kağıt boyama sayfası dene.','Bölüm','Resim seç','Renk seç','Kırmızı','Turuncu','Sarı','Yeşil','Mavi','Mor','Pembe','Beyaz','Elma','Top','Yıldız'],
    ar: ['لوّن في جزيرة بايلابو','🎨 → 👆 اختر لونًا والمس الصورة!','الرئيسية','تراجع','إعادة','ابدأ من جديد','المزيد','حفظ الصورة','لوّن على الورق','جارٍ فتح صورتك…','تعذّر فتح هذه الصورة. جرّب صورة أخرى.','حاول مجددًا','ألوان جميلة!','صورتك جاهزة.','تعذّر الحفظ هنا. جرّب متصفحًا آخر أو صورة ورقية.','جزء','اختر صورة','اختر لونًا','أحمر','برتقالي','أصفر','أخضر','أزرق','بنفسجي','وردي','أبيض','تفاحة','كرة','نجمة']
  };
  const drawKeys = ['color','draw','brush','crayon','eraser','size','small','medium','large','blank','drawHint','limit','unavailable'];
  const drawWords = {
    en: ['Color','Draw','Brush','Crayon','Eraser','Size','Small','Medium','Large','Blank page','Choose a tool and draw!','This page is full. Save it, or undo or start again.','Drawing is unavailable here. Try Color or another browser.'],
    de: ['Ausmalen','Zeichnen','Pinsel','Wachsstift','Radierer','Größe','Klein','Mittel','Groß','Leeres Blatt','Wähle ein Werkzeug und zeichne!','Dieses Blatt ist voll. Speichere es, gehe zurück oder fange neu an.','Zeichnen klappt hier nicht. Probiere Ausmalen oder einen anderen Browser.'],
    es: ['Colorear','Dibujar','Pincel','Cera','Borrador','Tamaño','Pequeño','Mediano','Grande','Hoja en blanco','¡Elige una herramienta y dibuja!','Esta hoja está llena. Guárdala, deshaz o empieza de nuevo.','No se puede dibujar aquí. Prueba Colorear u otro navegador.'],
    pt: ['Colorir','Desenhar','Pincel','Giz de cera','Borracha','Tamanho','Pequeno','Médio','Grande','Folha em branco','Escolha uma ferramenta e desenhe!','Esta folha está cheia. Salve, desfaça ou recomece.','Não é possível desenhar aqui. Tente Colorir ou outro navegador.'],
    tr: ['Boya','Çiz','Fırça','Pastel boya','Silgi','Boyut','Küçük','Orta','Büyük','Boş sayfa','Bir araç seç ve çiz!','Bu sayfa doldu. Kaydet, geri al veya yeniden başla.','Burada çizilemiyor. Boyamayı veya başka bir tarayıcıyı dene.'],
    ar: ['لوّن','ارسم','فرشاة','قلم شمع','ممحاة','الحجم','صغير','وسط','كبير','صفحة بيضاء','اختر أداة وارسم!','هذه الصفحة ممتلئة. احفظها أو تراجع أو ابدأ من جديد.','الرسم غير متاح هنا. جرّب التلوين أو متصفحًا آخر.']
  };
  const ids = ['ball', 'apple', 'star', 'blank'];
  const colors = ['#ff5a5f','#f6a23a','#ffc83d','#5cc85a','#3db8f5','#8e6cf0','#ff9cb9','#ffffff'];
  const sessions = new Map(), definitions = new Map();
  definitions.set('blank', engine.BLANK);
  let active = 'ball', ticket = 0, loaded = false, busy = false, mode = 'color';
  let gesture = null, frame = 0, resizeFrame = 0, observer;
  const $ = s => root.querySelector(s);
  const text = key => {
    const lang = document.documentElement.lang;
    return drawKeys.includes(key) ? (drawWords[lang] || drawWords.en)[drawKeys.indexOf(key)] : (words[lang] || words.en)[keys.indexOf(key)];
  };
  function button(icon, key, action) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'color-button';
    b.innerHTML = `<span aria-hidden="true">${icon}</span><span></span>`;
    b.lastElementChild.textContent = text(key); b.dataset.label = key;
    b.onclick = action; return b;
  }
  function status(key) { $('#color-status').textContent = key ? text(key) : ''; }
  function apply(action) {
    cancel();
    const state = sessions.get(active); if (!state) return;
    const next = engine.change(state, action); sessions.set(active, next); update();
    if (next !== state && action.type === 'fill' && Object.keys(next.fills).every(k => next.fills[k] !== next.defaults[k])) status('done');
    else status('');
  }
  function update() {
    const state = sessions.get(active); if (!state) return;
    root.querySelectorAll('[data-region]').forEach(p => p.setAttribute('fill', state.fills[p.dataset.region]));
    root.querySelectorAll('.swatch').forEach(b => {
      const on = b.dataset.color === state.color; b.setAttribute('aria-pressed', on); b.textContent = on ? '✓' : '';
    });
    $('#color-undo').disabled = !state.past.length; $('#color-redo').disabled = !state.future.length;
    $('#color-reset').disabled = !state.strokes.length && Object.keys(state.fills).every(k => state.fills[k] === state.defaults[k]);
    root.dataset.mode = state.mode;
    root.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === state.mode));
    root.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === state.tool));
    root.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', b.dataset.size === state.size));
    $('#draw-tools').hidden = state.mode !== 'draw'; $('#draw-sizes').hidden = state.mode !== 'draw';
    $('#color-hint').textContent = text(state.mode === 'draw' ? 'drawHint' : 'hint');
    root.querySelectorAll('[data-region]').forEach(p => p.setAttribute('tabindex', state.mode === 'draw' ? '-1' : '0'));
    resize();
  }
  function cancel() {
    if (!gesture) return;
    const old = gesture; gesture = null; cancelAnimationFrame(frame); frame = 0;
    if (old.canvas.hasPointerCapture?.(old.id)) old.canvas.releasePointerCapture(old.id);
    resize();
  }
  function resize() {
    const canvas = $('#draw-layer'), state = sessions.get(active);
    if (!canvas || !state) return;
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    if (!rect.width || !rect.height) return;
    // Bound each backing dimension as well as DPR; setTransform prevents cumulative scaling.
    const width = Math.max(1, Math.min(2400, Math.round(rect.width * dpr)));
    const height = Math.max(1, Math.min(2400, Math.round(rect.height * dpr)));
    try {
      const ctx = window.BailabuDrawing.render(canvas, state, width, height);
      if (gesture) { window.BailabuDrawing.stroke(ctx, gesture.stroke); gesture.rendered = gesture.stroke.points.length; }
    } catch { status('unavailable'); }
  }
  function scheduleResize() {
    cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; resize(); });
  }
  function paintPending() {
    frame = 0;
    if (!gesture) return;
    const ctx = gesture.canvas.getContext('2d');
    window.BailabuDrawing.stroke(ctx, gesture.stroke, gesture.rendered);
    gesture.rendered = gesture.stroke.points.length;
  }
  function finish() {
    if (!gesture) return;
    const old = gesture; gesture = null; cancelAnimationFrame(frame); frame = 0;
    if (old.canvas.hasPointerCapture?.(old.id)) old.canvas.releasePointerCapture(old.id);
    apply({ type: 'stroke', stroke: old.stroke });
  }
  function drawSurface(def) {
    const canvas = document.createElement('canvas'); canvas.id = 'draw-layer'; canvas.setAttribute('aria-hidden','true');
    canvas.onpointerdown = e => {
      const state = sessions.get(active);
      if (gesture || !e.isPrimary || e.button !== 0 || state.mode !== 'draw') return;
      if (state.strokes.length >= engine.MAX_STROKES) { status('limit'); return; }
      const p = engine.point(def, canvas.getBoundingClientRect(), e.clientX, e.clientY); if (!p) return;
      if (!canvas.getContext('2d')) { status('unavailable'); return; }
      e.preventDefault();
      gesture = { id: e.pointerId, canvas, rendered: 0,
        stroke: { tool: state.tool, color: state.color, width: engine.SIZES[state.size], points: [p] } };
      try { canvas.setPointerCapture(e.pointerId); } catch { /* Synthetic tests have no native pointer capture. */ }
      status(''); paintPending();
    };
    function sample(e) {
      const p = engine.point(def, canvas.getBoundingClientRect(), e.clientX, e.clientY);
      if (!p) { finish(); return; }
      const points = gesture.stroke.points, last = points.at(-1);
      if (Math.hypot(p.x-last.x,p.y-last.y) < .75) return;
      if (points.length === engine.MAX_POINTS) {
        // Retain both endpoints and halve dense samples, then redraw this one gesture.
        gesture.stroke.points = points.filter((_,i) => i % 2 === 0 || i === points.length-1);
        gesture.stroke.points.push(p); resize();
      } else gesture.stroke.points.push(p);
    }
    canvas.onpointermove = e => {
      if (!gesture || gesture.id !== e.pointerId) return;
      e.preventDefault();
      const samples = e.getCoalescedEvents?.();
      for (const item of samples?.length ? samples : [e]) { if (!gesture) break; sample(item); }
      if (gesture && !frame) frame = requestAnimationFrame(paintPending);
    };
    canvas.onpointerup = e => { if (gesture?.id === e.pointerId) { sample(e); finish(); } };
    canvas.onpointercancel = e => { if (gesture?.id === e.pointerId) cancel(); };
    canvas.onlostpointercapture = e => { if (gesture?.id === e.pointerId) cancel(); };
    canvas.oncontextmenu = e => e.preventDefault();
    return canvas;
  }
  function artwork(def) {
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox', `0 0 ${def.width} ${def.height}`);
    svg.setAttribute('width', def.width); svg.setAttribute('height', def.height);
    svg.setAttribute('aria-label', text(active)); svg.setAttribute('role','group');
    const bg = document.createElementNS(ns,'rect');
    bg.setAttribute('width',def.width); bg.setAttribute('height',def.height); bg.setAttribute('fill','#ffffff'); svg.append(bg);
    def.regions.forEach((r,i) => {
      const p = document.createElementNS(ns,'path'); p.setAttribute('d',r.d); p.dataset.region = r.id;
      p.setAttribute('role','button'); p.setAttribute('tabindex','0'); p.setAttribute('class','color-region');
      p.setAttribute('aria-label', `${text(active)} · ${text('part')} ${i+1}`);
      // Click is the sole activation path for touch, mouse and pen: no duplicate pointer/touch listeners.
      p.onclick = () => { if (sessions.get(active).mode === 'color') apply({ type:'fill', region:r.id }); };
      p.onkeydown = e => { if (sessions.get(active).mode === 'color' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (!e.repeat) apply({ type:'fill', region:r.id }); } };
      svg.append(p);
    });
    if (!def.ink) return svg;
    const ink = document.createElementNS(ns,'image'); ink.setAttribute('href',def.ink);
    ink.setAttribute('width',def.width); ink.setAttribute('height',def.height); ink.style.pointerEvents = 'none';
    ink.setAttribute('aria-hidden','true'); svg.append(ink); return svg;
  }
  async function choose(id) {
    cancel();
    active = id; const request = ++ticket;
    root.querySelectorAll('.color-picker').forEach(b => b.setAttribute('aria-pressed', b.dataset.picture === id));
    $('#color-paper').replaceChildren(); $('#color-paper').setAttribute('aria-busy','true');
    $('#color-tools').hidden = true; $('#color-actions').hidden = true; $('#color-extra .color-actions').hidden = true; status('loading');
    try {
      let def = definitions.get(id);
      if (!def) {
        const response = await fetch(`assets/coloring/${id}.json`, { credentials:'omit' });
        if (!response.ok) throw new Error('Missing picture');
        def = await response.json();
        if (!engine.validPicture(def) || def.id !== id) throw new Error('Invalid picture');
        definitions.set(id,def);
      }
      if (request !== ticket) return;
      if (!sessions.has(id)) sessions.set(id,engine.create(def));
      if (id === 'blank') mode = 'draw';
      sessions.set(id,engine.change(sessions.get(id),{type:'mode',mode}));
      mount(def);
      $('#color-tools').hidden = false; $('#color-actions').hidden = false; $('#color-extra .color-actions').hidden = false;
      status(''); update();
    } catch {
      if (request !== ticket) return;
      status('error'); $('#color-paper').append(button('↻','retry', () => choose(id)));
    } finally { if (request === ticket) $('#color-paper').setAttribute('aria-busy','false'); }
  }
  function mount(def) {
    const stage = document.createElement('div'); stage.className = 'color-stage';
    stage.style.aspectRatio = `${def.width} / ${def.height}`;
    stage.append(artwork(def), drawSurface(def)); $('#color-paper').replaceChildren(stage);
    observer?.disconnect();
    if (window.ResizeObserver) { observer = new ResizeObserver(scheduleResize); observer.observe(stage); }
  }
  function build() {
    loaded = true;
    root.innerHTML = `<div class="color-header"><h1 id="color-title"></h1><a class="color-button" href="#top">⌂ <span data-home></span></a></div>
      <div class="color-modes" role="group"></div><p id="color-hint"></p>
      <div class="color-workspace"><div id="color-paper" class="color-paper"></div>
      <div id="color-tools" class="color-tools"><div id="draw-tools" class="draw-options" role="group"></div>
      <div id="draw-sizes" class="draw-options" role="group"></div><div class="color-palette" role="group"></div></div></div>
      <div id="color-actions" class="color-actions"></div><p id="color-status" class="color-status" role="status"></p>
      <details id="color-extra" class="color-extra"><summary></summary><div class="color-pictures" role="group"></div><div class="color-actions"></div></details>`;
    for (const [key,icon] of [['color','🎨'],['draw','✎']]) {
      const b = button(icon,key,()=>{ mode = key; apply({type:'mode',mode}); }); b.dataset.mode = key; $('.color-modes').append(b);
    }
    for (const [key,icon] of [['brush','🖌'],['crayon','🖍'],['eraser','▱']]) {
      const b = button(icon,key,()=>apply({type:'tool',tool:key})); b.dataset.tool = key; $('#draw-tools').append(b);
    }
    for (const [key,icon] of [['small','●'],['medium','●'],['large','●']]) {
      const b = button(icon,key,()=>apply({type:'size',size:key})); b.dataset.size = key; $('#draw-sizes').append(b);
    }
    ids.forEach(id => {
      const b = document.createElement('button'); b.className='color-picker'; b.type='button'; b.dataset.picture=id;
      b.innerHTML=id === 'blank' ? '<span aria-hidden="true">▢</span><span></span>' : `<img src="assets/print/${id}.webp" alt="" width="60" height="65"><span></span>`;
      b.onclick=()=>choose(id); $('.color-pictures').append(b);
    });
    colors.forEach((color,i) => {
      const b = document.createElement('button'); b.type='button'; b.className='swatch'; b.dataset.color=color;
      b.dataset.colorLabel=['red','orange','yellow','green','blue','purple','pink','white'][i]; b.style.background=color; b.onclick=()=>apply({type:'select', color});
      $('.color-palette').append(b);
    });
    for (const [id,icon,key,type] of [['undo','↶','undo','undo'],['redo','↷','redo','redo']]) {
      const b = button(icon,key,()=>apply({type})); b.id=`color-${id}`; $('#color-actions').append(b);
    }
    $('#color-tools').append($('#color-actions'));
    const reset=button('↺','reset',()=>apply({type:'reset'})); reset.id='color-reset'; $('#color-extra .color-actions').append(reset);
    const save=button('↓','save',async()=>{
      if (busy) return; busy=true; save.disabled=true;
      cancel();
      try { await window.downloadColoring($('#color-paper svg'),active,sessions.get(active)); status('saved'); }
      catch { status('fallback'); } finally { busy=false; save.disabled=false; }
    }); $('#color-extra .color-actions').append(save);
    const print=document.createElement('a'); print.href='#coloring'; print.className='color-button'; print.dataset.print='';
    $('#color-extra .color-actions').append(print);
    localize(); choose(active);
  }
  function localize() {
    if (!loaded) return;
    cancel();
    $('#color-title').textContent=text('title'); $('#color-hint').textContent=text('hint');
    $('[data-home]').textContent=text('back'); $('[data-print]').textContent='▤ '+text('print');
    $('.color-pictures').setAttribute('aria-label',text('pictures')); $('.color-palette').setAttribute('aria-label',text('palette'));
    root.querySelectorAll('[data-label]').forEach(b=>b.lastElementChild.textContent=text(b.dataset.label));
    root.querySelectorAll('[data-picture]').forEach(b=>b.lastElementChild.textContent=text(b.dataset.picture));
    root.querySelectorAll('[data-color-label]').forEach(b=>b.setAttribute('aria-label',text(b.dataset.colorLabel)));
    $('#color-extra summary').textContent=text('more');
    $('.color-modes').setAttribute('aria-label', text('color') + ' / ' + text('draw'));
    $('#draw-tools').setAttribute('aria-label',text('draw')); $('#draw-sizes').setAttribute('aria-label',text('size'));
    if (definitions.has(active) && sessions.has(active)) { mount(definitions.get(active)); update(); }
    status('');
  }
  function route() {
    cancel();
    const on=location.hash==='#color-online'; root.hidden=!on; document.querySelector('#homepage').hidden=on;
    if (on && !loaded) build();
    if (on) { $('#color-title').tabIndex=-1; $('#color-title').focus({preventScroll:true}); window.scrollTo(0,0); }
    else document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
  window.addEventListener('resize',scheduleResize);
  window.visualViewport?.addEventListener('resize',scheduleResize);
  // A monitor change may change DPR without changing the CSS layout.
  function watchDpr() {
    const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    media.addEventListener('change', () => { scheduleResize(); watchDpr(); }, { once: true });
  }
  watchDpr();
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  window.addEventListener('blur',cancel);
  window.addEventListener('hashchange',route); window.addEventListener('bailabu-language',localize); route();
})();
