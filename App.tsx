
import React, { useState, useEffect } from 'react';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import DashboardPage from './pages/DashboardPage';
import ReturnsPage from './pages/ReturnsPage';
import InventoryAuditPage from './pages/InventoryAuditPage';
import SalesArchivePage from './pages/SalesArchivePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import PublicCatalog from './pages/PublicCatalog';

export type PagePath = '/pos' | '/products' | '/customers' | '/suppliers' | '/reports' | '/returns' | '/catalog' | '/audit' | '/archive' | '/settings';

export interface PageProps {
  setPage: (path: PagePath) => void;
  onLogout: () => void;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PagePath>(() => {
    return window.location.hash === '#catalog' ? '/catalog' : '/pos';
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#catalog') setCurrentPage('/catalog');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    setCurrentPage('/pos');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  if (currentPage === '/catalog') {
    return <PublicCatalog onLoginRedirect={() => setCurrentPage('/pos')} />;
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    const props: PageProps = { setPage: setCurrentPage, onLogout: handleLogout };
    switch (currentPage) {
      case '/pos': return <POSPage {...props} />;
      case '/products': return <ProductsPage {...props} />;
      case '/customers': return <CustomersPage {...props} />;
      case '/suppliers': return <SuppliersPage {...props} />;
      case '/reports': return <DashboardPage {...props} />;
      case '/returns': return <ReturnsPage {...props} />;
      case '/audit': return <InventoryAuditPage {...props} />;
      case '/archive': return <SalesArchivePage {...props} />;
      case '/settings': return <SettingsPage {...props} />;
      default: return <POSPage {...props} />;
    }
  };

  return (
    <div id="app-container">
      {renderPage()}
    </div>
  );
};

export default App;
