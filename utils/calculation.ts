
import { LEGAL_INTEREST_RATES, TAX_CODES } from '../constants';
import { CalculationResult, F24Row, RavvedimentoType, InterestPeriod } from '../types';

export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

export const getDaysDiff = (start: Date, end: Date): number => {
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
  // We perform a copy of the rates array to sort it just in case, though constants are usually sorted.
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
        // We use 36500 as the divisor (365 * 100) standard convention
        const periodInterest = (amount * rateObj.rate * days) / 36500;
        
        totalInterest += periodInterest;
        
        details.push({
          startDate: periodStart.toISOString().split('T')[0],
          endDate: periodEnd.toISOString().split('T')[0],
          rate: rateObj.rate,
          days: days,
          amount: periodInterest
        });
      }
    }
  }

  // Handle fallback if periods are missing in constants (though unlikely with proper config)
  // If we processed ranges but total days < expected, we might need a fallback, 
  // but for this implementation, we assume constants cover the range.

  return { total: totalInterest, details };
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
      interestDetails: [],
      sanctionAmount: 0,
      sanctionPercentage: 0,
      totalTaxWithInterest: row.originalAmount,
      totalSanction: 0,
      ravvedimentoType: 'In tempo'
    };
  }

  const interestData = calculateLegalInterest(row.originalAmount, dueDate, payDate);
  const sanction = calculateSanction(row.originalAmount, daysLate, dueDate);

  return {
    rowId: row.id,
    daysLate: daysLate,
    legalInterest: interestData.total,
    interestDetails: interestData.details,
    sanctionAmount: sanction.amount,
    sanctionPercentage: sanction.percentage,
    // F24EP Specific: Tax Code Amount = Original + Interest (Principio del Cumulo)
    totalTaxWithInterest: row.originalAmount + interestData.total,
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
