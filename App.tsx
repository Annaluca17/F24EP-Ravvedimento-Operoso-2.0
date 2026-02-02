
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import F24Preview from './components/F24Preview';
import { TAX_CODES } from './constants';
import { F24Row, CalculationResult, InterestPeriod } from './types';
import { calculateRow, formatCurrency } from './utils/calculation';

function App() {
  const [originalDueDate, setOriginalDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ravvedimentoDate, setRavvedimentoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [rows, setRows] = useState<F24Row[]>([]);
  
  // New Row State
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>(TAX_CODES[0].code);
  const [amount, setAmount] = useState<string>('');
  const [refMonth, setRefMonth] = useState<string>('01');
  const [refYear, setRefYear] = useState<string>(new Date().getFullYear().toString());

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // Modal State
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedInterestDetails, setSelectedInterestDetails] = useState<{code: string, amount: number, details: InterestPeriod[]} | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('color-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleAddRow = () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    const taxInfo = TAX_CODES.find(t => t.code === selectedTaxCode);
    const newRow: F24Row = {
      id: Math.random().toString(36).substr(2, 9),
      taxCode: selectedTaxCode,
      description: taxInfo?.description || '',
      originalAmount: parseFloat(amount),
      referenceMonth: refMonth,
      referenceYear: refYear
    };
    
    setRows([...rows, newRow]);
    setAmount('');
  };

  const handleRemoveRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const openInterestModal = (code: string, originalAmount: number, details: InterestPeriod[]) => {
    setSelectedInterestDetails({
      code,
      amount: originalAmount,
      details
    });
    setInterestModalOpen(true);
  };

  const closeInterestModal = () => {
    setInterestModalOpen(false);
    setSelectedInterestDetails(null);
  };

  const results: CalculationResult[] = useMemo(() => {
    return rows.map(row => calculateRow(row, originalDueDate, ravvedimentoDate));
  }, [rows, originalDueDate, ravvedimentoDate]);

  return (
    <>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 w-full relative">
        
        {/* Info Banner (Chapter 5.2 - Transparency) */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-italia-blue p-4 rounded-r shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-italia-blue" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Nota Informativa:</strong> Questo strumento supporta il calcolo del ravvedimento operoso secondo la normativa vigente (inclusa Riforma D.Lgs 87/2024). I calcoli sono da intendersi come supporto operativo e non sostituiscono le verifiche ufficiali.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <section className="bg-white dark:bg-gray-800 rounded shadow-md border-t-4 border-italia-blue p-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-italia-dark dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
            1. Date di Riferimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Scadenza Originaria</label>
              <input 
                type="date" 
                value={originalDueDate}
                onChange={(e) => setOriginalDueDate(e.target.value)}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Data Ravvedimento (Pagamento)</label>
              <input 
                type="date" 
                value={ravvedimentoDate}
                onChange={(e) => setRavvedimentoDate(e.target.value)}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Input Card */}
        <section className="bg-white dark:bg-gray-800 rounded shadow-md border-t-4 border-italia-blue p-6 transition-colors duration-200">
           <h2 className="text-xl font-bold text-italia-dark dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
            2. Inserimento Tributi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Codice Tributo</label>
              <select 
                value={selectedTaxCode}
                onChange={(e) => setSelectedTaxCode(e.target.value)}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              >
                {TAX_CODES.map(code => (
                  <option key={code.code} value={code.code}>{code.code} - {code.description}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mese (MM)</label>
              <select 
                value={refMonth}
                onChange={(e) => setRefMonth(e.target.value)}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              >
                {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Anno (AAAA)</label>
              <input 
                type="number"
                value={refYear}
                onChange={(e) => setRefYear(e.target.value)}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Importo Omesso (€)</label>
              <input 
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            <div className="md:col-span-1">
              <button 
                onClick={handleAddRow}
                className="w-full bg-italia-blue text-white py-3 px-4 rounded font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md transition-all transform hover:scale-105 flex justify-center items-center"
                title="Aggiungi Tributo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>
            </div>
          </div>
        </section>

        {/* Calculation Table */}
        {rows.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded shadow-md border-t-4 border-italia-blue overflow-hidden transition-colors duration-200">
             <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-italia-dark dark:text-white">Riepilogo Calcoli</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Codice</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Riferimento</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Importo Orig.</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ritardo</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Interessi (Calc.)</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sanzione</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Totale Versamento</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((row) => {
                    const result = results.find(r => r.rowId === row.id);
                    if(!result) return null;
                    return (
                      <tr key={row.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">{row.taxCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{row.referenceMonth}/{row.referenceYear}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{formatCurrency(row.originalAmount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">
                          <span className="block font-semibold">{result.daysLate} gg</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">{result.ravvedimentoType}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-700 dark:text-orange-400 font-bold text-right font-mono">
                          <div className="flex items-center justify-end gap-2">
                            <span>{formatCurrency(result.legalInterest)}</span>
                            <button 
                              onClick={() => openInterestModal(row.taxCode, row.originalAmount, result.interestDetails)}
                              className="text-italia-blue dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none focus:text-blue-800"
                              title="Visualizza dettaglio calcolo interessi"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          {result.legalInterest > 0 && result.legalInterest < 1.03 && (
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 mt-1">
                              &lt; Min
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 dark:text-red-400 font-bold text-right font-mono">
                          <span className="block">{formatCurrency(result.sanctionAmount)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500 font-normal">({result.sanctionPercentage.toFixed(2)}%)</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-italia-blue dark:text-blue-300 text-right font-mono text-base">
                          {formatCurrency(result.totalTaxWithInterest + result.totalSanction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button onClick={() => handleRemoveRow(row.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
               <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                 Nota: Se l'interesse calcolato è inferiore a € 1,03, potrebbe non essere dovuto in quanto inferiore al minimale di versamento.
               </p>
            </div>
          </section>
        )}

        <F24Preview rows={rows} results={results} />

      </main>

      {/* Interest Details Modal */}
      {interestModalOpen && selectedInterestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] border-t-4 border-italia-blue">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-lg">
              <div>
                <h3 className="text-lg font-bold text-italia-dark dark:text-white">Dettaglio Calcolo Interessi Legali</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Codice Tributo: <span className="font-mono font-bold">{selectedInterestDetails.code}</span> - Capitale: {formatCurrency(selectedInterestDetails.amount)}</p>
              </div>
              <button onClick={closeInterestModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Gli interessi legali sono calcolati pro-rata temporis in base al tasso legale vigente per ciascun periodo di ritardo.
              </p>
              <div className="border rounded-md overflow-hidden border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Periodo</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Giorni</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Tasso</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Importo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedInterestDetails.details.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">Nessun interesse maturato.</td>
                      </tr>
                    ) : (
                      selectedInterestDetails.details.map((detail, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            Dal {new Date(detail.startDate).toLocaleDateString('it-IT')} al {new Date(detail.endDate).toLocaleDateString('it-IT')}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-mono text-gray-700 dark:text-gray-300">{detail.days}</td>
                          <td className="px-4 py-3 text-center text-sm font-mono text-gray-700 dark:text-gray-300">{detail.rate.toFixed(2)}%</td>
                          <td className="px-4 py-3 text-right text-sm font-mono font-bold text-italia-blue dark:text-blue-400">
                            {formatCurrency(detail.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-900 font-bold border-t border-gray-200 dark:border-gray-700">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm text-gray-800 dark:text-gray-200 uppercase">Totale Interessi</td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-italia-blue dark:text-blue-400">
                        {formatCurrency(selectedInterestDetails.details.reduce((sum, d) => sum + d.amount, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end">
              <button 
                onClick={closeInterestModal}
                className="bg-italia-blue text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
}

export default App;
