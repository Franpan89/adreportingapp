import { readFileSync } from 'fs';
const data = readFileSync('informe-pekes-nov25.pdf');
const text = data.toString('latin1');
// Extract hex strings <...> and paren strings (...)
const chunks = text.match(/<[0-9a-fA-F]{2,}?>|\([^)]{1,300}\)/g) || [];
const results = [];
for (const c of chunks) {
  if (c.startsWith('<')) {
    const hex = c.slice(1,-1);
    let s = '';
    for (let i=0; i<hex.length-1; i+=2) s += String.fromCharCode(parseInt(hex.slice(i,i+2),16));
    s = s.replace(/[^\x20-\x7E\xA0-\xFF]/g,'').trim();
    if (s.length > 1) results.push(s);
  } else {
    const s = c.slice(1,-1).replace(/\\\(/g,'(').replace(/\\\)/g,')').trim();
    if (s.length > 1) results.push(s);
  }
}
console.log(results.join('\n').slice(0, 15000));
