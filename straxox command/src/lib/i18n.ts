import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      sidebar: {
        home: "Home",
        dashboard: "Dashboard",
        intelligence: "Intelligence",
        deals: "Deals",
        projects: "Projects",
        invoices: "Invoices",
        clients: "Clients",
        proposals: "Proposals",
        team: "Team",
        auditVault: "Audit Vault",
        devTools: "Dev Tools",
        automations: "Automations",
        straxonLabs: "Straxon Labs"
      }
    }
  },
  es: {
    translation: {
      sidebar: {
        home: "Inicio",
        dashboard: "Tablero",
        intelligence: "Inteligencia",
        deals: "Tratos",
        projects: "Proyectos",
        invoices: "Facturas",
        clients: "Clientes",
        proposals: "Propuestas",
        team: "Equipo",
        auditVault: "Bóveda de Auditoría",
        devTools: "Herr. de Des.",
        automations: "Automatizaciones",
        straxonLabs: "Straxon Labs"
      }
    }
  },
  fr: {
    translation: {
      sidebar: {
        home: "Accueil",
        dashboard: "Tableau de Bord",
        intelligence: "Intelligence",
        deals: "Affaires",
        projects: "Projets",
        invoices: "Factures",
        clients: "Clients",
        proposals: "Propositions",
        team: "Équipe",
        auditVault: "Journal d'Audit",
        devTools: "Outils de Dév.",
        automations: "Automatisations",
        straxonLabs: "Straxon Labs"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
