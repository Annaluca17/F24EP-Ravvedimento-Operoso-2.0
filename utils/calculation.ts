
import { LEGAL_INTEREST_RATES, TAX_CODES } from '../constants';
import { CalculationResult, F24Row, RavvedimentoType, InterestPeriod } from '../types';

export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
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

export const calculateLegalInterest = (amount: number, dueDate: Date, payDate: Date): { total: number, details: InterestPeriod[] } => {
  let totalInterest = 0;
  const details: InterestPeriod[] = [];

  // Interest starts accruing from the day AFTER the due date
  const accrualStart = new Date(dueDate);
  accrualStart.setDate(accrualStart.getDate() + 1);
  
  const accrualEnd = new Date(payDate);

  // If paid on or before due date (plus 1 day adjustment logic), no interest
  if (accrualStart > accrualEnd) {
    return { total: 0, details: [] };
  }

  // Iterate through defined legal rates to find intersections with the accrual period
  const sortedRates = [...LEGAL_INTEREST_RATES].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  for (const rateObj of sortedRates) {
    const rateStart = new Date(rateObj.start);
    const rateEnd = new Date(rateObj.end);

    // Determine the overlap between [RateStart, RateEnd] and [AccrualStart, AccrualEnd]
    // Max of Starts
    const periodStart = rateStart > accrualStart ? rateStart : accrualStart;
    // Min of Ends
    const periodEnd = rateEnd < accrualEnd ? rateEnd : accrualEnd;

    // Check if there is a valid overlap
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

  return { total: roundAmount(totalInterest), details };
};

export const calculateSanction = (amount: number, daysLate: number, violationDate: Date, payDate: Date): { percentage: number, amount: number, type: string, formula: string } => {
  // Riforma Sanzioni (D.Lgs 87/2024) applies to violations committed AFTER 01/09/2024.
  const reformDate = new Date('2024-09-01');
  const isPostReform = violationDate >= reformDate;

  // Base Rates
  const baseRate = isPostReform ? 25.0 : 30.0;
  const minRate = isPostReform ? 12.5 : 15.0; // Reduced base for delays <= 90 days

  // Deadlines for "Lungo" and "Lunghissimo" (approximate declaration deadlines)
  const violationYear = violationDate.getFullYear();
  const declarationDeadlineLungo = new Date(violationYear + 1, 10, 30); // 30 Nov Year+1
  const declarationDeadlineLunghissimo = new Date(violationYear + 2, 10, 30); // 30 Nov Year+2

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

  } else if (payDate <= declarationDeadlineLungo) {
    // Ravvedimento Lungo: 1/8 of Base (Usually Base = Min)
    percentage = baseRate / 8;
    formula = `1/8 del Base (${baseRate}%)`;
    type = RavvedimentoType.LUNGO;

  } else if (payDate <= declarationDeadlineLunghissimo) {
    // Ravvedimento Lunghissimo: 1/7 of Base
    percentage = baseRate / 7;
    formula = `1/7 del Base (${baseRate}%)`;
    type = RavvedimentoType.LUNGHISSIMO;

  } else {
    // Oltre 2 anni: 1/6 of Base
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
    sanctionAmount: sanction.amount,
    sanctionPercentage: sanction.percentage,
    sanctionFormula: sanction.formula,
    // F24EP Specific: Tax Code Amount = Original + Interest (Principio del Cumulo)
    totalTaxWithInterest: totalTaxWithInterest,
    totalSanction: sanction.amount,
    ravvedimentoType: sanction.type
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
};

export const getSanctionCode = (taxCode: string): string => {
  const found = TAX_CODES.find(t => t.code === taxCode);
  return found ? found.sanctionCode : '89xx';
};
