import { performance } from "node:perf_hooks";
import { Parser, parseDocument } from "htmlparser2";
import { parse as parse5 } from "parse5";

const versions = { htmlparser2: "12.0.0", parse5: "8.0.0" };
const sizes = [1024, 32768, 131072];

function sample(bytes) {
  const unit = "<p>A&amp;B <b>x</b></p>";
  return unit.repeat(Math.ceil(bytes / unit.length)).slice(0, bytes);
}
function time(fn, input, rounds = 5) {
  const values = [];
  for (let i = 0; i < rounds; i++) {
    const start = performance.now();
    fn(input);
    values.push(performance.now() - start);
  }
  values.sort((a,b)=>a-b);
  return Number(values[Math.floor(values.length / 2)].toFixed(3));
}
function htmlparser2Stop(input, limit) {
  let events = 0;
  const stop = new Error("LIMIT");
  const bump = () => { if (++events > limit) throw stop; };
  const parser = new Parser({ onopentag: bump, ontext: bump, onclosetag: bump }, { decodeEntities: true });
  try { parser.end(input); return { stopped: false, events }; }
  catch (error) { if (error === stop) return { stopped: true, events }; throw error; }
}
function textHtmlparser2(html) {
  const doc = parseDocument(html, { decodeEntities: true });
  const out=[]; const stack=[...doc.children].reverse();
  while(stack.length){const n=stack.pop(); if(n.type==="text") out.push(n.data); if(n.children) for(let i=n.children.length-1;i>=0;i--) stack.push(n.children[i]);}
  return out.join("");
}
function textParse5(html) {
  const doc=parse5(html); const out=[]; const stack=[...(doc.childNodes??[])].reverse();
  while(stack.length){const n=stack.pop(); if(n.nodeName==="#text") out.push(n.value); if(n.childNodes) for(let i=n.childNodes.length-1;i>=0;i--) stack.push(n.childNodes[i]);}
  return out.join("");
}
const broken="<div><p>A&amp;B<b>x</div>tail";
const depth="<div>".repeat(2000)+"x"+"</div>".repeat(2000);
const hugeAttr='<div data-x="'+"x".repeat(65536)+'">ok</div>';
const results={
  versions,
  runtime: process.version,
  representative_ms: Object.fromEntries(sizes.map(n=>[n,{htmlparser2:time(parseDocument,sample(n)),parse5:time(parse5,sample(n))}])),
  entities:{htmlparser2:textHtmlparser2(broken),parse5:textParse5(broken)},
  malformed:{htmlparser2:textHtmlparser2("<p>a<div>b</p>c"),parse5:textParse5("<p>a<div>b</p>c")},
  depth_ms:{htmlparser2:time(parseDocument,depth,3),parse5:time(parse5,depth,3)},
  huge_attribute_ms:{htmlparser2:time(parseDocument,hugeAttr,3),parse5:time(parse5,hugeAttr,3)},
  early_stop:{
    htmlparser2:htmlparser2Stop("<div>x</div>".repeat(10000),100),
    parse5:{stopped:false,reason:"parse5 parse() constructs the document before an adapter can inspect/reject complexity"}
  }
};
console.log(JSON.stringify(results,null,2));
if(!results.early_stop.htmlparser2.stopped) process.exitCode=1;
