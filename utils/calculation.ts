import { LEGAL_INTEREST_RATES, TAX_CODES, DECLARATION_DEADLINE, SANCTION_REFORM_DATE, CU_SANCTION, MOD770_LATE_SANCTION } from '../constants';
import { CalculationResult, F24Row, RavvedimentoType, InterestPeriod, LateModel, LateSanctionTier } from '../types';

// Le stringhe 'YYYY-MM-DD' vengono parsate come mezzanotte UTC: tutte le date
// di confronto devono quindi essere costruite in UTC (utcDate) per evitare
// off-by-one ai confini (es. pagamento esattamente il giorno di scadenza).
export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

export const utcDate = (year: number, month: number, day: number): Date => {
  return new Date(Date.UTC(year, month, day));
};

export const getDaysDiff = (start: Date, end: Date): number => {
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper for F24 standard rounding (2 decimals) using Exponential notation
// to avoid floating point math errors (e.g. 1.005 rounding incorrectly)
export const roundAmount = (value: number): number => {
  return Number(Math.round(Number(value + "e2")) + "e-2");
};

export const calculateLegalInterest = (amount: number, dueDate: Date, payDate: Date): { total: number, details: InterestPeriod[], warning?: string } => {
  let totalInterest = 0;
  const details: InterestPeriod[] = [];
  let warning: string | undefined;

  // Interest starts accruing from the day AFTER the due date
  const accrualStart = new Date(dueDate);
  accrualStart.setUTCDate(accrualStart.getUTCDate() + 1);

  const accrualEnd = new Date(payDate);

  // If paid on or before due date, no interest
  if (accrualStart > accrualEnd) {
    return { total: 0, details: [] };
  }

  // Iterate through defined legal rates to find intersections with the accrual period
  const sortedRates = [...LEGAL_INTEREST_RATES].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Se il periodo di maturazione inizia prima della tabella tassi, la parte
  // scoperta non viene conteggiata: va segnalato, non ignorato in silenzio.
  const firstRateStart = new Date(sortedRates[0].start);
  if (accrualStart < firstRateStart) {
    warning = `Attenzione: il periodo dal ${accrualStart.toISOString().split('T')[0]} al ${sortedRates[0].start} non è coperto dalla tabella dei tassi legali; gli interessi di tale intervallo NON sono conteggiati.`;
  }

  for (const rateObj of sortedRates) {
    const rateStart = new Date(rateObj.start);
    const rateEnd = new Date(rateObj.end);

    // Overlap between [RateStart, RateEnd] and [AccrualStart, AccrualEnd]
    const periodStart = rateStart > accrualStart ? rateStart : accrualStart;
    const periodEnd = rateEnd < accrualEnd ? rateEnd : accrualEnd;

    if (periodStart <= periodEnd) {
      // Calculate days in this period (Inclusive)
      const timeDiff = periodEnd.getTime() - periodStart.getTime();
      const days = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

      if (days > 0) {
        // Interest Formula: Amount * Rate * Days / 36500
        // We do NOT round per period, only the total, to preserve precision
        const periodInterest = (amount * rateObj.rate * days) / 36500;

        totalInterest += periodInterest;

        details.push({
          startDate: periodStart.toISOString().split('T')[0],
          endDate: periodEnd.toISOString().split('T')[0],
          rate: rateObj.rate,
          days: days,
          amount: periodInterest // Keep high precision for details display, display will format it
        });
      }
    }
  }

  return { total: roundAmount(totalInterest), details, warning };
};

export const calculateSanction = (amount: number, daysLate: number, violationDate: Date, payDate: Date): { percentage: number, amount: number, type: string, formula: string } => {
  // Riforma Sanzioni (D.Lgs 87/2024): violazioni commesse dal 01/09/2024.
  const reformDate = parseDate(SANCTION_REFORM_DATE);
  const isPostReform = violationDate >= reformDate;

  // Base Rates
  const baseRate = isPostReform ? 25.0 : 30.0;
  const minRate = isPostReform ? 12.5 : 15.0; // Reduced base for delays <= 90 days

  // Termine di presentazione della dichiarazione (Mod. 770, 31/10) relativa
  // all'anno in cui è stata commessa la violazione, e dell'anno successivo.
  const violationYear = violationDate.getUTCFullYear();
  const declarationDeadline = utcDate(violationYear + 1, DECLARATION_DEADLINE.month, DECLARATION_DEADLINE.day);
  const declarationDeadlineNextYear = utcDate(violationYear + 2, DECLARATION_DEADLINE.month, DECLARATION_DEADLINE.day);

  let percentage = 0;
  let type = '';
  let formula = '';

  // Note on precision: We calculate percentage as exact fraction first
  if (daysLate <= 14) {
    if (isPostReform) {
        // Post Reform Sprint: 1/15 of Breve (Breve is 1/10 of Min 12.5%)
        // Formula: (12.5% / 10) / 15 * days
        const dailyRate = (minRate / 10) / 15;
        percentage = dailyRate * daysLate;
        formula = `1/15 di Ravv. Breve (1/10 di ${minRate}%) per giorno`;
    } else {
        // Pre Reform Sprint: 0.1% fixed per day
        percentage = 0.1 * daysLate;
        formula = `0,1% per ogni giorno di ritardo`;
    }
    type = RavvedimentoType.SPRINT;

  } else if (daysLate <= 30) {
    // Ravvedimento Breve: 1/10 of Minimum
    percentage = minRate / 10;
    formula = `1/10 del Minimo (${minRate}%)`;
    type = RavvedimentoType.BREVE;

  } else if (daysLate <= 90) {
    // Ravvedimento Intermedio: 1/9 of Minimum
    percentage = minRate / 9;
    formula = `1/9 del Minimo (${minRate}%)`;
    type = RavvedimentoType.INTERMEDIO;

  } else if (payDate <= declarationDeadline) {
    // Ravvedimento Lungo: 1/8 entro il termine della dichiarazione
    // relativa all'anno della violazione
    percentage = baseRate / 8;
    formula = `1/8 del Base (${baseRate}%)`;
    type = RavvedimentoType.LUNGO;

  } else if (isPostReform) {
    // Post riforma: oltre il termine della dichiarazione la riduzione è 1/7
    // fisso (lo scaglione 1/6 è stato abolito dal D.Lgs 87/2024)
    percentage = baseRate / 7;
    formula = `1/7 del Base (${baseRate}%)`;
    type = RavvedimentoType.OLTRE_POST_RIFORMA;

  } else if (payDate <= declarationDeadlineNextYear) {
    // Pre riforma - Ravvedimento Lunghissimo: 1/7 entro il termine della
    // dichiarazione dell'anno successivo
    percentage = baseRate / 7;
    formula = `1/7 del Base (${baseRate}%)`;
    type = RavvedimentoType.LUNGHISSIMO;

  } else {
    // Pre riforma - Oltre: 1/6 of Base
    percentage = baseRate / 6;
    formula = `1/6 del Base (${baseRate}%)`;
    type = RavvedimentoType.OLTRE;
  }

  // Calculate amount using high precision, then round at the very end
  const sanctionAmount = (amount * percentage) / 100;

  return {
    percentage: percentage,
    amount: roundAmount(sanctionAmount),
    type: type,
    formula: formula
  };
};

export const calculateRow = (row: F24Row, dueDateStr: string, payDateStr: string): CalculationResult => {
  const dueDate = parseDate(dueDateStr);
  const payDate = parseDate(payDateStr);

  const daysLate = getDaysDiff(dueDate, payDate);

  if (row.kind === 'SANZIONE') {
    return {
      rowId: row.id,
      daysLate: 0,
      legalInterest: 0,
      interestDetails: [],
      sanctionAmount: 0,
      sanctionPercentage: 0,
      sanctionFormula: 'Sanzione fissa (nessun ravvedimento)',
      totalTaxWithInterest: row.originalAmount,
      totalSanction: 0,
      ravvedimentoType: 'N/A'
    };
  }

  if (daysLate <= 0) {
    return {
      rowId: row.id,
      daysLate: 0,
      legalInterest: 0,
      interestDetails: [],
      sanctionAmount: 0,
      sanctionPercentage: 0,
      sanctionFormula: 'Nessuna sanzione',
      totalTaxWithInterest: row.originalAmount,
      totalSanction: 0,
      ravvedimentoType: 'In tempo'
    };
  }

  const interestData = calculateLegalInterest(row.originalAmount, dueDate, payDate);
  const sanction = calculateSanction(row.originalAmount, daysLate, dueDate, payDate);

  // Total Tax is also rounded to 2 decimals
  const totalTaxWithInterest = roundAmount(row.originalAmount + interestData.total);

  return {
    rowId: row.id,
    daysLate: daysLate,
    legalInterest: interestData.total,
    interestDetails: interestData.details,
    interestWarning: interestData.warning,
    sanctionAmount: sanction.amount,
    sanctionPercentage: sanction.percentage,
    sanctionFormula: sanction.formula,
    // F24EP Specific: Tax Code Amount = Original + Interest (Principio del Cumulo)
    totalTaxWithInterest: totalTaxWithInterest,
    totalSanction: sanction.amount,
    ravvedimentoType: sanction.type
  };
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

// Scaglioni di ravvedimento per la sanzione da tardivo invio CU / 770.
// Le finestre temporali partono dal giorno successivo alla scadenza; gli
// scaglioni legati a un evento (schema d'atto, constatazione) sono solo
// informativi e non selezionabili per data.
// Ipotesi: data di trasmissione della CU coincidente con la data di pagamento.
export const getLateSanctionTiers = (model: LateModel, count: number, dueDate: Date): LateSanctionTier[] => {
  const tiers: LateSanctionTier[] = [];

  if (model === '770') {
    const perUnit = roundAmount(MOD770_LATE_SANCTION / 10);
    tiers.push({
      id: '770-90', label: 'Entro 90 gg', reduction: '1/10',
      from: addDays(dueDate, 1), to: addDays(dueDate, 90),
      perUnit, total: perUnit, capped: false, informative: false,
    });
    tiers.push({
      id: '770-oltre', label: 'Oltre 90 gg', reduction: '—',
      from: addDays(dueDate, 91), to: null,
      perUnit: null, total: null, capped: false, informative: false,
      note: 'Dichiarazione omessa: ravvedimento non ammesso',
    });
    return tiers;
  }

  const isPostReform = dueDate >= parseDate(SANCTION_REFORM_DATE);
  const base = CU_SANCTION.perCert * count;
  const cappedBase = Math.min(base, CU_SANCTION.max);
  const reducedBase = Math.min(base / 3, CU_SANCTION.reducedMax);

  // Termine 770 relativo all'anno della violazione (e dell'anno successivo, pre riforma)
  const violationYear = dueDate.getUTCFullYear();
  const decl1 = utcDate(violationYear + 1, DECLARATION_DEADLINE.month, DECLARATION_DEADLINE.day);
  const decl2 = utcDate(violationYear + 2, DECLARATION_DEADLINE.month, DECLARATION_DEADLINE.day);

  const timed = (id: string, label: string, reduction: string, divisor: number, from: Date, to: Date | null, reduced = false) => {
    if (to && from > to) return; // finestra vuota (es. scadenza a ridosso del termine 770)
    const b = reduced ? reducedBase : cappedBase;
    const nominal = reduced ? base / 3 : base;
    tiers.push({
      id, label, reduction, from, to,
      perUnit: roundAmount(CU_SANCTION.perCert / (reduced ? 3 : 1) / divisor),
      total: roundAmount(b / divisor),
      capped: b < nominal,
      informative: false,
    });
  };

  timed('cu-60', 'Entro 60 gg', '1/3 × 1/9', 9, addDays(dueDate, 1), addDays(dueDate, 60), true);
  timed('cu-90', 'Entro 90 gg', '1/9', 9, addDays(dueDate, 61), addDays(dueDate, 90));
  timed('cu-770', `Entro termine 770/${violationYear + 1}`, '1/8', 8, addDays(dueDate, 91), decl1);
  if (isPostReform) {
    timed('cu-oltre', `Oltre termine 770/${violationYear + 1}`, '1/7', 7, addDays(decl1, 1), null);
  } else {
    timed('cu-770-succ', `Entro termine 770/${violationYear + 2}`, '1/7', 7, addDays(decl1, 1), decl2);
    timed('cu-oltre', `Oltre termine 770/${violationYear + 2}`, '1/6', 6, addDays(decl2, 1), null);
  }

  const informative = (id: string, label: string, reduction: string, divisor: number) => {
    tiers.push({
      id, label, reduction, from: null, to: null,
      perUnit: roundAmount(CU_SANCTION.perCert / divisor),
      total: roundAmount(cappedBase / divisor),
      capped: cappedBase < base,
      informative: true,
      note: 'Dipende da un evento, non da una data',
    });
  };
  if (isPostReform) informative('cu-schema', "Dopo comunicazione schema d'atto", '1/6', 6);
  informative('cu-pvc', 'Dopo constatazione della violazione', '1/5', 5);

  return tiers;
};

export const findLateSanctionTier = (tiers: LateSanctionTier[], payDate: Date): LateSanctionTier | undefined =>
  tiers.find(t => !t.informative && t.from && t.from <= payDate && (!t.to || payDate <= t.to));

export const formatDate = (date: Date): string => {
  const [y, m, d] = date.toISOString().split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
};

export const getSanctionCode = (taxCode: string): string => {
  const found = TAX_CODES.find(t => t.code === taxCode);
  return found ? found.sanctionCode : '89xx';
};
