import { describe, it, expect } from 'vitest';
import { calculateSanction, calculateLegalInterest, calculateRow, roundAmount, getDaysDiff, parseDate } from './calculation';
import { RavvedimentoType, F24Row } from '../types';

const d = (s: string) => parseDate(s);

describe('roundAmount', () => {
  it('arrotonda correttamente i casi limite del floating point', () => {
    expect(roundAmount(1.005)).toBe(1.01);
    expect(roundAmount(2.675)).toBe(2.68);
    expect(roundAmount(10)).toBe(10);
  });
});

describe('getDaysDiff', () => {
  it('calcola i giorni di ritardo', () => {
    expect(getDaysDiff(d('2025-06-30'), d('2025-07-30'))).toBe(30);
    expect(getDaysDiff(d('2025-06-30'), d('2025-06-30'))).toBe(0);
  });
});

describe('calculateSanction - regime PRE riforma (violazioni ante 01/09/2024)', () => {
  const violation = d('2024-06-30');

  it('sprint: 0,1% al giorno', () => {
    const r = calculateSanction(1000, 10, violation, d('2024-07-10'));
    expect(r.percentage).toBeCloseTo(1.0, 10);
    expect(r.type).toBe(RavvedimentoType.SPRINT);
  });

  it('breve (15-30 gg): 1/10 del 15% = 1,5%', () => {
    const r = calculateSanction(1000, 30, violation, d('2024-07-30'));
    expect(r.percentage).toBeCloseTo(1.5, 10);
    expect(r.amount).toBe(15);
    expect(r.type).toBe(RavvedimentoType.BREVE);
  });

  it('intermedio (31-90 gg): 1/9 del 15%', () => {
    const r = calculateSanction(1000, 90, violation, d('2024-09-28'));
    expect(r.percentage).toBeCloseTo(15 / 9, 10);
    expect(r.type).toBe(RavvedimentoType.INTERMEDIO);
  });

  it('lungo: 1/8 del 30% entro il termine 770 (31/10 anno succ.)', () => {
    const r = calculateSanction(1000, 200, violation, d('2025-10-31'));
    expect(r.percentage).toBeCloseTo(30 / 8, 10);
    expect(r.type).toBe(RavvedimentoType.LUNGO);
  });

  it('lunghissimo: 1/7 del 30% oltre il termine ma entro il 770 del secondo anno', () => {
    const r = calculateSanction(1000, 500, violation, d('2025-11-01'));
    expect(r.percentage).toBeCloseTo(30 / 7, 10);
    expect(r.type).toBe(RavvedimentoType.LUNGHISSIMO);
  });

  it('oltre: 1/6 del 30% dopo il termine del secondo anno', () => {
    const r = calculateSanction(1000, 900, violation, d('2026-11-01'));
    expect(r.percentage).toBeCloseTo(30 / 6, 10);
    expect(r.type).toBe(RavvedimentoType.OLTRE);
  });
});

describe('calculateSanction - regime POST riforma (D.Lgs 87/2024, dal 01/09/2024)', () => {
  const violation = d('2025-06-30');

  it('la violazione del 01/09/2024 ricade nel nuovo regime', () => {
    const r = calculateSanction(1000, 30, d('2024-09-01'), d('2024-10-01'));
    expect(r.percentage).toBeCloseTo(1.25, 10);
  });

  it('sprint: 1/15 di (12,5%/10) per giorno', () => {
    const r = calculateSanction(1000, 10, violation, d('2025-07-10'));
    expect(r.percentage).toBeCloseTo((12.5 / 10 / 15) * 10, 10);
    expect(r.type).toBe(RavvedimentoType.SPRINT);
  });

  it('breve: 1/10 del 12,5% = 1,25%', () => {
    const r = calculateSanction(1000, 20, violation, d('2025-07-20'));
    expect(r.percentage).toBeCloseTo(1.25, 10);
    expect(r.amount).toBe(12.5);
  });

  it('intermedio: 1/9 del 12,5%', () => {
    const r = calculateSanction(1000, 60, violation, d('2025-08-29'));
    expect(r.percentage).toBeCloseTo(12.5 / 9, 10);
  });

  it('lungo: 1/8 del 25% se pagato ENTRO il 31/10 dell\'anno successivo (incluso)', () => {
    const r = calculateSanction(1000, 400, violation, d('2026-10-31'));
    expect(r.percentage).toBeCloseTo(25 / 8, 10);
    expect(r.type).toBe(RavvedimentoType.LUNGO);
  });

  it('oltre il termine: 1/7 fisso, anche dopo due anni (scaglione 1/6 abolito)', () => {
    const oltre = calculateSanction(1000, 500, violation, d('2026-11-01'));
    expect(oltre.percentage).toBeCloseTo(25 / 7, 10);
    expect(oltre.type).toBe(RavvedimentoType.OLTRE_POST_RIFORMA);

    const moltoOltre = calculateSanction(1000, 1200, violation, d('2028-10-15'));
    expect(moltoOltre.percentage).toBeCloseTo(25 / 7, 10);
    expect(moltoOltre.type).toBe(RavvedimentoType.OLTRE_POST_RIFORMA);
  });
});

