export interface InterestRate {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  rate: number;  // Percentage
}

export interface TaxCode {
  code: string;
  description: string;
  sanctionCode: string; // The associated sanction code (e.g., 100E -> 896E)
}

export interface F24Row {
  id: string;
  taxCode: string;
  description: string;
  originalAmount: number;
  referenceMonth: string; // MM
  referenceYear: string;  // YYYY
}

export interface CalculationResult {
  rowId: string;
  daysLate: number;
  legalInterest: number;
  sanctionAmount: number;
  sanctionPercentage: number;
  totalTaxWithInterest: number; // For F24EP Tax Code column
  totalSanction: number;        // For F24EP Sanction Code column
  ravvedimentoType: string;
}

export enum RavvedimentoType {
  SPRINT = "Sprint (fino a 14 gg)",
  BREVE = "Breve (15-30 gg)",
  INTERMEDIO = "Intermedio (31-90 gg)",
  LUNGO = "Lungo (entro 1 anno)",
  LUNGHISSIMO = "Lunghissimo (entro 2 anni)",
  OLTRE = "Oltre 2 anni"
}