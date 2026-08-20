import Tesseract from 'tesseract.js';
import fs from 'fs';

const imgs = [
  'public/zabdin/btn_agenda_tu_cita.webp',
  'public/zabdin/btn_catalogo.webp',
  'public/zabdin/btn_quienes_somos.webp',
  'public/zabdin/donde-comienza.webp',
  'public/zabdin/facebook.webp',
  'public/zabdin/instagram.webp'
];

for (const img of imgs) {
  console.log(`\n=== ${img} ===`);
  try {
    const { data } = await Tesseract.recognize(img, 'spa', { logger: () => {} });
    console.log(data.text.trim());
  } catch (e) {
    console.log('ERR', e.message);
  }
}
