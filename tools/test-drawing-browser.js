/* Exercised in the site's iframe, without adding a production testing API. */
window.checkDrawing = async function (frame, assert, wait) {
  const w=frame.contentWindow,d=w.document,q=s=>d.querySelector(s);
  let state;
  const renderer=w.BailabuDrawing.render;
  w.BailabuDrawing.render=function(canvas,s,...rest){state=s;return renderer(canvas,s,...rest)};
  const click=s=>{const n=q(s);if(n.click)n.click();else n.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
  function event(type,x,y,id=1,primary=true,pointerType='touch') {
    const canvas=q('#draw-layer'),r=canvas.getBoundingClientRect();
    canvas.dispatchEvent(new w.PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,isPrimary:primary,
      pointerType,button:0,clientX:r.left+x*r.width/800,clientY:r.top+y*r.height/1000}));
  }
  const stroke=(y,pointerType='touch')=>{event('pointerdown',100,y,1,true,pointerType);event('pointermove',600,y,1,true,pointerType);event('pointerup',600,y,1,true,pointerType)};
  function pixel(x,y) {
    const canvas=q('#draw-layer');
    return canvas.getContext('2d').getImageData(Math.floor(x*canvas.width/800),Math.floor(y*canvas.height/1000),1,1).data;
  }
  click('[data-mode="draw"]');assert(state.mode==='draw','Draw selected');
  const layouts=[[320,568],[390,844],[768,1024],[1024,768],[1440,900]];
  for (const [width,height] of layouts) {
    frame.style.width=width+'px';frame.style.height=height+'px';await new Promise(r=>setTimeout(r,100));
    click('#color-reset');
    click('[data-mode="color"]');click('.swatch');click('[data-region]');
    const filled={...state.fills};
    click('[data-mode="draw"]');
    for(const [size,value] of [['small',8],['medium',20],['large',40]]) {
      click('[data-size="'+size+'"]');assert(w.BailabuColoring.SIZES[state.size]===value,'size selection '+width);
      assert(q('[data-size="'+size+'"]').getBoundingClientRect().height>=48,'size target');
    }
    click('[data-size="medium"]');click('[data-tool="brush"]');stroke(100,'mouse');
    assert(state.strokes.length===1,'one gesture one brush '+width);
    assert(Math.abs(state.strokes[0].points[1].x-600)<.01,'intrinsic coordinates '+width);
    assert(pixel(300,100)[3]>245,'brush pixels '+width);
    click('[data-tool="crayon"]');stroke(180,'pen');
    assert(state.strokes.length===2&&state.strokes[1].tool==='crayon','crayon action '+width);
    assert(pixel(300,180)[3]>0&&pixel(300,180)[3]<245,'distinct crayon opacity '+width);
    click('[data-tool="eraser"]');stroke(100);
    assert(state.strokes.length===3&&pixel(300,100)[3]===0,'eraser clears drawing '+width);
    assert(JSON.stringify(state.fills)===JSON.stringify(filled),'eraser protects fills '+width);
    click('#color-undo');assert(pixel(300,100)[3]>245,'undo eraser');
    click('#color-redo');assert(pixel(300,100)[3]===0,'redo eraser');
    click('#color-undo');click('#color-undo');click('#color-undo');
    assert(state.strokes.length===0&&JSON.stringify(state.fills)===JSON.stringify(filled),'undo draw keeps fill');
    click('#color-undo');assert(Object.values(state.fills).every(v=>v==='#ffffff'),'undo mixed fill');
    click('#color-redo');click('#color-redo');
    click('[data-tool="brush"]');stroke(250);assert(state.future.length===0,'new action clears redo');
    const count=state.strokes.length;
    event('pointerdown',100,350);event('pointermove',500,350);event('pointercancel',500,350);
    assert(state.strokes.length===count&&pixel(300,350)[3]===0,'cancel discards preview');
    event('pointerdown',100,350);event('pointerdown',200,450,2,false);event('pointerup',200,450,2,false);event('pointerup',100,350);
    assert(state.strokes.length===count+1,'secondary pointer ignored');
    event('pointerdown',100,400);event('pointermove',200,400);event('pointermove',900,400);event('pointermove',600,400);event('pointerup',600,400);
    assert(state.strokes.at(-1).points.at(-1).x<201,'exit ends stroke without re-entry line');
    const before=state.strokes.length;
    event('pointerdown',100,450);event('lostpointercapture',100,450);assert(state.strokes.length===before,'lost capture cancels');
    click('[data-mode="color"]');assert(state.strokes.length===before,'mode retains strokes');
    click('[data-mode="draw"]');assert(state.tool==='brush'&&state.size==='medium','tool and size retained');
    const canonical=JSON.stringify({fills:state.fills,strokes:state.strokes,past:state.past});
    frame.style.width=height+'px';frame.style.height=width+'px';await new Promise(r=>setTimeout(r,100));
    assert(JSON.stringify({fills:state.fills,strokes:state.strokes,past:state.past})===canonical,'orientation preserves canonical history');
    assert(pixel(300,250)[3]>245,'resize replays strokes');
    frame.style.width=width+'px';frame.style.height=height+'px';await new Promise(r=>setTimeout(r,100));
    click('#color-reset');assert(state.strokes.length===0,'clear strokes');click('#color-undo');
    assert(JSON.stringify({fills:state.fills,strokes:state.strokes,past:state.past})===canonical,'clear recoverable');
    q('#color-extra').open=true;
    const ball=JSON.stringify(state.strokes);
    for (const id of ['apple','star','blank']) {
      click('[data-picture="'+id+'"]');await wait(()=>q('#color-paper svg')?.getAttribute('aria-label')===({apple:'Apple',star:'Star',blank:'Blank page'}[id]));
      assert(state.mode==='draw','picture keeps Draw');click('#color-reset');stroke(100);
      assert(state.strokes.length===1,'drawing on '+id+' at '+width);
    }
    click('[data-picture="ball"]');await wait(()=>q('#color-paper svg')?.getAttribute('aria-label')==='Ball');
    assert(JSON.stringify(state.strokes)===ball,'picture restores strokes '+width);
    assert(d.documentElement.scrollWidth<=width,'Draw overflow '+width);
    for (const b of d.querySelectorAll('.swatch,[data-tool],[data-size],button[data-mode]')) {
      const r=b.getBoundingClientRect();assert(r.width>=48&&r.height>=48,'child target '+b.outerHTML.slice(0,100));
      b.focus();assert(d.activeElement===b,'keyboard focusable drawing control');
    }
  }
  // Dense events stay bounded, secondary input never creates a second gesture.
  click('#color-reset');event('pointerdown',100,500);
  for(let i=0;i<2200;i++)event('pointermove',100+(i%600),500+(i%2)*2);
  event('pointerup',600,500);assert(state.strokes.length===1&&state.strokes[0].points.length<=w.BailabuColoring.MAX_POINTS,'dense samples bounded');
  // Prepare distinct blue free drawing and red structured fills for PNG assertions.
  click('#color-reset');click('[data-mode="color"]');click('.swatch');click('[data-region]');
  click('[data-mode="draw"]');click('[data-color="#3db8f5"]');click('[data-tool="brush"]');stroke(100);
  click('[data-tool="eraser"]');event('pointerdown',400,100);event('pointerup',500,100);click('[data-tool="brush"]');
  // Actual null-blob and serialization failure paths must show the localized fallback.
  const toBlob=w.HTMLCanvasElement.prototype.toBlob;
  w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(null)};
  click('[data-label="save"]');await wait(()=>q('#color-status').textContent.includes('did not work'));
  w.HTMLCanvasElement.prototype.toBlob=toBlob;
  const serialize=w.XMLSerializer.prototype.serializeToString;
  w.XMLSerializer.prototype.serializeToString=()=>{throw Error('serialization unavailable')};
  click('[data-label="save"]');await wait(()=>!q('[data-label="save"]').disabled);
  assert(q('#color-status').textContent.includes('did not work'),'serialization fallback');w.XMLSerializer.prototype.serializeToString=serialize;
  // Duplicate export clicks are guarded while the first request is pending.
  const exporter=w.downloadColoring;let release,calls=0;
  w.downloadColoring=()=>{calls++;return new Promise(r=>release=r)};click('[data-label="save"]');click('[data-label="save"]');
  assert(calls===1,'one concurrent export');release();await wait(()=>!q('[data-label="save"]').disabled);w.downloadColoring=exporter;
  return { current:()=>state, stroke, pixel };
};
