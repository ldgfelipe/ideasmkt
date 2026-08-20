const fs = require('fs');
const pdf = require('pdf-parse');
const path = 'public/zabdin/TARJETA DIGITAL_compressed.pdf';
const buf = fs.readFileSync(path);
pdf(buf).then(d => {
  console.log('PAGES:', d.numpages);
  console.log('TEXT LENGTH:', d.text ? d.text.length : 0);
  console.log('---TEXT START---');
  console.log(d.text);
  console.log('---TEXT END---');
}).catch(e => {
  console.log('ERR', e.message);
});
