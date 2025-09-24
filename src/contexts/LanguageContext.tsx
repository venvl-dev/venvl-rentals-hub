import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

type Language = 'en' | 'es' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    'header.signIn': 'Sign in',
    'header.signUp': 'Sign up',
    'header.hostProperty': 'Host your property',
    'header.hostDashboard': 'Host Dashboard',
    'header.profile': 'Profile',
    'header.myBookings': 'My Bookings',
    'header.myProperties': 'My Properties',
    'header.signOut': 'Sign out',
    'header.adminPanel': 'Admin Panel',

    // Admin Panel
    'admin.title': 'Admin Panel',
    'admin.users': 'Users',
    'admin.properties': 'Properties',
    'admin.bookings': 'Bookings',
    'admin.analytics': 'Analytics',
    'admin.settings': 'Settings',
    'admin.userManagement': 'User Management',
    'admin.propertyManagement': 'Property Management',
    'admin.bookingManagement': 'Booking Management',
    'admin.totalUsers': 'Total Users',
    'admin.totalProperties': 'Total Properties',
    'admin.totalBookings': 'Total Bookings',
    'admin.revenue': 'Revenue',
    'admin.role': 'Role',
    'admin.status': 'Status',
    'admin.actions': 'Actions',
    'admin.approve': 'Approve',
    'admin.reject': 'Reject',
    'admin.edit': 'Edit',
    'admin.delete': 'Delete',
    'admin.viewDetails': 'View Details',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.close': 'Close',
  },
  es: {
    // Header
    'header.signIn': 'Iniciar sesión',
    'header.signUp': 'Registrarse',
    'header.hostProperty': 'Alojar tu propiedad',
    'header.hostDashboard': 'Panel de Anfitrión',
    'header.profile': 'Perfil',
    'header.myBookings': 'Mis Reservas',
    'header.myProperties': 'Mis Propiedades',
    'header.signOut': 'Cerrar sesión',
    'header.adminPanel': 'Panel de Administrador',

    // Admin Panel
    'admin.title': 'Panel de Administrador',
    'admin.users': 'Usuarios',
    'admin.properties': 'Propiedades',
    'admin.bookings': 'Reservas',
    'admin.analytics': 'Análisis',
    'admin.settings': 'Configuración',
    'admin.userManagement': 'Gestión de Usuarios',
    'admin.propertyManagement': 'Gestión de Propiedades',
    'admin.bookingManagement': 'Gestión de Reservas',
    'admin.totalUsers': 'Total de Usuarios',
    'admin.totalProperties': 'Total de Propiedades',
    'admin.totalBookings': 'Total de Reservas',
    'admin.revenue': 'Ingresos',
    'admin.role': 'Rol',
    'admin.status': 'Estado',
    'admin.actions': 'Acciones',
    'admin.approve': 'Aprobar',
    'admin.reject': 'Rechazar',
    'admin.edit': 'Editar',
    'admin.delete': 'Eliminar',
    'admin.viewDetails': 'Ver Detalles',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.close': 'Cerrar',
  },
  fr: {
    // Header
    'header.signIn': 'Se connecter',
    'header.signUp': "S'inscrire",
    'header.hostProperty': 'Héberger votre propriété',
    'header.hostDashboard': "Tableau de bord de l'hôte",
    'header.profile': 'Profil',
    'header.myBookings': 'Mes Réservations',
    'header.myProperties': 'Mes Propriétés',
    'header.signOut': 'Se déconnecter',
    'header.adminPanel': "Panneau d'administration",

    // Admin Panel
    'admin.title': "Panneau d'administration",
    'admin.users': 'Utilisateurs',
    'admin.properties': 'Propriétés',
    'admin.bookings': 'Réservations',
    'admin.analytics': 'Analyses',
    'admin.settings': 'Paramètres',
    'admin.userManagement': 'Gestion des utilisateurs',
    'admin.propertyManagement': 'Gestion des propriétés',
    'admin.bookingManagement': 'Gestion des réservations',
    'admin.totalUsers': "Total d'utilisateurs",
    'admin.totalProperties': 'Total de propriétés',
    'admin.totalBookings': 'Total de réservations',
    'admin.revenue': 'Revenus',
    'admin.role': 'Rôle',
    'admin.status': 'Statut',
    'admin.actions': 'Actions',
    'admin.approve': 'Approuver',
    'admin.reject': 'Rejeter',
    'admin.edit': 'Modifier',
    'admin.delete': 'Supprimer',
    'admin.viewDetails': 'Voir les détails',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.close': 'Fermer',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
