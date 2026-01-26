import React from 'react';
import { CalculationResult, F24Row } from '../types';
import { getSanctionCode, formatCurrency } from '../utils/calculation';
import { SANCTION_CODES_DESC } from '../constants';

interface Props {
  rows: F24Row[];
  results: CalculationResult[];
}

const F24Preview: React.FC<Props> = ({ rows, results }) => {
  if (rows.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-8 transition-colors duration-200">
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex justify-between items-end">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Prospetto Versamento F24EP
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 italic">Fac-simile non ufficiale</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px] border-2 border-blue-600 dark:border-blue-500">
          {/* Header Row */}
          <div className="grid grid-cols-12 text-xs font-bold text-center bg-blue-50 dark:bg-blue-900/30 border-b border-blue-600 dark:border-blue-500 divide-x divide-blue-600 dark:divide-blue-500 text-gray-800 dark:text-gray-200">
            <div className="col-span-1 p-2">Sezione</div>
            <div className="col-span-2 p-2">Codice Tributo</div>
            <div className="col-span-1 p-2">Codice</div>
            <div className="col-span-3 p-2">Estremi identificativi</div>
            <div className="col-span-2 p-2">Riferimento A</div>
            <div className="col-span-1 p-2">Riferimento B</div>
            <div className="col-span-2 p-2">Importi a debito versati</div>
          </div>

          {/* Data Rows */}
          {rows.map((row) => {
            const result = results.find(r => r.rowId === row.id);
            if (!result) return null;

            // Row 1: The Tax Code (includes Interest)
            return (
              <React.Fragment key={row.id}>
                {/* Tax Row */}
                <div className="grid grid-cols-12 text-sm text-center border-b border-gray-300 dark:border-gray-600 divide-x divide-gray-300 dark:divide-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-white dark:bg-gray-800">
                  <div className="col-span-1 p-2 font-mono text-gray-900 dark:text-gray-100">EL</div>
                  <div className="col-span-2 p-2 font-mono font-bold text-gray-800 dark:text-gray-100">{row.taxCode}</div>
                  <div className="col-span-1 p-2 font-mono"></div>
                  <div className="col-span-3 p-2 font-mono text-xs text-left truncate px-2 text-gray-700 dark:text-gray-300" title={row.description}>
                    {row.description}
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                      <span>(Incl. interessi € {result.legalInterest.toFixed(2)})</span>
                      {result.legalInterest > 0 && result.legalInterest < 1.03 && (
                        <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1 rounded border border-orange-200 dark:border-orange-800" title="L'interesse può non essere dovuto in quanto inferiore al minimale (€ 1,03)">
                          ⚠️ &lt; Min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 p-2 font-mono text-gray-900 dark:text-gray-100">{row.referenceMonth} {row.referenceYear}</div>
                  <div className="col-span-1 p-2 font-mono text-gray-900 dark:text-gray-100">{row.referenceYear}</div>
                  <div className="col-span-2 p-2 font-mono font-bold text-right pr-4 text-blue-700 dark:text-blue-400">
                    {formatCurrency(result.totalTaxWithInterest)}
                  </div>
                </div>

                {/* Sanction Row */}
                {result.totalSanction > 0 && (
                  <div className="grid grid-cols-12 text-sm text-center border-b border-gray-300 dark:border-gray-600 divide-x divide-gray-300 dark:divide-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
                    <div className="col-span-1 p-2 font-mono text-gray-900 dark:text-gray-100">EL</div>
                    <div className="col-span-2 p-2 font-mono font-bold text-gray-800 dark:text-gray-100">{getSanctionCode(row.taxCode)}</div>
                    <div className="col-span-1 p-2 font-mono"></div>
                    <div className="col-span-3 p-2 font-mono text-xs text-left truncate px-2 italic text-gray-500 dark:text-gray-400">
                      {SANCTION_CODES_DESC[getSanctionCode(row.taxCode)] || 'Sanzione'}
                    </div>
                    <div className="col-span-2 p-2 font-mono text-gray-900 dark:text-gray-100">{row.referenceMonth} {row.referenceYear}</div>
                    <div className="col-span-1 p-2 font-mono text-gray-900 dark:text-gray-100">{row.referenceYear}</div>
                    <div className="col-span-2 p-2 font-mono font-bold text-right pr-4 text-red-700 dark:text-red-400">
                      {formatCurrency(result.totalSanction)}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
          
          {/* Total Row */}
           <div className="grid grid-cols-12 text-sm text-center bg-blue-50 dark:bg-blue-900/30 font-bold text-gray-800 dark:text-gray-200">
            <div className="col-span-10 p-2 text-right">TOTALE GENERALE</div>
            <div className="col-span-2 p-2 text-right pr-4">
              {formatCurrency(results.reduce((acc, curr) => acc + curr.totalTaxWithInterest + curr.totalSanction, 0))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>* Importi arrotondati alla seconda cifra decimale come da standard F24.</p>
        <p>** <span className="font-semibold text-blue-700 dark:text-blue-400">Importo Codice Tributo</span>: Comprende l'imposta originaria + interessi legali maturati (visualizzati nel dettaglio).</p>
        <p>*** Calcolo Sanzioni aggiornato alla Riforma D.Lgs 87/2024 (Base 12.5% entro 90gg / 25% oltre).</p>
      </div>
    </div>
  );
};

export default F24Preview;