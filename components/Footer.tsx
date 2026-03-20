
import React from 'react';

// Define the data arrays used in the component
const companyLinks = [
  { label: 'Chi Siamo', href: 'https://immediaspa.com/chi-siamo' },
  { label: 'Lavora con noi', href: 'https://immediaspa.com/lavora-con-noi' },
  { label: 'Certificazioni', href: 'https://immediaspa.com/certificazioni' },
  { label: 'Qualità e Ambiente', href: '#' }
];

const utilityLinks = [
  { label: 'Portale Assistenza', href: '#', external: true },
  { label: 'Download TeamViewer', href: '#', external: true },
  { label: 'Webmail', href: '#', external: true }
];

const socialIcons = [
  { label: 'LinkedIn', href: '#', icon: 'fab fa-linkedin-in', hoverColor: 'hover:bg-blue-700' },
  { label: 'Facebook', href: '#', icon: 'fab fa-facebook-f', hoverColor: 'hover:bg-blue-600' },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Colonna 1: Info Aziendali */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Immedia S.p.A.</h2>
              <p className="text-gray-400 mb-2">Soluzioni informatiche per la Pubblica Amministrazione</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>P.IVA e C.F.: 02154040808</p>
                <p>Reg. Imprese: 02154040808</p>
                <p>REA RC: 151045</p>
                <p>Cod. Univoco: M5UXCR1</p>
                <p>Capitale Sociale I.V.: € 2.800.000</p>
              </div>
              <div className="text-sm text-gray-400 space-y-1 mt-3">
                <h2 className="text-2xl text-white font-bold mt-4">Certificazioni</h2>
                <p>ISO 9001:2015</p>
                <p>ISO 14001:2015</p>
                <p>ISO 27001:2022</p>
                <p>ISO 27017:2015</p>
              </div>
            </div>
          </div>

          {/* Colonna 2: Contatti */}
          <div>
            <h3 className="text-xl font-bold mb-4 uppercase">Contatti</h3>
            <div className="space-y-3">
              <ContactItem icon="fas fa-phone" text="095 4035111" href="tel:+390954035111" />
              <ContactItem icon="fas fa-envelope" text="protocollo@immediaspa.com" href="mailto:protocollo@immediaspa.com" />
              <ContactItem icon="fas fa-certificate" text="mail@pec.immediaspa.com" href="mailto:mail@pec.immediaspa.com" />
              <div className="flex items-start">
                <i className="fas fa-map-marker-alt text-blue-400 mr-3 mt-1"></i>
                <div>
                  <p className="text-gray-400 text-sm">Sede Legale:</p>
                  <p className="text-gray-400">C.so Vittorio Emanuele III, 109</p>
                  <p className="text-gray-400">89127 Reggio Calabria (RC)</p>
                </div>
              </div>
              <div className="flex items-start">
                <i className="fas fa-building text-blue-400 mr-3 mt-1"></i>
                <div>
                  <p className="text-gray-400 text-sm">Sede Amministrativa:</p>
                  <p className="text-gray-400">Viale G. Lainò, 6</p>
                  <p className="text-gray-400">95126 Catania (CT)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonna 3: Azienda */}
          <div>
            <h3 className="text-xl font-bold mb-4 uppercase">Azienda</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonna 4: Link Utili & Social */}
          <div>
            <h3 className="text-xl font-bold mb-4 uppercase">Link Utili</h3>
            <ul className="space-y-2 mb-6">
              {utilityLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="text-xl font-bold mb-4 uppercase">Seguici</h3>
            <div className="flex space-x-3">
              {socialIcons.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`bg-gray-700 ${social.hoverColor} p-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors`}
                  aria-label={social.label}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-gray-700 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 mb-4 md:mb-0">
            <p>© {currentYear} Immedia S.p.A. - Tutti i diritti riservati.</p>
            <p className="text-xs mt-1">P.IVA 02154040808 • Made with ❤️ by num3r06</p>
            <p className="text-xs mt-1">V.1.0.1</p>
          </div>
          <ul className="flex flex-wrap space-x-4 text-sm">
            <li><a href="/informativa-privacy" className="text-gray-500 hover:text-white transition-colors">Privacy</a></li>
            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Cookie</a></li>
            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Note Legali</a></li>
            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Mappa Sito</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

/* Sotto-componente per gli elementi di contatto */
const ContactItem: React.FC<{ icon: string; text: string; href: string }> = ({ icon, text, href }) => (
  <div className="flex items-center">
    <i className={`${icon} text-blue-400 mr-3`}></i>
    <a href={href} className="text-gray-400 hover:text-white transition-colors">
      {text}
    </a>
  </div>
);

export default Footer;
