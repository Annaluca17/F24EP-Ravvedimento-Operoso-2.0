import React from 'react';
import { InterestPeriod } from '../types';
import { formatCurrency } from '../utils/calculation';

export interface InterestModalData {
  code: string;
  amount: number;
  details: InterestPeriod[];
  warning?: string;
}

interface Props {
  data: InterestModalData;
  onClose: () => void;
}

const InterestModal: React.FC<Props> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] border-t-4 border-italia-blue">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-lg">
          <div>
            <h3 className="text-lg font-bold text-italia-dark dark:text-white">Dettaglio Calcolo Interessi Legali</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Codice Tributo: <span className="font-mono font-bold">{data.code}</span> - Capitale: {formatCurrency(data.amount)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Gli interessi legali sono calcolati pro-rata temporis in base al tasso legale vigente per ciascun periodo di ritardo.
          </p>
          {data.warning && (
            <div className="mb-4 p-3 rounded border border-orange-300 bg-orange-50 dark:bg-orange-900/30 dark:border-orange-700 text-sm text-orange-800 dark:text-orange-200">
              {data.warning}
            </div>
          )}
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
                {data.details.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">Nessun interesse maturato.</td>
                  </tr>
                ) : (
                  data.details.map((detail, idx) => (
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
                    {formatCurrency(data.details.reduce((sum, d) => sum + d.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="bg-italia-blue text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterestModal;
