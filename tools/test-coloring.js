const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const engine = require('../assets/coloring-engine.js');
const pictures = ['ball','apple','star'].map(id => JSON.parse(fs.readFileSync(`assets/coloring/${id}.json`)));
for (const p of pictures) assert.ok(engine.validPicture(p));
for (const p of [null, {}, {...pictures[0], regions:[]}, {...pictures[0], regions:[null]}, {...pictures[0], ink:'https://example.org/a.png'},
  {...pictures[0], regions:[pictures[0].regions[0],pictures[0].regions[0]]}]) assert.equal(engine.validPicture(p),false);
let s=engine.create(pictures[0]), original=s;
assert.equal(engine.change(s,{type:'fill',region:'missing'}),s);
assert.equal(engine.change(s,{type:'select',color:'url(bad)'}),s);
s=engine.change(s,{type:'select',color:'#ff5a5f'});
s=engine.change(s,{type:'fill',region:'region-1'});
assert.equal(s.fills['region-1'],'#ff5a5f');
const filled=s;
assert.deepEqual(engine.change(s,{type:'undo'}).fills,original.fills);
assert.deepEqual(engine.change(engine.change(s,{type:'undo'}),{type:'redo'}).fills,filled.fills);
s=engine.change(s,{type:'reset'}); assert.deepEqual(s.fills,original.fills);
s=engine.change(s,{type:'undo'}); assert.deepEqual(s.fills,filled.fills);
s=engine.change(s,{type:'undo'}); s=engine.change(s,{type:'fill',region:'region-2'}); assert.equal(s.future.length,0);
for(let i=0;i<200;i++) { s=engine.change(s,{type:'select',color:i%2?'#ffc83d':'#5cc85a'}); s=engine.change(s,{type:'fill',region:'region-1'}); }
assert.equal(s.past.length,engine.LIMIT);
const sessions=new Map([['ball',s],['apple',engine.create(pictures[1])]]);
assert.equal(sessions.get('ball'),s); assert.notDeepEqual(sessions.get('apple').fills,s.fills);
const html=fs.readFileSync('index.html','utf8');
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (!match[0].includes('application/ld+json')) new vm.Script(match[1]);
}
for(const file of ['assets/coloring-ui.js','assets/coloring-export.js']) new vm.Script(fs.readFileSync(file,'utf8'));
new vm.Script(fs.readFileSync('assets/coloring-renderer.js','utf8'));
assert.ok(engine.validPicture(engine.BLANK));
let drawing = engine.create(engine.BLANK);
for (const [type,key,value] of [['mode','mode','draw'],['tool','tool','crayon'],['size','size','large']]) {
  drawing = engine.change(drawing,{type,[key]:value}); assert.equal(drawing[key],value);
  assert.equal(engine.change(drawing,{type,[key]:'bad'}),drawing);
}
assert.deepEqual(engine.point(drawing,{left:10,top:20,width:400,height:500},210,270),{x:400,y:500});
assert.equal(engine.point(drawing,{left:10,top:20,width:400,height:500},9,270),null);
assert.equal(engine.point(drawing,{left:10,top:20,width:0,height:500},10,20),null);
const makeStroke = tool => ({tool,color:'#ff5a5f',width:engine.SIZES.medium,points:[{x:100,y:100},{x:600,y:100}]});
for(const tool of ['brush','crayon','eraser']) {
  const st = makeStroke(tool), before = drawing;
  drawing = engine.change(drawing,{type:'stroke',stroke:st});
  assert.equal(drawing.strokes.at(-1).tool,tool);
  st.points[0].x=999; assert.equal(drawing.strokes.at(-1).points[0].x,100,'input is copied');
  assert.deepEqual(engine.change(drawing,{type:'undo'}).strokes,before.strokes);
  assert.deepEqual(engine.change(engine.change(drawing,{type:'undo'}),{type:'redo'}).strokes,drawing.strokes);
}
for(const st of [null, {...makeStroke('brush'),tool:'bad'}, {...makeStroke('brush'),width:NaN},
  {...makeStroke('brush'),points:[{x:Infinity,y:5}]}, {...makeStroke('brush'),points:[{x:-1,y:5}]},
  {...makeStroke('brush'),points:Array(engine.MAX_POINTS+1).fill({x:1,y:1})}]) {
  assert.equal(engine.change(drawing,{type:'stroke',stroke:st}),drawing);
}
const fullDrawing=drawing;
drawing=engine.change(drawing,{type:'reset'}); assert.equal(drawing.strokes.length,0);
drawing=engine.change(drawing,{type:'undo'}); assert.deepEqual(drawing.strokes,fullDrawing.strokes);
drawing=engine.change(drawing,{type:'stroke',stroke:makeStroke('brush')});assert.equal(drawing.future.length,0);
for(let i=0;i<engine.MAX_STROKES;i++) drawing=engine.change(drawing,{type:'stroke',stroke:makeStroke('brush')});
assert.equal(drawing.strokes.length,engine.MAX_STROKES);
assert.equal(engine.change(drawing,{type:'stroke',stroke:makeStroke('brush')}),drawing);
assert.equal(drawing.past.length,engine.LIMIT);
let mixed=engine.create(pictures[0]);
mixed=engine.change(mixed,{type:'fill',region:'region-1'});const mixedFill=mixed.fills;
mixed=engine.change(mixed,{type:'stroke',stroke:makeStroke('brush')});
mixed=engine.change(mixed,{type:'stroke',stroke:makeStroke('eraser')});
assert.deepEqual(mixed.fills,mixedFill,'eraser never touches fills');
mixed=engine.change(mixed,{type:'undo'});assert.equal(mixed.strokes.length,1);
mixed=engine.change(mixed,{type:'undo'});assert.equal(mixed.strokes.length,0);assert.deepEqual(mixed.fills,mixedFill);
mixed=engine.change(mixed,{type:'undo'});assert.deepEqual(mixed.fills,engine.create(pictures[0]).fills);
assert.match(html,/href="#color-online"/); assert.match(html,/id="coloring"/);
console.log('PASS: definitions, blank page, modes/tools/sizes/colors, fill/brush/crayon/eraser, intrinsic points, invalid input, mixed undo/redo, recoverable reset, branching, picture sessions, bounded history/strokes/points, scripts and entry links');
