
import React from 'react';
import { CalculationResult, F24Row } from '../types';
import { getSanctionCode, formatCurrency } from '../utils/calculation';
import { SANCTION_CODES_DESC, SANCTION_SECTIONS, TAX_CODES } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  rows: F24Row[];
  results: CalculationResult[];
}

interface AggregatedSanction {
  code: string;
  description: string;
  referenceYear: string;
  referenceMonth: string;
  amount: number;
  section: string;
  locationCode?: string;
}

const F24Preview: React.FC<Props> = ({ rows, results }) => {
  if (rows.length === 0) return null;

  // Group sanctions by Code + Year + Section + LocationCode
  // NOTE: Sanctions for Regional/Local taxes also require the region/municipality code.
  const aggregatedSanctions: Record<string, AggregatedSanction> = {};

  rows.forEach((row) => {
    const result = results.find((r) => r.rowId === row.id);
    if (!result || result.totalSanction <= 0) return;

    const sCode = getSanctionCode(row.taxCode);
    const sSection = SANCTION_SECTIONS[sCode] || row.section; // Default to row section if not mapped
    const locCode = row.locationCode || '';
    
    // Grouping Key must differentiate different location codes (e.g., sanction for Rome vs Milan)
    const key = `${sCode}_${row.referenceYear}_${locCode}`; 

    if (aggregatedSanctions[key]) {
      aggregatedSanctions[key].amount += result.totalSanction;
    } else {
      aggregatedSanctions[key] = {
        code: sCode,
        description: SANCTION_CODES_DESC[sCode] || 'Sanzione',
        referenceYear: row.referenceYear,
        referenceMonth: row.referenceMonth, // We keep the first month encountered as Ref A base
        amount: result.totalSanction,
        section: sSection,
        locationCode: row.locationCode // Keep the location code of the tax for the sanction
      };
    }
  });

  const sanctionRows = Object.values(aggregatedSanctions);

  const handleExportCSV = () => {
    const headers = [
      "Sezione",
      "Codice Tributo",
      "Codice",
      "Estremi identificativi",
      "Riferimento A",
      "Riferimento B",
      "Importi a debito versati"
    ];

    const csvRows = [];
    csvRows.push(headers.join(";")); // Semicolon for Italian Excel compatibility

    // 1. Tax Rows
    rows.forEach(row => {
      const result = results.find(r => r.rowId === row.id);
      if (!result) return;
      
      const taxInfo = TAX_CODES.find(t => t.code === row.taxCode);
      const isSanction = taxInfo?.isSanction;
      const description = isSanction 
        ? `"${row.description}"`
        : `"${row.description} (Incl. interessi € ${result.legalInterest.toFixed(2).replace('.', ',')})"`;

      const line = [
        row.section,
        row.taxCode,
        row.locationCode || "",
        description,
        `${row.referenceMonth} ${row.referenceYear}`.trim(),
        row.referenceYear,
        result.totalTaxWithInterest.toFixed(2).replace('.', ',')
      ];
      csvRows.push(line.join(";"));
    });

    // 2. Sanction Rows
    sanctionRows.forEach(sanction => {
      const line = [
        sanction.section,
        sanction.code,
        sanction.locationCode || "",
        `"${sanction.description}"`,
        `${sanction.referenceMonth} ${sanction.referenceYear}`,
        sanction.referenceYear,
        sanction.amount.toFixed(2).replace('.', ',')
      ];
      csvRows.push(line.join(";"));
    });

    // Total Row
    const totalAmount = results.reduce((acc, curr) => acc + curr.totalTaxWithInterest + curr.totalSanction, 0);
    csvRows.push([
        "", "", "", "TOTALE GENERALE", "", "", totalAmount.toFixed(2).replace('.', ',')
    ].join(";"));

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `F24EP_Ravvedimento_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // Initialize PDF in Landscape mode (F24EP is wide)
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204); // Italia Blue
    doc.text("MODELLO DI VERSAMENTO F24 ENTI PUBBLICI", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Prospetto di Liquidazione - Ravvedimento Operoso generato il ${new Date().toLocaleDateString('it-IT')}`, 14, 22);

    // Prepare Table Data
    const tableBody = [];

    // 1. Tax Rows
    rows.forEach(row => {
      const result = results.find(r => r.rowId === row.id);
      if (!result) return;
      
      const taxInfo = TAX_CODES.find(t => t.code === row.taxCode);
      const isSanction = taxInfo?.isSanction;
      const description = isSanction
        ? row.description
        : `${row.description}\n(Capitale: ${formatCurrency(row.originalAmount)} + Int: ${formatCurrency(result.legalInterest)})`;

      tableBody.push([
        row.section,
        row.taxCode,
        row.locationCode || "",
        description,
        `${row.referenceMonth} ${row.referenceYear}`.trim(),
        row.referenceYear,
        formatCurrency(result.totalTaxWithInterest),
        "" // Credit column empty
      ]);
    });

    // 2. Sanction Rows
    sanctionRows.forEach(sanction => {
      tableBody.push([
        sanction.section,
        sanction.code,
        sanction.locationCode || "",
        sanction.description,
        `${sanction.referenceMonth} ${sanction.referenceYear}`,
        sanction.referenceYear,
        formatCurrency(sanction.amount),
        "" // Credit column empty
      ]);
    });

    // Total Row
    const totalAmount = results.reduce((acc, curr) => acc + curr.totalTaxWithInterest + curr.totalSanction, 0);
    tableBody.push([
      { content: 'TOTALE GENERALE', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatCurrency(totalAmount), styles: { fontStyle: 'bold' } },
      ""
    ]);

    // Generate Table
    autoTable(doc, {
      startY: 30,
      head: [[
        "SEZIONE", 
        "CODICE\nTRIBUTO", 
        "CODICE", 
        "ESTREMI IDENTIFICATIVI", 
        "RIFERIMENTO A\n(mm/aaaa)", 
        "RIFERIMENTO B\n(aaaa)", 
        "IMPORTI A DEBITO\nVERSATI",
        "IMPORTI A CREDITO\nCOMPENSATI"
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 102, 204], // Italia Blue
        textColor: 255,
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1
      },
      bodyStyles: {
        fontSize: 9,
        valign: 'middle',
        textColor: 50
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 }, // Sezione
        1: { halign: 'center', cellWidth: 20 }, // Codice Tributo
        2: { halign: 'center', cellWidth: 20 }, // Codice (increased for visibility)
        3: { cellWidth: 'auto' },               // Estremi
        4: { halign: 'center', cellWidth: 25 }, // Rif A
        5: { halign: 'center', cellWidth: 20 }, // Rif B
        6: { halign: 'right', cellWidth: 30 },  // Debito
        7: { halign: 'right', cellWidth: 30 },  // Credito
      },
      footStyles: {
        fillColor: [240, 241, 242],
        textColor: 0,
        fontStyle: 'bold'
      }
    });

    // Footer / Disclaimer
    const finalY = (doc as any).lastAutoTable.finalY || 30;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Fac-simile non valido ai fini fiscali. Utilizzare i dati riportati per la compilazione del modello F24EP ufficiale.", 14, finalY + 10);

    doc.save(`F24EP_FacSimile_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md border-t-4 border-italia-blue mt-8 transition-colors duration-200">
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-italia-dark dark:text-white">
            Prospetto Versamento F24EP
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Anteprima dei codici da utilizzare nel modello F24 Enti Pubblici
          </p>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={handleExportCSV}
                className="bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold py-1 px-3 rounded text-sm transition-colors flex items-center gap-1 shadow-sm"
                title="Esporta i dati in formato CSV per Excel"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
             </button>
             <button 
                onClick={handleExportPDF}
                className="bg-italia-blue text-white hover:bg-blue-700 border border-transparent font-semibold py-1 px-3 rounded text-sm transition-colors flex items-center gap-1 shadow-sm"
                title="Scarica Fac-simile PDF F24EP"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Esporta PDF
             </button>
             <span className="hidden sm:inline-block text-xs text-gray-400 uppercase tracking-widest font-semibold border border-gray-300 px-2 py-1 rounded">Fac-simile</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px] border-2 border-italia-blue dark:border-blue-500">
          {/* Header Row */}
          <div className="grid grid-cols-12 text-xs font-bold text-center bg-blue-50 dark:bg-blue-900/30 border-b border-italia-blue dark:border-blue-500 divide-x divide-italia-blue dark:divide-blue-500 text-italia-dark dark:text-gray-200 uppercase tracking-wider">
            <div className="col-span-1 p-3 flex items-center justify-center">Sezione</div>
            <div className="col-span-2 p-3 flex items-center justify-center">Codice Tributo</div>
            <div className="col-span-1 p-3 flex items-center justify-center">Codice</div>
            <div className="col-span-3 p-3 flex items-center justify-center">Estremi identificativi</div>
            <div className="col-span-2 p-3 flex items-center justify-center">Riferimento A</div>
            <div className="col-span-1 p-3 flex items-center justify-center">Riferimento B</div>
            <div className="col-span-2 p-3 flex items-center justify-center">Importi a debito versati</div>
          </div>

          {/* 1. Tax Rows (Individual) */}
          {rows.map((row) => {
            const result = results.find(r => r.rowId === row.id);
            if (!result) return null;

            return (
              <div key={row.id} className="grid grid-cols-12 text-sm text-center border-b border-gray-300 dark:border-gray-600 divide-x divide-gray-300 dark:divide-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-white dark:bg-gray-800">
                <div className="col-span-1 p-2 font-mono font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-center text-[10px] sm:text-xs">
                    {row.section}
                </div>
                <div className="col-span-2 p-2 font-mono font-bold text-gray-800 dark:text-gray-100">{row.taxCode}</div>
                <div className="col-span-1 p-2 font-mono font-bold text-gray-800 dark:text-gray-100">{row.locationCode}</div>
                <div className="col-span-3 p-2 font-mono text-xs text-left truncate px-2 text-gray-700 dark:text-gray-300" title={row.description}>
                  {row.description}
                  {!TAX_CODES.find(t => t.code === row.taxCode)?.isSanction && (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                      <span>(Incl. interessi € {result.legalInterest.toFixed(2)})</span>
                      {result.legalInterest > 0 && result.legalInterest < 1.03 && (
                        <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1 rounded border border-orange-200 dark:border-orange-800" title="L'interesse può non essere dovuto in quanto inferiore al minimale (€ 1,03)">
                          ⚠️ &lt; Min
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-2 p-2 font-mono text-gray-900 dark:text-gray-100">{`${row.referenceMonth} ${row.referenceYear}`.trim()}</div>
                <div className="col-span-1 p-2 font-mono text-gray-900 dark:text-gray-100">{row.referenceYear}</div>
                <div className="col-span-2 p-2 font-mono font-bold text-right pr-4 text-italia-blue dark:text-blue-400">
                  {formatCurrency(result.totalTaxWithInterest)}
                </div>
              </div>
            );
          })}

          {/* 2. Aggregated Sanction Rows */}
          {sanctionRows.map((sanction, index) => (
            <div key={`sanction-${index}`} className="grid grid-cols-12 text-sm text-center border-b border-gray-300 dark:border-gray-600 divide-x divide-gray-300 dark:divide-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
              <div className="col-span-1 p-2 font-mono font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-center text-[10px] sm:text-xs">
                {sanction.section}
              </div>
              <div className="col-span-2 p-2 font-mono font-bold text-gray-800 dark:text-gray-100">{sanction.code}</div>
              <div className="col-span-1 p-2 font-mono font-bold text-gray-800 dark:text-gray-100">{sanction.locationCode}</div>
              <div className="col-span-3 p-2 font-mono text-xs text-left truncate px-2 italic text-gray-500 dark:text-gray-400">
                {sanction.description}
              </div>
              <div className="col-span-2 p-2 font-mono text-gray-900 dark:text-gray-100">
                {/* For aggregated sanctions, usually Ref A matches the year or is left blank if months differ. We show the month of the first entry for context or just the year. */}
                {sanction.referenceMonth} {sanction.referenceYear}
              </div>
              <div className="col-span-1 p-2 font-mono text-gray-900 dark:text-gray-100">{sanction.referenceYear}</div>
              <div className="col-span-2 p-2 font-mono font-bold text-right pr-4 text-red-700 dark:text-red-400">
                {formatCurrency(sanction.amount)}
              </div>
            </div>
          ))}
          
          {/* Total Row */}
           <div className="grid grid-cols-12 text-sm text-center bg-blue-50 dark:bg-blue-900/30 font-bold text-gray-800 dark:text-gray-200">
            <div className="col-span-10 p-3 text-right text-base">TOTALE GENERALE</div>
            <div className="col-span-2 p-3 text-right pr-4 text-base">
              {formatCurrency(results.reduce((acc, curr) => acc + curr.totalTaxWithInterest + curr.totalSanction, 0))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>* Importi arrotondati alla seconda cifra decimale come da standard F24.</p>
        <p>** <span className="font-semibold text-italia-blue dark:text-blue-400">Importo Codice Tributo</span>: Comprende l'imposta originaria + interessi legali maturati (visualizzati nel dettaglio).</p>
        <p>*** Calcolo Sanzioni aggiornato alla Riforma D.Lgs 87/2024 (Base 12.5% entro 90gg / 25% oltre).</p>
        <p>**** Le sanzioni con stesso codice e anno di riferimento sono aggregate in un'unica riga.</p>
      </div>
    </div>
  );
};

export default F24Preview;
