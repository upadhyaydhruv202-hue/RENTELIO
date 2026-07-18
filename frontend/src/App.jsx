import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RoleRoute from './components/RoleRoute';
import SplashScreen from './components/SplashScreen';
import UserLayout from './components/UserLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Rentals from './pages/Rentals';
import Returns from './pages/Returns';
import Deposits from './pages/Deposits';
import UserLogin from './pages/User/UserLogin';
import UserRegister from './pages/User/UserRegister';
import UserDashboard from './pages/User/UserDashboard';
import ProductBrowse from './pages/User/ProductBrowse';
import ProductDetails from './pages/User/ProductDetails';
import Checkout from './pages/User/Checkout';
import MyRentals from './pages/User/MyRentals';
import RentalDetails from './pages/User/RentalDetails';
import UserProfile from './pages/User/UserProfile';
import UserPayments from './pages/User/UserPayments';

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rentelio_user')) || null;
    } catch {
      return null;
    }
  });
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rentelio_customer')) || null;
    } catch {
      return null;
    }
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('rentelio_theme') === 'dark');
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (localStorage.getItem('rentelio_user') || localStorage.getItem('rentelio_customer')) {
      return false;
    }
    return sessionStorage.getItem('rentelio_splash_done') !== '1';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('rentelio_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('rentelio_splash_done', '1');
    setShowSplash(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('rentelio_user', JSON.stringify(userData));
    localStorage.setItem('rentelio_token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rentelio_user');
    localStorage.removeItem('rentelio_token');
  };

  const handleCustomerLogin = (customerData, token) => {
    setCustomer(customerData);
    localStorage.setItem('rentelio_customer', JSON.stringify(customerData));
    localStorage.setItem('rentelio_customer_token', token);
  };

  const handleCustomerLogout = () => {
    setCustomer(null);
    localStorage.removeItem('rentelio_customer');
    localStorage.removeItem('rentelio_customer_token');
  };

  const handleCustomerUpdate = (updated) => {
    setCustomer(updated);
    localStorage.setItem('rentelio_customer', JSON.stringify(updated));
  };

  return (
    <BrowserRouter>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <Routes>
        {/* Admin / staff */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          element={
            <Layout
              user={user}
              darkMode={darkMode}
              onToggleTheme={() => setDarkMode((v) => !v)}
              onLogout={handleLogout}
            />
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products user={user} />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/returns" element={<Returns />} />
          <Route
            path="/deposits"
            element={
              <RoleRoute user={user} roles={['admin']}>
                <Deposits />
              </RoleRoute>
            }
          />
        </Route>

        {/* Customer storefront */}
        <Route
          path="/shop/login"
          element={
            customer ? (
              <Navigate to="/shop" replace />
            ) : (
              <UserLogin onLogin={handleCustomerLogin} />
            )
          }
        />
        <Route
          path="/shop/register"
          element={
            customer ? (
              <Navigate to="/shop" replace />
            ) : (
              <UserRegister onLogin={handleCustomerLogin} />
            )
          }
        />
        <Route
          element={<UserLayout customer={customer} onLogout={handleCustomerLogout} />}
        >
          <Route path="/shop" element={<UserDashboard customer={customer} />} />
          <Route path="/shop/browse" element={<ProductBrowse />} />
          <Route path="/shop/products/:id" element={<ProductDetails />} />
          <Route path="/shop/checkout" element={<Checkout />} />
          <Route path="/shop/rentals" element={<MyRentals />} />
          <Route path="/shop/rentals/:id" element={<RentalDetails />} />
          <Route path="/shop/payments" element={<UserPayments />} />
          <Route
            path="/shop/profile"
            element={<UserProfile customer={customer} onUpdate={handleCustomerUpdate} />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to={
                customer
                  ? '/shop'
                  : user
                    ? '/dashboard'
                    : '/shop/login'
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
