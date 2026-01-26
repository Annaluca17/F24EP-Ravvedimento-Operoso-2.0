import { InterestRate, TaxCode } from './types';

// Historical Legal Interest Rates (Tasso Legale)
// Source: Italian Civil Code Art. 1284 updates
export const LEGAL_INTEREST_RATES: InterestRate[] = [
  { start: '2019-01-01', end: '2019-12-31', rate: 0.8 },
  { start: '2020-01-01', end: '2020-12-31', rate: 0.05 },
  { start: '2021-01-01', end: '2021-12-31', rate: 0.01 },
  { start: '2022-01-01', end: '2022-12-31', rate: 1.25 },
  { start: '2023-01-01', end: '2023-12-31', rate: 5.0 },
  { start: '2024-01-01', end: '2024-12-31', rate: 2.5 },
  { start: '2025-01-01', end: '2025-12-31', rate: 2.0 }, // Projected/Current
  { start: '2026-01-01', end: '2099-12-31', rate: 1.6 }, // Future projection from OCR
];

// Common F24EP Tax Codes
// Mapped to their respective Sanction Codes (Codes starting with 89xx usually)
export const TAX_CODES: TaxCode[] = [
  { code: '100E', description: 'IRPEF - Ritenute redditi lavoro dipendente', sanctionCode: '896E' },
  { code: '102E', description: 'IRPEF - Ritenute emolumenti arretrati', sanctionCode: '896E' },
  { code: '104E', description: 'IRPEF - Ritenute redditi lavoro autonomo', sanctionCode: '897E' },
  { code: '380E', description: 'IRAP - Versamento imposta', sanctionCode: '892E' },
  { code: '381E', description: 'Addizionale Regionale IRPEF', sanctionCode: '893E' },
  { code: '384E', description: 'Addizionale Comunale IRPEF (Saldo)', sanctionCode: '895E' },
  { code: '385E', description: 'Addizionale Comunale IRPEF (Acconto)', sanctionCode: '895E' },
  { code: '124E', description: 'Interessi Pagamento Dilazionato Add. Reg.', sanctionCode: '893E' }, // N/A usually, but keeping structure
  { code: '125E', description: 'Interessi Pagamento Dilazionato Add. Com.', sanctionCode: '895E' },
];

export const SANCTION_CODES_DESC: Record<string, string> = {
  '896E': 'Sanzione Ritenute Erariali (Dipendenti)',
  '897E': 'Sanzione Ritenute Lavoro Autonomo',
  '892E': 'Sanzione IRAP',
  '893E': 'Sanzione Addizionale Regionale',
  '895E': 'Sanzione Addizionale Comunale',
};
