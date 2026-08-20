import { pdf } from 'pdf-to-img';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import { Jimp } from 'jimp';

const doc = await pdf('public/zabdin/TARJETA DIGITAL_compressed.pdf', { scale: 6 });
let pageNum = 0;
for await (const page of doc) {
  pageNum++;
  const raw = `page-${pageNum}-hi.png`;
  fs.writeFileSync(raw, page);
  const image = await Jimp.read(raw);
  image.greyscale().normalize();
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const brightness = this.bitmap.data[idx];
    const v = brightness > 140 ? 255 : 0;
    this.bitmap.data[idx] = v;
    this.bitmap.data[idx + 1] = v;
    this.bitmap.data[idx + 2] = v;
  });
  const out = `page-${pageNum}-bin.png`;
  await image.write(out);
  console.log(`Wrote ${out}`);
  const { data } = await Tesseract.recognize(out, 'spa', { logger: () => {} });
  console.log(`\n=== BINARIZED OCR ===`);
  console.log(data.text);
}
