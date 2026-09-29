/* xlsx-lite: tiny dependency-free .xlsx reader/writer for this app (works offline).
   read(arrayBuffer) -> Promise<[{name, rows:[[values]], links:{"r,c":url}}]>
   write([{name, rows, widths?}]) -> Blob                                            */
(function () {
  const td = new TextDecoder(), te = new TextEncoder();

  // ---------- ZIP read ----------
  async function inflateRaw(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function unzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Not a valid .xlsx file');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = {};
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true);
      const name = td.decode(u8.subarray(p + 46, p + 46 + nlen));
      const lnlen = dv.getUint16(off + 26, true), lxlen = dv.getUint16(off + 28, true);
      const start = off + 30 + lnlen + lxlen;
      files[name] = { method, data: u8.subarray(start, start + csize) };
      p += 46 + nlen + xlen + clen;
    }
    return {
      has: (n) => !!files[n],
      text: async (n) => {
        const f = files[n]; if (!f) return null;
        const raw = f.method === 0 ? f.data : await inflateRaw(f.data);
        return td.decode(raw);
      }
    };
  }
  const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
  const all = (node, tag) => Array.from(node.getElementsByTagNameNS('*', tag));
  function colIndex(ref) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref); if (!m) return [0, 0];
    let c = 0; for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64);
    return [parseInt(m[2], 10) - 1, c - 1];
  }
  function relsMap(doc) {
    const m = {}; if (!doc) return m;
    all(doc, 'Relationship').forEach(r => { m[r.getAttribute('Id')] = r.getAttribute('Target'); });
    return m;
  }
  async function read(buf) {
    const z = await unzip(buf);
    const wb = xml(await z.text('xl/workbook.xml'));
    const wbRels = relsMap(xml(await z.text('xl/_rels/workbook.xml.rels') || '<r/>'));
    const ssText = await z.text('xl/sharedStrings.xml');
    const shared = ssText ? all(xml(ssText), 'si').map(si => all(si, 't').map(t => t.textContent).join('')) : [];
    const out = [];
    for (const s of all(wb, 'sheet')) {
      const rid = s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || s.getAttribute('r:id');
      let target = wbRels[rid] || ''; target = target.replace(/^\//, '');
      const path = target.startsWith('xl/') ? target : 'xl/' + target;
      const sx = await z.text(path); if (!sx) continue;
      const doc = xml(sx), rows = [];
      for (const c of all(doc, 'c')) {
        const [r, ci] = colIndex(c.getAttribute('r') || '');
        const t = c.getAttribute('t'); const vEl = all(c, 'v')[0];
        let v = vEl ? vEl.textContent : null;
        if (t === 's') v = shared[parseInt(v, 10)];
        else if (t === 'inlineStr') v = all(c, 't').map(x => x.textContent).join('');
        else if (t === 'b') v = v === '1';
        else if (t === 'str' || t === 'e') { /* keep text */ }
        else if (v !== null && v !== '' && !isNaN(v)) v = Number(v);
        if (v === null || v === '') continue;
        (rows[r] = rows[r] || [])[ci] = v;
      }
      for (let i = 0; i < rows.length; i++) rows[i] = rows[i] || [];
      const links = {};
      const relPath = path.replace(/worksheets\/(sheet[^/]+)$/, 'worksheets/_rels/$1.rels');
      const sRels = relsMap(z.has(relPath) ? xml(await z.text(relPath)) : null);
      for (const h of all(doc, 'hyperlink')) {
        const rid2 = h.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || h.getAttribute('r:id');
        const [r, ci] = colIndex((h.getAttribute('ref') || '').split(':')[0]);
        if (sRels[rid2]) links[r + ',' + ci] = sRels[rid2];
      }
      out.push({ name: s.getAttribute('name'), rows, links });
    }
    return out;
  }

  // ---------- ZIP write (store, no compression) ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const parts = [], central = []; let offset = 0;
    for (const [name, content] of files) {
      const nb = te.encode(name), data = typeof content === 'string' ? te.encode(content) : content, crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nb.length, true);
      parts.push(new Uint8Array(lh.buffer), nb, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nb.length, true);
      ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nb);
      offset += 30 + nb.length + data.length;
    }
    const csize = central.reduce((a, b) => a + b.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, csize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  const escX = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const colName = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  function write(sheets) {
    const files = [];
    files.push(['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>']);
    files.push(['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>']);
    files.push(['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map((s, i) => `<sheet name="${escX(s.name).slice(0, 31)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>']);
    files.push(['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`]);
    files.push(['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2231A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']);
    sheets.forEach((s, i) => {
      const widths = s.widths || [];
      let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
      if (widths.length) x += '<cols>' + widths.map((w, c) => `<col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>';
      x += '<sheetData>';
      s.rows.forEach((row, r) => {
        x += `<row r="${r + 1}">`;
        (row || []).forEach((v, c) => {
          if (v === null || v === undefined || v === '') return;
          const ref = colName(c) + (r + 1);
          if (typeof v === 'number' && isFinite(v)) x += `<c r="${ref}"${r === 0 ? ' s="1"' : ' s="2"'}><v>${v}</v></c>`;
          else x += `<c r="${ref}" t="inlineStr"${r === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${escX(v)}</t></is></c>`;
        });
        x += '</row>';
      });
      x += '</sheetData></worksheet>';
      files.push([`xl/worksheets/sheet${i + 1}.xml`, x]);
    });
    return zip(files);
  }
  window.XLSXLite = { read, write };
})();
