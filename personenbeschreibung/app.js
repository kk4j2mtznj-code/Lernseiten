'use strict';

const people = [
  { alt: 'Ganzkörperfoto einer Frau mit silbergrauen Haaren, türkisfarbenem Schal und langem Mantel.',
    words: ['älter, aufrecht, kräftig gebaut', 'silbergrau, kurz, kraus', 'eckig, geschwungen, schwarz', 'magentafarben, cremefarben, senfgelb', 'türkisfarben, rund, schwarz-weiß kariert'] },
  { alt: 'Ganzkörperfoto eines Mannes mit rötlichen Haaren, Bart, Brille und kariertem Hemd.',
    words: ['mittleren Alters, aufrecht, breitschultrig', 'rötlich, seitlich kurz rasiert, nach oben gekämmt', 'rechteckig, blau gerahmt, kurz gestutzt', 'rot-schwarz kariert, dunkelgrün, hellbraun', 'schmal, schräg, auffällig'] },
  { alt: 'Ganzkörperzeichnung einer Comicfigur mit violetten Haaren, Sternspange und roten Schuhen.',
    words: ['jugendlich, schlank, aufrecht', 'violett, seitlich länger, glatt', 'gelb, rund, groß', 'olivgrün, orange, knielang, gestreift', 'sternförmig, gelb, blitzförmig'] },
];
const sections = [
  ['Gesamteindruck', 'Wie alt wirkt die Person? Wie wirken Figur und Haltung? Ist ihre Größe abschätzbar?', 'Auf dem Bild ist … zu sehen. Die Person wirkt …'],
  ['Haare', 'Welche Farbe, Länge und Form haben die Haare?', 'Die Person hat … Haare. Vorne …'],
  ['Gesicht', 'Welche Form hat das Gesicht? Was fällt an Augen, Nase, Mund oder Brille auf?', 'Das Gesicht ist … Über den Augen …'],
  ['Kleidung', 'Was trägt die Person am Oberkörper, an den Beinen und an den Füßen?', 'Am Oberkörper trägt die Person … Dazu trägt sie … An den Füßen …'],
  ['Besondere Kennzeichen', 'Woran kannst du die Person gut wiedererkennen? Wo sitzt das Merkmal?', 'Besonders auffällig ist … An … erkennt man …'],
];
const checks = [
  ['Präsens', 'Stehen die Verben in der Gegenwart?', 'Die Person ist … Sie trägt …'],
  ...sections,
  ['Reihenfolge', 'Beginnst du mit dem Gesamteindruck und gehst dann von oben nach unten vor?', 'Auf dem Bild sieht man … Am Kopf … An den Füßen …'],
  ['Passende Adjektive', 'Passen die Wörter wirklich zu Farbe, Form und Größe?', 'Die Jacke ist … Die Schuhe sind …'],
  ['Genau und anschaulich', 'Nennst du genaue Farben, Formen oder Muster?', 'Auf dem Oberteil sieht man …'],
  ['Sachlich bleiben', 'Beschreibst du sichtbare Merkmale ohne persönliche Meinung?', 'Zu sehen ist … Auffällig ist …'],
];

