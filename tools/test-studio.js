/* Asset, capability and memory regression checks for the complete library. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const engine = require('../assets/coloring-engine.js');
const library = require('../assets/coloring-library.js');
const locales = ['en','de','es','pt','tr','ar'];
assert.equal(library.templates.length,51);
assert.equal(new Set(library.templates.map(t=>t.id)).size,51);
assert.equal(library.templates.filter(t=>t.modes.color).length,20);
assert.equal(library.templates.filter(t=>t.modes.draw).length,51);
assert.equal(library.palette.length,18);
assert.equal(new Set(library.palette.map(c=>c.id)).size,18);
assert.equal(new Set(library.palette.map(c=>c.value)).size,18);
const prints=fs.readdirSync('assets/print').filter(n=>/^bailabu-coloring-.*\.png$/.test(n));
assert.equal(prints.length,35);
for(const source of prints) {
  const id=source.replace('bailabu-coloring-','').replace('.png','').replaceAll('_','-');
  assert(library.templates.some(t=>t.id===id),'existing artwork included: '+id);
}
for(const template of library.templates) {
  if(template.id==='blank') continue;
  for(const lang of locales) assert(template.labels[lang],template.id+' '+lang);
  assert(fs.statSync(template.thumbnail).size>0);
  const picture=JSON.parse(fs.readFileSync(template.artwork));
  assert(engine.validPicture(picture),template.id);
  assert.equal(picture.id,template.id);
  assert.deepEqual(engine.capabilities(picture),template.modes);
  const state=engine.create(picture);
  assert.equal(engine.change(state,{type:'mode',mode:'draw'}).mode,'draw');
  if(!template.modes.color) assert.equal(engine.change(state,{type:'mode',mode:'color'}),state);
  if(picture.vector) {
    const svg=fs.readFileSync(template.thumbnail,'utf8');
    assert(!/<(?:script|image|foreignObject|use|style)\b|\bon\w+\s*=|\bhref\s*=|url\(/i.test(svg));
    assert(svg.includes(`data-picture-id="${template.id}"`));
    const ids=[...svg.matchAll(/<path id="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(ids,picture.regions.map(r=>r.id),'source/production region identity');
  }
  for(const bad of [{...picture,modes:{color:!template.modes.color,draw:true}},
    {...picture,regions:[{id:'bad',d:'M0 0 L50 50',defaultColor:'#ffffff'}]},
    {...picture,regions:[{id:'bad',d:'url(https://example.org)',defaultColor:'#ffffff'}]}]) assert(!engine.validPicture(bad));
}
for(const labels of Object.values(library.labels)) for(const lang of locales) assert(labels[lang]);
let s=engine.create(engine.BLANK);
for(const {value} of library.palette) {
  s=engine.change(s,{type:'select',color:value});
  s=engine.change(s,{type:'stroke',stroke:{tool:'brush',color:s.color,width:20,points:[{x:1,y:1}]}});
  assert.equal(s.strokes.at(-1).color,value);
  assert.equal(engine.change(engine.change(s,{type:'undo'}),{type:'redo'}).strokes.at(-1).color,value);
}
const full={...s,strokes:Array.from({length:engine.MAX_SESSION_STROKES},()=>({points:[{}]})),past:[],future:[]};
assert(!engine.sessionRoom([full],{points:[{}]}));
assert(!engine.sessionRoom([{...full,strokes:[{points:Array(engine.MAX_SESSION_POINTS).fill({})}]}],{points:[{}]}));
const stroke={points:[{}]};
assert(engine.sessionRoom([{...full,strokes:[stroke],past:[{strokes:[stroke]}]}],stroke),'shared snapshots counted once');
console.log('PASS: 35 existing pictures, 15 original SVGs, 51 Draw / 20 Color, 18 stable colors, six-locale manifest, source/production region IDs, capabilities, safety and aggregate memory bounds');
