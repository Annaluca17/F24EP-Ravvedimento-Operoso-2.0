
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import F24Preview from './components/F24Preview';
import InterestModal, { InterestModalData } from './components/InterestModal';
import { TAX_CODES, REGION_CODES, MIN_INTEREST_THRESHOLD } from './constants';
import { F24Row, CalculationResult } from './types';
import { calculateRow, formatCurrency, formatDate, parseDate, getDaysDiff, getLateSanctionTiers, findLateSanctionTier } from './utils/calculation';

function App() {
  const [originalDueDate, setOriginalDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ravvedimentoDate, setRavvedimentoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [rows, setRows] = useState<F24Row[]>([]);
  
  // New Row State
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>(TAX_CODES[0].code);
  const [amount, setAmount] = useState<string>('');
  const [tributiRefMonth, setTributiRefMonth] = useState<string>('01');
  const [tributiRefYear, setTributiRefYear] = useState<string>(new Date().getFullYear().toString());
  const [locationCode, setLocationCode] = useState<string>('');

  // Late Submission Sanction State
  const [lateModelType, setLateModelType] = useState<'CU' | '770'>('CU');
  const [cuCount, setCuCount] = useState<string>('1');
  const [sanctionRefYear, setSanctionRefYear] = useState<string>(new Date().getFullYear().toString());

  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [showRegionTooltip, setShowRegionTooltip] = useState(false);
  const regionTooltipRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [selectedInterestDetails, setSelectedInterestDetails] = useState<InterestModalData | null>(null);

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

  // Handle clicking outside the tooltip to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (regionTooltipRef.current && !regionTooltipRef.current.contains(event.target as Node)) {
        setShowRegionTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [regionTooltipRef]);

  // Reset location code when tax code changes
  useEffect(() => {
    setLocationCode('');
    setShowRegionTooltip(false);
  }, [selectedTaxCode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const selectedTaxInfo = useMemo(() => TAX_CODES.find(t => t.code === selectedTaxCode), [selectedTaxCode]);
  const isRegionCodeField = selectedTaxInfo?.requiresLocationCode && selectedTaxInfo?.locationCodeLabel?.toLowerCase().includes('regione');

  const handleAddRow = () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    const yearNum = parseInt(tributiRefYear, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2099) {
      alert("Inserire un anno valido (2000-2099).");
      return;
    }

    if (selectedTaxInfo?.requiresLocationCode && !locationCode) {
      alert(`Il campo "${selectedTaxInfo.locationCodeLabel}" è obbligatorio per questo codice tributo.`);
      return;
    }
    
    const newRow: F24Row = {
      id: crypto.randomUUID(),
      kind: selectedTaxInfo?.isSanction ? 'SANZIONE' : 'TRIBUTO',
      taxCode: selectedTaxCode,
      description: selectedTaxInfo?.description || '',
      originalAmount: parseFloat(amount),
      referenceMonth: tributiRefMonth,
      referenceYear: tributiRefYear,
      section: selectedTaxInfo?.section || 'ERARIO',
      locationCode: locationCode.toUpperCase()
    };
    
    setRows([...rows, newRow]);
    setAmount('');
    setLocationCode('');
  };

  const lateCount = lateModelType === 'CU' ? parseInt(cuCount, 10) : 1;
  const today = new Date().toISOString().split('T')[0];

  const lateTiers = useMemo(() => {
    if (isNaN(lateCount) || lateCount <= 0 || !originalDueDate) return [];
    return getLateSanctionTiers(lateModelType, lateCount, parseDate(originalDueDate));
  }, [lateModelType, lateCount, originalDueDate]);

  const selectedLateTier = useMemo(
    () => (ravvedimentoDate ? findLateSanctionTier(lateTiers, parseDate(ravvedimentoDate)) : undefined),
    [lateTiers, ravvedimentoDate]
  );
  const todayLateTier = useMemo(() => findLateSanctionTier(lateTiers, parseDate(today)), [lateTiers, today]);

  const handleAddLateSanction = (payDateOverride?: string) => {
    const payDateStr = payDateOverride ?? ravvedimentoDate;
    const daysLate = getDaysDiff(parseDate(originalDueDate), parseDate(payDateStr));

    if (daysLate <= 0) {
      alert("La data di ravvedimento deve essere successiva alla scadenza originaria per calcolare una sanzione per tardivo invio.");
      return;
    }

    const declarationYear = parseInt(sanctionRefYear, 10);
    if (isNaN(declarationYear) || declarationYear < 2000 || declarationYear > 2099) {
      alert("Inserire un anno valido (2000-2099).");
      return;
    }
    const incomeYear = declarationYear - 1;

    if (isNaN(lateCount) || lateCount <= 0) {
      alert("Inserire un numero valido di Certificazioni Uniche.");
      return;
    }

    const tier = findLateSanctionTier(lateTiers, parseDate(payDateStr));
    if (!tier || tier.total === null) {
      alert(tier?.note ?? "Nessuno scaglione di ravvedimento applicabile alla data indicata.");
      return;
    }

    const description = lateModelType === 'CU'
      ? `Sanzione tardivo invio CU (${tier.label}, rid. ${tier.reduction}) - ${lateCount} cert. - Anno dichiarazione ${declarationYear} redditi ${incomeYear}`
      : `Sanzione tardivo invio Modello 770 (${tier.label}) - Anno dichiarazione ${declarationYear} redditi ${incomeYear}`;

    if (payDateOverride) setRavvedimentoDate(payDateOverride);

    const newRow: F24Row = {
      id: crypto.randomUUID(),
      kind: 'SANZIONE',
      taxCode: '896E', // Sanzione pecuniaria sostituti d'imposta (F24EP)
      description: description,
      originalAmount: tier.total,
      referenceMonth: '',
      referenceYear: declarationYear.toString(),
      section: 'ERARIO',
      locationCode: ''
    };

    setRows(prev => [...prev, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const openInterestModal = (row: F24Row, result: CalculationResult) => {
    setSelectedInterestDetails({
      code: row.taxCode,
      amount: row.originalAmount,
      details: result.interestDetails,
      warning: result.interestWarning
    });
  };

  const closeInterestModal = () => {
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
            
            {/* Conditional Input for Region/Municipality Code */}
            {selectedTaxInfo?.requiresLocationCode ? (
              <div className="md:col-span-2 relative" ref={regionTooltipRef}>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 truncate" title={selectedTaxInfo.locationCodeLabel}>
                    {selectedTaxInfo.locationCodeLabel}
                  </label>
                  {isRegionCodeField && (
                    <button
                      type="button"
                      onClick={() => setShowRegionTooltip(!showRegionTooltip)}
                      className="text-italia-blue dark:text-blue-400 hover:text-blue-600 focus:outline-none"
                      title="Elenco Codici Regioni"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <input 
                  type="text"
                  value={locationCode}
                  onChange={(e) => setLocationCode(e.target.value)}
                  maxLength={selectedTaxInfo.locationCodeMaxLength}
                  className="w-full rounded border-2 border-orange-300 dark:border-orange-500 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors uppercase"
                  placeholder={selectedTaxInfo.locationCodeMaxLength === 2 ? "es. 09" : "es. H501"}
                />

                {/* Region Codes Tooltip */}
                {showRegionTooltip && isRegionCodeField && (
                  <div className="absolute z-20 left-0 mt-1 w-64 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-xl text-xs max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-x-2 gap-y-1 p-1">
                      {REGION_CODES.map((region) => (
                        <React.Fragment key={region.code}>
                          <button 
                             onClick={() => { setLocationCode(region.code); setShowRegionTooltip(false); }}
                             className="col-span-1 font-mono font-bold text-italia-blue dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-center"
                          >
                            {region.code}
                          </button>
                          <div className="col-span-3 text-gray-700 dark:text-gray-200 truncate" title={region.name}>{region.name}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Spacer to keep layout consistent if no code needed
              <div className="md:col-span-2"></div> 
            )}

            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mese</label>
              <select 
                value={tributiRefMonth}
                onChange={(e) => setTributiRefMonth(e.target.value)}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              >
                {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Anno</label>
              <input 
                type="number"
                value={tributiRefYear}
                onChange={(e) => setTributiRefYear(e.target.value)}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Importo (€)</label>
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

        {/* Late Submission Sanctions Card */}
        <section className="bg-white dark:bg-gray-800 rounded shadow-md border-t-4 border-italia-blue p-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-italia-dark dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
            3. Sanzioni Tardivo Invio (Modelli Obbligatori)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Modello</label>
              <select 
                value={lateModelType}
                onChange={(e) => setLateModelType(e.target.value as 'CU' | '770')}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              >
                <option value="CU">Certificazione Unica (CU)</option>
                <option value="770">Modello 770</option>
              </select>
            </div>

            {lateModelType === 'CU' ? (
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Numero Certificazioni</label>
                <input 
                  type="number"
                  min="1"
                  value={cuCount}
                  onChange={(e) => setCuCount(e.target.value)}
                  className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
                />
              </div>
            ) : (
              <div className="md:col-span-3">
                {/* Spacer or info for 770 */}
                <div className="text-sm text-gray-500 dark:text-gray-400 pb-2">
                  La sanzione per il 770 è fissa per dichiarazione.
                </div>
              </div>
            )}

            <div className="md:col-span-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Anno Rif. <span className="font-normal text-xs text-gray-500">(Es. Modello 2026 per redditi 2025)</span>
              </label>
              <input 
                type="number"
                value={sanctionRefYear}
                onChange={(e) => setSanctionRefYear(e.target.value)}
                className="w-full rounded border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-italia-blue focus:ring-0 sm:text-base p-2.5 transition-colors"
              />
            </div>

            <div className="md:col-span-1">
              <button 
                onClick={() => handleAddLateSanction()}
                className="w-full bg-italia-blue text-white py-3 px-4 rounded font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-md transition-all transform hover:scale-105 flex justify-center items-center"
                title="Aggiungi Sanzione"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
            <strong>Info Calcolo:</strong> Scaglione determinato dalla Data Ravvedimento del riquadro 1.
            {lateModelType === 'CU'
              ? ' CU: € 100 per certificazione (max € 50.000); se trasmessa entro 60 gg ridotta a 1/3 (max € 20.000). Si assume trasmissione della CU alla data di pagamento.'
              : ' Mod. 770: entro 90 gg € 25,00 (1/10 di € 250). Oltre 90 gg dichiarazione omessa.'}
          </div>

          {lateTiers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base font-bold text-italia-dark dark:text-white mb-2">Simulazione ravvedimento</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-900">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Scaglione</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Finestra</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Riduzione</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">{lateModelType === 'CU' ? '€ per CU' : '€'}</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Totale</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Costo attesa</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Stato</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {lateTiers.map((tier) => {
                      const timedTiers = lateTiers.filter(t => !t.informative);
                      const next = tier.informative ? undefined : timedTiers[timedTiers.indexOf(tier) + 1];
                      const expired = !tier.informative && tier.to !== null && tier.to < parseDate(today);
                      const waitCost = !expired && next && next.total !== null && tier.total !== null ? next.total - tier.total : null;
                      const isSelected = selectedLateTier?.id === tier.id;
                      const isToday = todayLateTier?.id === tier.id;
                      const useDate = tier.to
                        ? tier.to.toISOString().split('T')[0]
                        : (tier.from && tier.from > parseDate(today) ? tier.from.toISOString().split('T')[0] : today);
                      const canUse = !tier.informative && !expired && tier.total !== null;

                      let status = 'Futuro';
                      if (tier.informative) status = 'Informativo';
                      else if (expired) status = 'Scaduto';
                      else if (isToday) status = 'Oggi';

                      const rowClass = isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold'
                        : tier.informative || expired ? 'text-gray-400 dark:text-gray-500' : '';

                      return (
                        <tr key={tier.id} className={rowClass}>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                            {tier.label}
                            {isSelected && <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-italia-blue text-white">Data ravv.</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {tier.from
                              ? (tier.to ? `${formatDate(tier.from)} – ${formatDate(tier.to)}` : `dal ${formatDate(tier.from)}`)
                              : <span className="italic">{tier.note}</span>}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">{tier.reduction}</td>
                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap">{tier.perUnit !== null ? formatCurrency(tier.perUnit) : '—'}</td>
                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                            {tier.total !== null ? formatCurrency(tier.total) : <span className="italic font-sans">{tier.note}</span>}
                            {tier.capped && <span className="ml-1 text-[10px] font-bold text-orange-600" title="Tetto massimo applicato">MAX</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap text-red-700 dark:text-red-400">
                            {waitCost !== null && waitCost > 0 ? `+${formatCurrency(waitCost)}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">{status}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {canUse && (
                              <button
                                onClick={() => handleAddLateSanction(useDate)}
                                className="text-xs font-bold text-italia-blue dark:text-blue-300 hover:underline"
                                title={`Imposta Data Ravvedimento al ${formatDate(parseDate(useDate))} e aggiunge la sanzione`}
                              >
                                Usa
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                "Costo attesa": maggior importo dovuto se il ravvedimento slitta allo scaglione successivo. "Usa" imposta la Data Ravvedimento all'ultimo giorno utile dello scaglione (modifica anche il calcolo dei tributi) e aggiunge la sanzione.
              </p>
            </div>
          )}
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
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sezione/Ente</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-semibold text-xs uppercase">{row.section}</div>
                          {row.locationCode && <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded inline-block mt-1">{row.locationCode}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{row.referenceMonth ? `${row.referenceMonth}/${row.referenceYear}` : row.referenceYear}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{formatCurrency(row.originalAmount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">
                          <span className="block font-semibold">{result.daysLate} gg</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">{result.ravvedimentoType}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-700 dark:text-orange-400 font-bold text-right font-mono">
                          <div className="flex items-center justify-end gap-2">
                            <span>{formatCurrency(result.legalInterest)}</span>
                            {result.interestWarning && (
                              <span title={result.interestWarning} className="cursor-help">⚠️</span>
                            )}
                            <button
                              onClick={() => openInterestModal(row, result)}
                              className="text-italia-blue dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none focus:text-blue-800"
                              title="Visualizza dettaglio calcolo interessi"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          {result.legalInterest > 0 && result.legalInterest < MIN_INTEREST_THRESHOLD && (
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 mt-1">
                              &lt; Min
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 dark:text-red-400 font-bold text-right font-mono relative">
                          <span className="block">{formatCurrency(result.sanctionAmount)}</span>
                          <div className="flex items-center justify-end gap-1">
                            {/* Display percentage with up to 4 decimals to clarify calculations (e.g. 1.3889% vs 1.39%) */}
                            <span className="text-xs text-gray-500 dark:text-gray-500 font-normal">
                              ({new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(result.sanctionPercentage)}%)
                            </span>
                            {/* Sanction Formula Tooltip */}
                            <div className="relative inline-block group">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-italia-blue cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
                                  {result.sanctionFormula}
                                  <div className="absolute top-full right-1 w-2 h-2 bg-gray-800 transform rotate-45 -translate-y-1"></div>
                                </div>
                            </div>
                          </div>
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
      {selectedInterestDetails && (
        <InterestModal data={selectedInterestDetails} onClose={closeInterestModal} />
      )}

      <Footer />
    </>
  );
}

export default App;