const byId = id => document.getElementById(id);
const personButtons = [...document.querySelectorAll('[data-person]')];
const levelButtons = [...document.querySelectorAll('[data-level]')];
const writing = byId('writing');
const dialog = byId('pdf-dialog');
const key = 'lernseiten-personenbeschreibung-v1';
let drafts = {};
try { drafts = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
let person = 0;
let level = 1;
let pdfUrl;

function element(tag, content, className) {
  const node = document.createElement(tag);
  node.textContent = content;
  if (className) node.className = className;
  return node;
}
function setStatus(message = '') {
  byId('status').textContent = message;
  byId('status').hidden = !message;
}
function paragraphFields() {
  return [...writing.querySelectorAll('textarea')];
}
function draftKey() { return person + ':' + (level === 1 ? 'fields' : 'whole'); }
function saveDraft() {
  drafts[draftKey()] = paragraphFields().map(field => field.value);
  try { localStorage.setItem(key, JSON.stringify(drafts)); } catch {}
}
function field(id, label, value) {
  const container = element('div', '', 'field');
  const labelNode = element('label', label);
  labelNode.htmlFor = id;
  const area = element('textarea', '');
  area.id = id;
  area.lang = 'de';
  area.spellcheck = true;
  area.value = value || '';
  area.addEventListener('input', () => { saveDraft(); setStatus(); });
  container.append(labelNode, area);
  return container;
}
function render() {
  personButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === person)));
  levelButtons.forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.level === level)));
  const imageUrl = personButtons[person].querySelector('img').src;
  byId('portrait').src = imageUrl;
  byId('portrait').alt = people[person].alt;
  byId('large-photo').href = imageUrl;
  byId('photo-link').href = imageUrl;
  byId('caption').textContent = personButtons[person].innerText;
  writing.replaceChildren();
  setStatus();
  const values = drafts[draftKey()] || [];
  if (level === 1) {
    sections.forEach(([name, question, start], i) => {
      const area = field('part-' + i, name, values[i]);
      const help = element('details', '');
      help.append(element('summary', 'Hilfe anzeigen'), element('p', question, 'help'),
        element('p', 'Satzanfänge: ' + start, 'help'),
        element('p', 'Passende Adjektive: ' + people[person].words[i], 'help'));
      area.append(help);
      writing.append(area);
    });
    return;
  }
  if (level === 2) {
    const list = element('ul', '', 'checklist');
    checks.forEach(([name, question, start]) => {
      const item = element('li', '');
      item.append(element('strong', name + ' – '), document.createTextNode(question),
        element('small', 'Satzanfänge: ' + start));
      list.append(item);
    });
    writing.append(list);
  }
  const area = field('whole', 'Dein Text', values[0]);
  area.firstChild.hidden = true;
  if (level === 3) area.lastChild.setAttribute('aria-label', 'Dein Text');
  else area.lastChild.setAttribute('aria-label', 'Dein zusammenhängender Text');
  writing.append(area);
}
personButtons.forEach(button => button.addEventListener('click', () => { person = +button.dataset.person; render(); }));
levelButtons.forEach(button => button.addEventListener('click', () => {
  const selected = +button.dataset.level;
  if (selected !== 1 && level === 1 && !drafts[person + ':whole']?.some(s => s.trim())) {
    const paragraphs = paragraphFields().map(field => field.value.trim()).filter(Boolean);
    if (paragraphs.length) {
      drafts[person + ':whole'] = [paragraphs.join('\n\n')];
      try { localStorage.setItem(key, JSON.stringify(drafts)); } catch {}
    }
  }
  level = selected;
  render();
}));

function pdfText(text, font) {
  return Array.from(text.normalize('NFC').replace(/\t/g, '    '), char => {
    if (char === '\n') return char;
    try { font.encodeText(char); return char; } catch { return '?'; }
  }).join('');
}
function wrap(line, font, size, width) {
  const rows = [];
  let current = '';
  for (const word of line.trim().split(/\s+/u)) {
    const combined = current ? current + ' ' + word : word;
    if (font.widthOfTextAtSize(combined, size) <= width) {
      current = combined;
      continue;
    }
    if (current) rows.push(current);
    current = '';
    for (const char of word) {
      if (font.widthOfTextAtSize(current + char, size) > width) {
        rows.push(current);
        current = '';
      }
      current += char;
    }
  }
  rows.push(current);
  return rows;
}
async function generatePdf(text, personNumber) {
  const { PDFDocument, StandardFonts, PageSizes } = PDFLib;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = 14;
  const lineHeight = size * 1.5;
  const margin = 56;
  let page = doc.addPage(PageSizes.A4);
  let y = page.getHeight() - margin - size;
  doc.setTitle('Personenbeschreibung – Person ' + personNumber);
  page.drawText('Personenbeschreibung – Person ' + personNumber, { x: margin, y, font: bold, size });
  y -= lineHeight * 2;
  for (const line of pdfText(text, font).split('\n')) {
    for (const row of wrap(line, font, size, page.getWidth() - 2 * margin)) {
      if (y < margin) {
        page = doc.addPage(PageSizes.A4);
        y = page.getHeight() - margin - size;
      }
      if (row) page.drawText(row, { x: margin, y, font, size });
      y -= lineHeight;
    }
  }
  return doc.save();
}
byId('save').addEventListener('click', async () => {
  const text = paragraphFields().map(field => field.value.trim()).filter(Boolean).join('\n\n');
  if (!text) {
    setStatus('Schreibe etwas in das Textfeld, bevor du die PDF erstellst.');
    paragraphFields()[0].focus();
    return;
  }
  const personNumber = person + 1;
  byId('save').disabled = true;
  try {
    const bytes = await generatePdf(text, personNumber);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    pdfUrl = URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'}));
    byId('download').href = pdfUrl;
    byId('download').download = 'Personenbeschreibung-Person-' + personNumber + '.pdf';
    byId('open-pdf').href = pdfUrl;
    byId('pdf-view').src = pdfUrl;
    setStatus();
    dialog.showModal();
  } catch {
    setStatus('Die PDF konnte gerade nicht erstellt werden. Versuche es noch einmal.');
  } finally {
    byId('save').disabled = false;
  }
});
byId('close-pdf').addEventListener('click', () => dialog.close());
render();
