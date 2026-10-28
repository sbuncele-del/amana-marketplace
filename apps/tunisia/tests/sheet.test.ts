import assert from 'node:assert/strict';
import {crc32} from 'node:zlib';
import {test} from 'node:test';
import {analyse, groupProducts, htmlToText, readXlsx, toContent} from '../lib/import/sheet';
const hosts = ['cdn.shipper.network'];
// Builds a minimal stored (uncompressed) .xlsx so the reader is tested on real zip bytes.
function xlsx(table: string[][]) {
 const strings: string[] = [];
 const idx = (s: string) => { let i = strings.indexOf(s); if (i < 0) { strings.push(s); i = strings.length - 1; } return i; };
 const colName = (n: number) => String.fromCharCode(65 + n);
 const sheet = `<worksheet><sheetData>${table.map((r, y) => `<row r="${y + 1}">${r.map((c, x) => c === '' ? '' : `<c r="${colName(x)}${y + 1}" t="s"><v>${idx(c)}</v></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
 const sst = `<sst>${strings.map(s => `<si><t>${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</t></si>`).join('')}</sst>`;
 const files: [string, string][] = [['xl/worksheets/sheet1.xml', sheet], ['xl/sharedStrings.xml', sst]];
 const parts: Buffer[] = [], central: Buffer[] = [];
 let offset = 0;
 for (const [name, text] of files) {
  const n = Buffer.from(name), d = Buffer.from(text), crc = crc32(d);
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt32LE(crc, 14); local.writeUInt32LE(d.length, 18); local.writeUInt32LE(d.length, 22); local.writeUInt16LE(n.length, 26);
  const dir = Buffer.alloc(46); dir.writeUInt32LE(0x02014b50, 0); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt32LE(crc, 16); dir.writeUInt32LE(d.length, 20); dir.writeUInt32LE(d.length, 24); dir.writeUInt16LE(n.length, 28); dir.writeUInt32LE(offset, 42);
  parts.push(local, n, d); central.push(dir, n); offset += 30 + n.length + d.length;
 }
 const cd = Buffer.concat(central), end = Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
 return Buffer.concat([...parts, cd, end]);
}
const head = ['ID', 'Parent ID', 'Supplier', 'Name', 'Description', 'Images', 'Categories', 'Variations', 'Dropshipping Cost', 'Sell Price', 'Recommended Retail Price', 'Available Stock', 'Fulfilled By'];
const line = (o: Record<string, string>) => head.map(h => o[h] ?? '');
const img = 'https://cdn.shipper.network/a.jpg';
const long = 'Une description assez longue pour ne pas être considérée comme trop courte par le contrôle.';
const base = {Supplier: 'S1', Description: `<p>${long}</p>`, Images: img, Categories: 'Kitchen|Home', 'Dropshipping Cost': '10', 'Sell Price': '20', 'Recommended Retail Price': '25', 'Available Stock': '5'};

test('reads strings, empty cells and XML entities from real xlsx bytes', () => {
 const rows = readXlsx(xlsx([head, line({ID: 'a1', Name: 'Pots & <jars>', ...base})]));
 assert.equal(rows.length, 1);
 assert.equal(rows[0]['Name'], 'Pots & <jars>');
 assert.equal(rows[0]['Parent ID'], '');
 assert.equal(rows[0]['Sell Price'], '20');
});
test('rejects non-xlsx input instead of guessing', () => assert.throws(() => readXlsx(Buffer.from('not a zip file at all, just text'))));
test('groups variants under their parent ID and keeps single products single', () => {
 const rows = readXlsx(xlsx([head,
  line({ID: 'p1', 'Parent ID': 'p1', Name: 'Casque', Variations: 'Color:noir', ...base, 'Available Stock': '0'}),
  line({ID: 'p2', 'Parent ID': 'p1', Name: 'Casque', Variations: 'Color:rouge', ...base, 'Available Stock': '197'}),
  line({ID: 's1', Name: 'Entonnoir', ...base}),
  line({ID: 's1', Name: 'Entonnoir again', ...base})]));
 const {products, skipped} = groupProducts(rows);
 assert.equal(products.length, 2);
 const casque = products.find(p => p.id === 'p1')!;
 assert.deepEqual(casque.variants.map(v => v.id), ['p1', 'p2']);
 assert.equal(casque.stock, 197);
 assert.equal(skipped.length, 1);
 assert.equal(skipped[0].reason, 'duplicate ID in file');
});
test('converts to content in the source language only and never invents English', () => {
 const [fr] = groupProducts(readXlsx(xlsx([head, line({ID: 'f1', Name: 'Hachoir manuel', ...base})]))).products;
 const [ar] = groupProducts(readXlsx(xlsx([head, line({ID: 'a1', Name: 'زيت الخروع', ...base, Description: '<p>زيت طبيعي للشعر والبشرة ويستخدم يوميا بكميات صغيرة</p>'})]))).products;
 const f = toContent(fr, {imageHosts: hosts})!, a = toContent(ar, {imageHosts: hosts})!;
 assert.equal(f.title.fr, 'Hachoir manuel'); assert.equal(f.title.en, ''); assert.equal(f.title.ar, '');
 assert.equal(a.title.ar, 'زيت الخروع'); assert.equal(a.title.fr, '');
 assert.equal(f.category, 'Kitchen');
 assert.match(f.slug, /^hachoir-manuel-f1$/);
 assert.equal(f.reviewState, 'approved');
});
test('drops images from hosts that are not allowed', () => {
 const [p] = groupProducts(readXlsx(xlsx([head, line({ID: 'i1', Name: 'X', ...base, Images: `${img}|http://evil.example/x.jpg|https://other.example/y.jpg`})]))).products;
 assert.deepEqual(toContent(p, {imageHosts: hosts})!.images, [img]);
});
test('turns HTML into readable plain text', () => {
 assert.equal(htmlToText('<h3>Titre</h3><ul><li>Un &amp; deux</li><li>Trois</li></ul><p><br></p>'), 'Titre\n\n- Un & deux\n- Trois');
 assert.ok(htmlToText('x'.repeat(5000) + ' fin', 100).length <= 101);
});
test('flags gaps and suspected duplicates without removing anything', () => {
 const rows = readXlsx(xlsx([head,
  line({ID: 'd1', Name: 'Tablier de cuisine', ...base}),
  line({ID: 'd2', Name: 'tablier  de Cuisine', ...base}),
  line({ID: 'o1', Name: 'Autre', ...base, Supplier: 'S2'}),
  line({ID: 'z1', Name: 'Sans stock', ...base, 'Available Stock': '0', 'Recommended Retail Price': '', 'Sell Price': '10', Description: '<p>court</p>'}),
  line({ID: 'live1', Name: 'Réveil Digital LCD', ...base})]));
 const {products} = groupProducts(rows);
 const {rows: report, duplicateGroups} = analyse(products, {existingNames: new Set(['reveil digital lcd']), imageHosts: hosts});
 assert.equal(report.length, 5);
 assert.equal(duplicateGroups.length, 1);
 const flags = (id: string) => report.find(r => r.id === id)!.flags;
 assert.ok(flags('d1').includes('possible_duplicate') && flags('d2').includes('possible_duplicate'));
 assert.deepEqual(report.find(r => r.id === 'd1')!.duplicateOf, ['d2']);
 assert.ok(!flags('o1').includes('possible_duplicate'));
 for (const f of ['zero_stock', 'no_recommended_price', 'sell_at_or_below_cost', 'short_description'] as const) assert.ok(flags('z1').includes(f), f);
 assert.ok(flags('live1').includes('already_in_shop'));
});
