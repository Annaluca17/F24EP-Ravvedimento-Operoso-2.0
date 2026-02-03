import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-italia-dark text-white mt-auto pt-10 pb-6 border-t-4 border-italia-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold uppercase mb-4 tracking-wider">L'Amministrazione</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white hover:underline">I Dati della PA</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Amministrazione Trasparente</a></li>
              <li><a href="https://immediaspa.com" className="hover:text-white hover:underline">Ufficio Relazioni con il Pubblico</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold uppercase mb-4 tracking-wider">Servizi Digitali</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white hover:underline">Pagamenti Informatici</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Dichiarazioni Fiscale</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Supporto Tecnico</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold uppercase mb-4 tracking-wider">Note Legali</h3>
            <p className="text-sm text-gray-300 mb-4">
              I risultati forniti da questo applicativo hanno valore indicativo e non sostituiscono le risultanze formali dell'Agenzia delle Entrate o degli organi di controllo.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white hover:underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Dichiarazione di Accessibilità</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2025 Amministrazione Pubblica - Tutti i diritti riservati</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span>Realizzato secondo le linee guida Designers Italia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;