describe('calculateLegalInterest', () => {
  it('nessun interesse se pagato entro la scadenza', () => {
    const r = calculateLegalInterest(1000, d('2025-06-30'), d('2025-06-30'));
    expect(r.total).toBe(0);
    expect(r.details).toHaveLength(0);
  });

  it('calcola interessi su un singolo periodo di tasso (30 gg al 2% nel 2025)', () => {
    const r = calculateLegalInterest(1000, d('2025-06-30'), d('2025-07-30'));
    // 1000 * 2 * 30 / 36500 = 1.6438... -> 1.64
    expect(r.total).toBe(1.64);
    expect(r.details).toHaveLength(1);
    expect(r.details[0].days).toBe(30);
    expect(r.details[0].rate).toBe(2.0);
  });

  it('spezza il calcolo a cavallo di due anni con tassi diversi (2024: 2,5% / 2025: 2%)', () => {
    const r = calculateLegalInterest(10000, d('2024-12-16'), d('2025-01-15'));
    expect(r.details).toHaveLength(2);
    expect(r.details[0].days).toBe(15); // 17/12 - 31/12 al 2,5%
    expect(r.details[1].days).toBe(15); // 01/01 - 15/01 al 2%
    const expected = (10000 * 2.5 * 15) / 36500 + (10000 * 2.0 * 15) / 36500;
    expect(r.total).toBe(roundAmount(expected));
  });

  it('segnala i periodi non coperti dalla tabella tassi', () => {
    const r = calculateLegalInterest(1000, d('2008-06-30'), d('2010-06-30'));
    expect(r.warning).toBeDefined();
    // Il calcolo copre comunque la parte dal 2010
    expect(r.details[0].startDate).toBe('2010-01-01');
  });
});

describe('calculateRow', () => {
  const baseRow: F24Row = {
    id: '1',
    kind: 'TRIBUTO',
    taxCode: '100E',
    description: 'test',
    originalAmount: 1000,
    referenceMonth: '01',
    referenceYear: '2025',
    section: 'ERARIO',
  };

  it('riga TRIBUTO in ritardo: sanzione + interessi', () => {
    const r = calculateRow(baseRow, '2025-06-30', '2025-07-30');
    expect(r.daysLate).toBe(30);
    expect(r.legalInterest).toBe(1.64);
    expect(r.totalSanction).toBe(12.5);
    expect(r.totalTaxWithInterest).toBe(1001.64);
  });

  it('riga SANZIONE: importo fisso, nessun ricalcolo', () => {
    const r = calculateRow({ ...baseRow, kind: 'SANZIONE', taxCode: '896E', originalAmount: 25 }, '2025-06-30', '2025-12-30');
    expect(r.totalTaxWithInterest).toBe(25);
    expect(r.totalSanction).toBe(0);
    expect(r.legalInterest).toBe(0);
  });

  it('pagamento in tempo: nessuna sanzione', () => {
    const r = calculateRow(baseRow, '2025-06-30', '2025-06-30');
    expect(r.totalSanction).toBe(0);
    expect(r.ravvedimentoType).toBe('In tempo');
  });
});
