type PackingSlipData = {
  bolNumber?: string | null;
  carrierName: string | null;
  contactEmail: string | null;
  contactName: string | null;
  contactPhone: string | null;
  destinationCountry: string;
  destinationName: string | null;
  itemName: string | null;
  packageCount: number | null;
  packageType: string | null;
  partNumber: string | null;
  quantity: number | null;
  reference: string;
  shipmentDate: string;
  siteLabel: string | null;
  weightLabel: string | null;
};

function asciiText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pdfString(value: string) {
  return asciiText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textLine(text: string, x: number, y: number, size = 11) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${pdfString(text)}) Tj ET`;
}

function pdfObject(id: number, body: string) {
  return `${id} 0 obj\n${body}\nendobj\n`;
}

export function createPackingSlipPdf(data: PackingSlipData) {
  const lines = [
    textLine("Fixtarif - Packing slip brouillon", 54, 760, 20),
    textLine("Validation humaine requise avant utilisation officielle.", 54, 732, 10),
    textLine(`Reference: ${data.reference}`, 54, 690, 13),
    textLine(`Date: ${data.shipmentDate}`, 54, 670, 11),
    textLine(`Destination: ${data.destinationName ?? "A completer"}`, 54, 635, 12),
    textLine(`Pays: ${data.destinationCountry}`, 54, 615, 11),
    textLine(`Site: ${data.siteLabel ?? "A completer"}`, 54, 595, 11),
    textLine(`Contact: ${data.contactName ?? "A completer"}`, 54, 575, 11),
    textLine(`Courriel: ${data.contactEmail ?? "A completer"}`, 54, 555, 11),
    textLine(`Telephone: ${data.contactPhone ?? "A completer"}`, 54, 535, 11),
    textLine("Produit", 54, 490, 14),
    textLine(`Nom: ${data.itemName ?? "A completer"}`, 54, 466, 11),
    textLine(`Piece: ${data.partNumber ?? "Sans numero"}`, 54, 446, 11),
    textLine(`Quantite: ${data.quantity ?? 0}`, 54, 426, 11),
    textLine(`Poids: ${data.weightLabel ?? "A completer"}`, 54, 406, 11),
    textLine(`Colis: ${data.packageCount ?? 0} ${data.packageType ?? ""}`, 54, 386, 11),
    textLine("Transport", 54, 342, 14),
    textLine(`Transporteur: ${data.carrierName ?? "A completer"}`, 54, 318, 11),
    textLine("Document genere pour revision interne seulement.", 54, 84, 9),
  ];

  const content = lines.join("\n");
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"),
    pdfObject(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    pdfObject(5, `<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`),
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function createBillOfLadingPdf(data: PackingSlipData) {
  const lines = [
    textLine("Fixtarif - Connaissement brouillon", 54, 760, 20),
    textLine("Brouillon non legal. Validation humaine et clauses finales requises.", 54, 732, 10),
    textLine(`Reference expedition: ${data.reference}`, 54, 690, 13),
    textLine(`BOL: ${data.bolNumber ?? "A attribuer"}`, 54, 670, 12),
    textLine(`Date: ${data.shipmentDate}`, 54, 650, 11),
    textLine("Expediteur", 54, 610, 14),
    textLine("Nom: A completer depuis le profil entreprise", 54, 586, 11),
    textLine("Destinataire", 54, 546, 14),
    textLine(`Nom: ${data.destinationName ?? "A completer"}`, 54, 522, 11),
    textLine(`Site: ${data.siteLabel ?? "A completer"}`, 54, 502, 11),
    textLine(`Contact: ${data.contactName ?? "A completer"}`, 54, 482, 11),
    textLine("Transport", 54, 442, 14),
    textLine(`Transporteur: ${data.carrierName ?? "A completer"}`, 54, 418, 11),
    textLine("Marchandise", 54, 378, 14),
    textLine(`Produit: ${data.itemName ?? "A completer"}`, 54, 354, 11),
    textLine(`Piece: ${data.partNumber ?? "Sans numero"}`, 54, 334, 11),
    textLine(`Quantite: ${data.quantity ?? 0}`, 54, 314, 11),
    textLine(`Poids: ${data.weightLabel ?? "A completer"}`, 54, 294, 11),
    textLine(`Colis: ${data.packageCount ?? 0} ${data.packageType ?? ""}`, 54, 274, 11),
    textLine("Signatures et clauses transporteur a valider avant utilisation.", 54, 84, 9),
  ];

  const content = lines.join("\n");
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"),
    pdfObject(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    pdfObject(5, `<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`),
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([pdf], { type: "application/pdf" });
}
