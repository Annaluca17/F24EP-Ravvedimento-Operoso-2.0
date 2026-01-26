import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import F24Preview from './components/F24Preview';
import { TAX_CODES } from './constants';
import { F24Row, CalculationResult } from './types';
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

  useEffect(() => {
    // Check local storage or preference on mount
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

  // Calculate results whenever inputs change
  const results: CalculationResult[] = useMemo(() => {
    return rows.map(row => calculateRow(row, originalDueDate, ravvedimentoDate));
  }, [rows, originalDueDate, ravvedimentoDate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-200">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Settings Card */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Date di Riferimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scadenza Originaria</label>
              <input 
                type="date" 
                value={originalDueDate}
                onChange={(e) => setOriginalDueDate(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Ravvedimento (Pagamento)</label>
              <input 
                type="date" 
                value={ravvedimentoDate}
                onChange={(e) => setRavvedimentoDate(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Input Card */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Inserimento Tributi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codice Tributo</label>
              <select 
                value={selectedTaxCode}
                onChange={(e) => setSelectedTaxCode(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
              >
                {TAX_CODES.map(code => (
                  <option key={code.code} value={code.code}>{code.code} - {code.description}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mese (MM)</label>
              <select 
                value={refMonth}
                onChange={(e) => setRefMonth(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
              >
                {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anno (AAAA)</label>
              <input 
                type="number"
                value={refYear}
                onChange={(e) => setRefYear(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Importo Omesso (€)</label>
              <input 
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>

            <div className="md:col-span-1">
              <button 
                onClick={handleAddRow}
                className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 shadow transition-colors flex justify-center items-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>
            </div>
          </div>
        </section>

        {/* Calculation Table */}
        {rows.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Riepilogo Calcoli</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Codice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Riferimento</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Importo Orig.</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ritardo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interessi (Calc.)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sanzione</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Totale Versamento</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((row) => {
                    const result = results.find(r => r.rowId === row.id);
                    if(!result) return null;
                    return (
                      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{row.taxCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{row.referenceMonth}/{row.referenceYear}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">{formatCurrency(row.originalAmount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                          <span className="block">{result.daysLate} gg</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{result.ravvedimentoType}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 dark:text-orange-400 font-medium text-right">
                          {formatCurrency(result.legalInterest)}
                          {result.legalInterest > 0 && result.legalInterest < 1.03 && (
                            <div className="text-[10px] text-orange-500 dark:text-orange-400 font-bold mt-1">
                              ⚠️ &lt; 1,03€
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium text-right">
                          <span className="block">{formatCurrency(result.sanctionAmount)}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">({result.sanctionPercentage.toFixed(2)}%)</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900 dark:text-blue-300 text-right">
                          {formatCurrency(result.totalTaxWithInterest + result.totalSanction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button onClick={() => handleRemoveRow(row.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
               <p className="text-xs text-gray-500 dark:text-gray-400">
                 ⚠️ Se l'interesse calcolato è inferiore a € 1,03, potrebbe non essere dovuto in quanto inferiore al minimale di versamento. Verificare le disposizioni specifiche dell'Ente.
               </p>
            </div>
          </section>
        )}

        <F24Preview rows={rows} results={results} />

      </main>
    </div>
  );
}

export default App;