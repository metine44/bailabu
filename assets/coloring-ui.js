(function () {
  'use strict';
  const root = document.querySelector('#online-coloring');
  const engine = window.BailabuColoring;
  const keys = ['title','hint','back','undo','redo','reset','more','save','print','loading','error','retry','done','saved','fallback','part','pictures','palette','red','orange','yellow','green','blue','purple','pink','white','apple','ball','star'];
  const words = {
    en: ['Color on Bailabu Island','🎨 → 👆 Choose a color, tap the picture!','Home','Undo','Redo','Start again','More','Save picture','Print on paper','Opening your picture…','This picture could not open. Try another one.','Try again','Lovely colors!','Your picture is ready.','Saving did not work here. Try another browser or color a paper picture.','Part','Choose a picture','Choose a color','Red','Orange','Yellow','Green','Blue','Purple','Pink','White / eraser','Apple','Ball','Star'],
    de: ['Malen auf der Bailabu Insel','🎨 → 👆 Farbe wählen, Bild antippen!','Start','Zurück','Wiederholen','Neu anfangen','Mehr','Bild speichern','Auf Papier malen','Dein Bild wird geöffnet…','Dieses Bild konnte nicht geöffnet werden. Probiere ein anderes.','Noch einmal','Schöne Farben!','Dein Bild ist fertig.','Speichern klappt hier nicht. Probiere einen anderen Browser oder ein Ausmalbild auf Papier.','Teil','Bild wählen','Farbe wählen','Rot','Orange','Gelb','Grün','Blau','Lila','Rosa','Weiß / Radierer','Apfel','Ball','Stern'],
    es: ['Colorea en la Isla Bailabu','🎨 → 👆 ¡Elige un color y toca el dibujo!','Inicio','Deshacer','Rehacer','Empezar de nuevo','Más','Guardar dibujo','Colorear en papel','Abriendo tu dibujo…','No se pudo abrir este dibujo. Prueba otro.','Reintentar','¡Qué bonitos colores!','Tu dibujo está listo.','No se pudo guardar aquí. Prueba otro navegador o un dibujo en papel.','Parte','Elige un dibujo','Elige un color','Rojo','Naranja','Amarillo','Verde','Azul','Morado','Rosa','Blanco / borrador','Manzana','Pelota','Estrella'],
    pt: ['Pinte na Ilha Bailabu','🎨 → 👆 Escolha uma cor e toque no desenho!','Início','Desfazer','Refazer','Recomeçar','Mais','Salvar desenho','Colorir no papel','Abrindo seu desenho…','Não foi possível abrir este desenho. Tente outro.','Tentar de novo','Que cores lindas!','Seu desenho está pronto.','Não foi possível salvar aqui. Tente outro navegador ou um desenho no papel.','Parte','Escolha um desenho','Escolha uma cor','Vermelho','Laranja','Amarelo','Verde','Azul','Roxo','Rosa','Branco / borracha','Maçã','Bola','Estrela'],
    tr: ['Tontiş Ada’da boya','🎨 → 👆 Renk seç, resme dokun!','Ana sayfa','Geri al','Yinele','Yeniden başla','Diğer','Resmi kaydet','Kağıtta boya','Resmin açılıyor…','Bu resim açılamadı. Başka bir resim dene.','Tekrar dene','Ne güzel renkler!','Resmin hazır.','Burada kaydedilemedi. Başka bir tarayıcı veya kağıt boyama sayfası dene.','Bölüm','Resim seç','Renk seç','Kırmızı','Turuncu','Sarı','Yeşil','Mavi','Mor','Pembe','Beyaz / silgi','Elma','Top','Yıldız'],
    ar: ['لوّن في جزيرة بايلابو','🎨 → 👆 اختر لونًا والمس الصورة!','الرئيسية','تراجع','إعادة','ابدأ من جديد','المزيد','حفظ الصورة','لوّن على الورق','جارٍ فتح صورتك…','تعذّر فتح هذه الصورة. جرّب صورة أخرى.','حاول مجددًا','ألوان جميلة!','صورتك جاهزة.','تعذّر الحفظ هنا. جرّب متصفحًا آخر أو صورة ورقية.','جزء','اختر صورة','اختر لونًا','أحمر','برتقالي','أصفر','أخضر','أزرق','بنفسجي','وردي','أبيض / ممحاة','تفاحة','كرة','نجمة']
  };
  const ids = ['ball', 'apple', 'star'];
  const colors = ['#ff5a5f','#f6a23a','#ffc83d','#5cc85a','#3db8f5','#8e6cf0','#ff9cb9','#ffffff'];
  const sessions = new Map(), definitions = new Map();
  let active = 'ball', ticket = 0, loaded = false, busy = false;
  const $ = s => root.querySelector(s);
  const text = key => words[document.documentElement.lang]?.[keys.indexOf(key)] || words.en[keys.indexOf(key)];
  function button(icon, key, action) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'color-button';
    b.innerHTML = `<span aria-hidden="true">${icon}</span><span></span>`;
    b.lastElementChild.textContent = text(key); b.dataset.label = key;
    b.onclick = action; return b;
  }
  function status(key) { $('#color-status').textContent = key ? text(key) : ''; }
  function apply(action) {
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
    $('#color-reset').disabled = Object.keys(state.fills).every(k => state.fills[k] === state.defaults[k]);
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
      p.onclick = () => apply({ type:'fill', region:r.id });
      p.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) apply({ type:'fill', region:r.id }); } };
      svg.append(p);
    });
    const ink = document.createElementNS(ns,'image'); ink.setAttribute('href',def.ink);
    ink.setAttribute('width',def.width); ink.setAttribute('height',def.height); ink.style.pointerEvents = 'none';
    ink.setAttribute('aria-hidden','true'); svg.append(ink); return svg;
  }
  async function choose(id) {
    active = id; const request = ++ticket;
    root.querySelectorAll('.color-picker').forEach(b => b.setAttribute('aria-pressed', b.dataset.picture === id));
    $('#color-paper').replaceChildren(); $('#color-paper').setAttribute('aria-busy','true');
    $('#color-tools').hidden = true; $('#color-actions').hidden = true; $('#color-extra').hidden = true; status('loading');
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
      $('#color-paper').replaceChildren(artwork(def));
      $('#color-tools').hidden = false; $('#color-actions').hidden = false; $('#color-extra').hidden = false;
      status(''); update();
    } catch {
      if (request !== ticket) return;
      status('error'); $('#color-paper').append(button('↻','retry', () => choose(id)));
    } finally { if (request === ticket) $('#color-paper').setAttribute('aria-busy','false'); }
  }
  function build() {
    loaded = true;
    root.innerHTML = `<div class="color-header"><h1 id="color-title"></h1><a class="color-button" href="#top">⌂ <span data-home></span></a></div>
      <p id="color-hint"></p><div class="color-pictures" role="group"></div>
      <div class="color-workspace"><div id="color-paper" class="color-paper"></div>
      <div id="color-tools" class="color-tools"><div class="color-palette" role="group"></div></div></div>
      <div id="color-actions" class="color-actions"></div><p id="color-status" class="color-status" role="status"></p>
      <details id="color-extra" class="color-extra"><summary></summary><div class="color-actions"></div></details>`;
    ids.forEach(id => {
      const b = document.createElement('button'); b.className='color-picker'; b.type='button'; b.dataset.picture=id;
      b.innerHTML=`<img src="assets/print/${id}.webp" alt="" width="60" height="65"><span></span>`;
      b.onclick=()=>choose(id); $('.color-pictures').append(b);
    });
    colors.forEach((color,i) => {
      const b = document.createElement('button'); b.type='button'; b.className='swatch'; b.dataset.color=color;
      b.dataset.colorLabel=keys[18+i]; b.style.background=color; b.onclick=()=>apply({type:'select', color});
      $('.color-palette').append(b);
    });
    for (const [id,icon,key,type] of [['undo','↶','undo','undo'],['reset','↺','reset','reset']]) {
      const b = button(icon,key,()=>apply({type})); b.id=`color-${id}`; $('#color-actions').append(b);
    }
    $('#color-tools').append($('#color-actions'));
    const redo=button('↷','redo',()=>apply({type:'redo'})); redo.id='color-redo'; $('#color-extra .color-actions').append(redo);
    const save=button('↓','save',async()=>{
      if (busy) return; busy=true; save.disabled=true;
      try { await window.downloadColoring($('#color-paper svg'),active); status('saved'); }
      catch { status('fallback'); } finally { busy=false; save.disabled=false; }
    }); $('#color-extra .color-actions').append(save);
    const print=document.createElement('a'); print.href='#coloring'; print.className='color-button'; print.dataset.print='';
    $('#color-extra .color-actions').append(print);
    localize(); choose(active);
  }
  function localize() {
    if (!loaded) return;
    $('#color-title').textContent=text('title'); $('#color-hint').textContent=text('hint');
    $('[data-home]').textContent=text('back'); $('[data-print]').textContent='▤ '+text('print');
    $('.color-pictures').setAttribute('aria-label',text('pictures')); $('.color-palette').setAttribute('aria-label',text('palette'));
    root.querySelectorAll('[data-label]').forEach(b=>b.lastElementChild.textContent=text(b.dataset.label));
    root.querySelectorAll('[data-picture]').forEach(b=>b.lastElementChild.textContent=text(b.dataset.picture));
    root.querySelectorAll('[data-color-label]').forEach(b=>b.setAttribute('aria-label',text(b.dataset.colorLabel)));
    $('#color-extra summary').textContent=text('more');
    if (definitions.has(active)) { $('#color-paper').replaceChildren(artwork(definitions.get(active))); update(); }
    status('');
  }
  function route() {
    const on=location.hash==='#color-online'; root.hidden=!on; document.querySelector('#homepage').hidden=on;
    if (on && !loaded) build();
    if (on) { $('#color-title').tabIndex=-1; $('#color-title').focus({preventScroll:true}); window.scrollTo(0,0); }
    else document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
  window.addEventListener('hashchange',route); window.addEventListener('bailabu-language',localize); route();
})();
