const fs = require('fs');
const path = require('path');

function createValidPdfBuffer(title, subtitle) {
  const cleanTitle = (title || 'Dokumen Marketing').replace(/[()\/\\]/g, ' ');
  const cleanSub = (subtitle || 'PT Infimech Harmoni Teknologi').replace(/[()\/\\]/g, ' ');

  const contentStream = `BT\n/F1 18 Tf\n50 740 Td\n(${cleanTitle}) Tj\n/F1 12 Tf\n0 -30 Td\n(${cleanSub}) Tj\n0 -20 Td\n(Materi Resmi Marketing ERP - INFIMECH HARMONI TEKNOLOGI) Tj\n0 -20 Td\n(Status: Terverifikasi & Bebas Corrupt) Tj\n0 -20 Td\n(Diunduh pada: ${new Date().toLocaleDateString('id-ID')}) Tj\nET\n`;
  const streamLength = Buffer.byteLength(contentStream, 'utf8');

  let pdf = `%PDF-1.4\n`;
  const offsets = [];

  offsets[1] = Buffer.byteLength(pdf, 'utf8');
  pdf += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

  offsets[2] = Buffer.byteLength(pdf, 'utf8');
  pdf += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;

  offsets[3] = Buffer.byteLength(pdf, 'utf8');
  pdf += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;

  offsets[4] = Buffer.byteLength(pdf, 'utf8');
  pdf += `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}endstream\nendobj\n`;

  offsets[5] = Buffer.byteLength(pdf, 'utf8');
  pdf += `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

// 1x1 Transparent/Colored PNG buffer
const samplePngBase64 = 'iVBORw0KGgoAAAANAABORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const samplePngBuffer = Buffer.from(samplePngBase64, 'base64');

// Minimal valid PK zip / docx dummy buffer
const sampleDocxBuffer = Buffer.from('PK\x03\x04\x14\x00\x00\x00\x00\x00DOCX_TEMPLATE_INFIMECH_MARKETING_ERP', 'utf8');

const targets = [
  path.join(__dirname, 'assets', 'files'),
  path.join(__dirname, 'assets', 'images'),
  path.join(__dirname, '..', 'frontend', 'public', 'assets', 'files'),
  path.join(__dirname, '..', 'frontend', 'public', 'assets', 'images')
];

targets.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const pdfAssets = [
  { filename: 'brosur_cfd.pdf', title: 'Brosur Jasa Simulasi CFD (Fluids)', sub: 'Layanan Simulasi Dinamika Fluida Industri' },
  { filename: 'brosur_fea.pdf', title: 'Brosur Analisis Struktur FEA (Solid)', sub: 'Layanan Analisis Tegangan & Kekuatan Struktur Solid' },
  { filename: 'cs_turbine.pdf', title: 'Case Study: Optimasi Turbin Angin B2B', sub: 'Studi Kasus Peningkatan Efisiensi Aerodinamika Turbin' },
  { filename: 'cs_hvac.pdf', title: 'Case Study: Thermal Comfort Gedung Hijau', sub: 'Studi Kasus Simulasi Distribusi Suhu Gedung Komersial' },
  { filename: 'whitepaper_cae.pdf', title: 'Whitepaper: Peran CAE pada Industri Manufaktur', sub: 'Kajian Teknis Penerapan Simulasi Engineering' },
  { filename: 'placeholder.pdf', title: 'Dokumen Marketing ERP Infimech', sub: 'Materi Pemasaran & Publikasi' }
];

pdfAssets.forEach(item => {
  const buf = createValidPdfBuffer(item.title, item.sub);
  fs.writeFileSync(path.join(__dirname, 'assets', 'files', item.filename), buf);
  fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'public', 'assets', 'files', item.filename), buf);
  console.log(`Created PDF: ${item.filename}`);
});

// DOCX
fs.writeFileSync(path.join(__dirname, 'assets', 'files', 'proposal_template_cae.docx'), sampleDocxBuffer);
fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'public', 'assets', 'files', 'proposal_template_cae.docx'), sampleDocxBuffer);
console.log('Created DOCX: proposal_template_cae.docx');

// PNG Image
fs.writeFileSync(path.join(__dirname, 'assets', 'images', 'cfd_aero.png'), samplePngBuffer);
fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'public', 'assets', 'images', 'cfd_aero.png'), samplePngBuffer);
console.log('Created PNG: cfd_aero.png');

console.log('All sample asset files created successfully!');
