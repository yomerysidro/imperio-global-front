import { Amount, FinanceIgReport } from './finance-ig-report.service';

type Row = [string, Amount?];

/** Creates a single-sheet XLSX directly from the values returned by Finance IG. */
export function createFinanceIgWorkbook(report: FinanceIgReport): Blob {
  const rows: Row[] = [
    ['Finanzas Imperio'],
    ['Período', report.period],
    ['Moneda', report.currency],
    ['Concepto', 'Importe (S/)'],
    ['VENTAS'],
    ['Precio público bruto', report.gross_public_sales],
    ['Descuentos o ajustes', report.price_adjustment],
    ['Ingresos cobrados', report.sales_collected],
    ['RENTABILIDAD'],
    ['Costo de productos vendidos', report.cost_of_sales],
    ['Utilidad bruta', report.gross_profit],
    ['Comisiones generadas: patrocinio', report.commissions_generated.sponsorship],
    ['Comisiones generadas: residual', report.commissions_generated.residual],
    ['Comisiones generadas: infinito', report.commissions_generated.infinity],
    ['Total de comisiones generadas', report.commissions_generated.total],
    ['Resultado después de comisiones', report.profit_after_commissions],
    ['ORIGEN DE LAS VENTAS'],
    ['Tienda: ventas', report.store.sales],
    ['Tienda: costo de productos', report.store.cost_of_sales],
    ['Tienda: utilidad bruta', report.store.gross_profit],
    ['Reactivaciones: ventas', report.reactivations.sales],
    ['Reactivaciones: costo de productos', report.reactivations.cost_of_sales],
    ['Reactivaciones: utilidad bruta', report.reactivations.gross_profit],
    ['Packs de afiliación: ingresos', report.affiliation_packs.sales],
    ['DINERO DEL PERÍODO'],
    ['Mercancía comprada', report.merchandise_purchased],
    ['Comisiones efectivamente pagadas', report.commissions_paid],
    ['Flujo neto de dinero', report.net_cash_flow],
    ['El resultado después de comisiones no incluye otros gastos.'],
    ['Los ingresos de packs no descuentan todavía la salida financiera de sus productos.']
  ];

  const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const stringCell = (address: string, value: string) =>
    `<c r="${address}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;
  const sheetRows = rows.map(([label, value], index) => {
    const row = index + 1;
    const amount = value === undefined ? '' :
      row <= 4 ? stringCell(`B${row}`, String(value)) :
      Number.isFinite(Number(value))
        ? `<c r="B${row}" s="1"><v>${Number(value)}</v></c>` : '';
    return `<row r="${row}">${stringCell(`A${row}`, label)}${amount}</row>`;
  }).join('');

  const files: Record<string, string> = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Finanzas Imperio" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;S/&quot; #,##0.00"/></numFmts><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`,
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:B${rows.length}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols><col min="1" max="1" width="52" customWidth="1"/><col min="2" max="2" width="21" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData></worksheet>`
  };

  return new Blob([zipStored(files)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

function zipStored(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder();
  const entries = Object.entries(files).map(([name, content]) => ({
    name: encoder.encode(name), data: encoder.encode(content)
  }));
  const localSize = entries.reduce((sum, entry) => sum + 30 + entry.name.length + entry.data.length, 0);
  const centralSize = entries.reduce((sum, entry) => sum + 46 + entry.name.length, 0);
  const bytes = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(bytes.buffer);
  let offset = 0;
  let centralOffset = localSize;
  const write16 = (at: number, value: number) => view.setUint16(at, value, true);
  const write32 = (at: number, value: number) => view.setUint32(at, value, true);

  for (const entry of entries) {
    const crc = crc32(entry.data);
    const start = offset;
    write32(offset, 0x04034b50);
    write16(offset + 4, 20);
    write16(offset + 8, 0);
    write32(offset + 14, crc);
    write32(offset + 18, entry.data.length);
    write32(offset + 22, entry.data.length);
    write16(offset + 26, entry.name.length);
    offset += 30;
    bytes.set(entry.name, offset);
    offset += entry.name.length;
    bytes.set(entry.data, offset);
    offset += entry.data.length;

    write32(centralOffset, 0x02014b50);
    write16(centralOffset + 4, 20);
    write16(centralOffset + 6, 20);
    write32(centralOffset + 16, crc);
    write32(centralOffset + 20, entry.data.length);
    write32(centralOffset + 24, entry.data.length);
    write16(centralOffset + 28, entry.name.length);
    write32(centralOffset + 42, start);
    centralOffset += 46;
    bytes.set(entry.name, centralOffset);
    centralOffset += entry.name.length;
  }

  write32(centralOffset, 0x06054b50);
  write16(centralOffset + 8, entries.length);
  write16(centralOffset + 10, entries.length);
  write32(centralOffset + 12, centralSize);
  write32(centralOffset + 16, localSize);
  return bytes;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
