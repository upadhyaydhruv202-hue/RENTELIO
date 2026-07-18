import { Navigate, Outlet } from 'react-router-dom';
import UserNavbar from './UserNavbar';

export default function UserLayout({ customer, onLogout }) {
  if (!customer) {
    return <Navigate to="/shop/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-ink-900 dark:bg-ink-950 dark:text-ink-100">
      <UserNavbar customer={customer} onLogout={onLogout} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-ink-200 bg-white py-6 text-center text-xs text-ink-400 dark:border-ink-800 dark:bg-ink-900">
        Rentelio Store · Don&apos;t get Mental, Just do Rental
      </footer>
    </div>
  );
}
