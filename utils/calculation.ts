import { LEGAL_INTEREST_RATES, TAX_CODES } from '../constants';
import { CalculationResult, F24Row, RavvedimentoType } from '../types';

export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

export const getDaysDiff = (start: Date, end: Date): number => {
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateLegalInterest = (amount: number, dueDate: Date, payDate: Date): number => {
  let totalInterest = 0;
  let currentDate = new Date(dueDate);
  // Start from the day AFTER the due date
  currentDate.setDate(currentDate.getDate() + 1);

  while (currentDate <= payDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Find rate for this specific day
    // Assumes constants are sorted or cover the range. Fallback 2.5 is just a safety.
    const rateObj = LEGAL_INTEREST_RATES.find(r => dateStr >= r.start && dateStr <= r.end);
    const rate = rateObj ? rateObj.rate : 2.5; 

    // Daily Interest = Amount * Rate% / 365
    // Note: Standard financial year 365 is used for simplification unless strict 366 required.
    totalInterest += (amount * rate) / 36500;

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalInterest;
};

export const calculateSanction = (amount: number, daysLate: number, violationDate: Date): { percentage: number, amount: number, type: string } => {
  // Logic updated based on "Riforma Sanzioni" (D.Lgs 87/2024) effective 01/09/2024.
  // Base Sanction for omitted payment: 25% (was 30%).
  // Reduced Base for delays <= 90 days: 12.5% (was 15%).

  let percentage = 0;
  let type = '';

  if (daysLate <= 14) {
    // Ravvedimento Sprint
    // Reduced to 1/15 per day of the "Breve" amount (1/10 of Min).
    // Min (<90 days) = 12.5%.
    // Breve = 1.25%.
    // Sprint Daily = 1.25% / 15 = 0.0833...%
    percentage = (1.25 / 15) * daysLate;
    type = RavvedimentoType.SPRINT;
  } else if (daysLate <= 30) {
    // Ravvedimento Breve (Art. 13 c. 1 lett. a)
    // 1/10 of Minimum (12.5%)
    percentage = 1.25;
    type = RavvedimentoType.BREVE;
  } else if (daysLate <= 90) {
    // Ravvedimento Intermedio (Art. 13 c. 1 lett. a-bis)
    // 1/9 of Minimum (12.5%) -> ~1.39%
    percentage = 12.5 / 9;
    type = RavvedimentoType.INTERMEDIO;
  } else if (daysLate <= 365) {
    // Ravvedimento Lungo (Art. 13 c. 1 lett. b)
    // 1/8 of Minimum.
    // Note: For delays > 90 days, the special 12.5% base no longer applies. Base reverts to 25%.
    percentage = 25 / 8; // 3.125%
    type = RavvedimentoType.LUNGO;
  } else if (daysLate <= 730) {
    // Ravvedimento Lunghissimo (Art. 13 c. 1 lett. b-bis)
    // 1/7 of Minimum (25%)
    percentage = 25 / 7; // ~3.57%
    type = RavvedimentoType.LUNGHISSIMO;
  } else {
    // Oltre 2 anni (Art. 13 c. 1 lett. b-ter)
    // 1/6 of Minimum (25%)
    percentage = 25 / 6; // ~4.17%
    type = RavvedimentoType.OLTRE;
  }

  return {
    percentage: percentage,
    amount: (amount * percentage) / 100,
    type: type
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
      sanctionAmount: 0,
      sanctionPercentage: 0,
      totalTaxWithInterest: row.originalAmount,
      totalSanction: 0,
      ravvedimentoType: 'In tempo'
    };
  }

  const interest = calculateLegalInterest(row.originalAmount, dueDate, payDate);
  const sanction = calculateSanction(row.originalAmount, daysLate, dueDate);

  return {
    rowId: row.id,
    daysLate: daysLate,
    legalInterest: interest,
    sanctionAmount: sanction.amount,
    sanctionPercentage: sanction.percentage,
    // F24EP Specific: Tax Code Amount = Original + Interest (Principio del Cumulo)
    totalTaxWithInterest: row.originalAmount + interest,
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
