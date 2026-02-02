import React from 'react';

interface Props {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<Props> = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="shadow-sm z-10 transition-colors duration-200">
      {/* Slim Header - Context */}
      <div className="bg-italia-dark text-white py-1 px-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm font-semibold tracking-wide uppercase">
          <span>Servizi Finanziari - Enti Pubblici</span>
          <div className="flex items-center gap-4">
             <button className="hover:underline text-xs">Accesso PA</button>
             <button
              onClick={toggleDarkMode}
              className="text-white hover:text-gray-300 focus:outline-none"
              title={darkMode ? "Attiva modalità chiara" : "Attiva modalità scura"}
            >
              {darkMode ? (
                <span className="flex items-center gap-1 text-xs"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> Light</span>
              ) : (
                <span className="flex items-center gap-1 text-xs"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> Dark</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header - Brand */}
      <div className="bg-white dark:bg-gray-800 border-b-4 border-italia-blue py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Emblem placeholder */}
            <div className="hidden sm:block">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-italia-blue dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5z"/>
               </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-italia-dark dark:text-white leading-tight">
                Ravvedimento Operoso F24EP
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-300 font-normal">
                Strumento di calcolo per la regolarizzazione tributaria degli Enti Locali
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;