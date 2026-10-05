import {readFileSync,writeFileSync} from 'node:fs';

const file=new URL('../src/data/art.gleam',import.meta.url);
const names=['detail','body','highlights'];
export function writeLayers(name,layers) {
  const source=readFileSync(file,'utf8');
  const start=source.indexOf(`pub fn ${name}()`);
  const next=source.indexOf('\npub fn ',start+1);
  const end=next<0?source.length:next;
  const body=`pub fn ${name}() -> Layers {\n  Layers(\n${layers.map((text,index)=>`    ${names[index]}: ${JSON.stringify(text)},`).join('\n')}\n  )\n}\n`;
  writeFileSync(file,source.slice(0,start)+body+source.slice(end));
}
export function writeWraps(wraps) {
  const source=readFileSync(file,'utf8');
  const start=source.indexOf('pub fn wraps()');
  const float=value=>Number.isInteger(value)?`${value}.0`:String(value);
  const body=`pub fn wraps() -> List(Wrap) {\n  [\n${wraps.map(wrap=>`    Wrap(${[wrap.x,wrap.y,wrap.rx,wrap.ry,Number((wrap.y+wrap.ry+2).toFixed(2))].map(float).join(', ')}),`).join('\n')}\n  ]\n}\n`;
  writeFileSync(file,source.slice(0,start)+body);
}
