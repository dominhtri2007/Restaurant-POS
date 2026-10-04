import React, { useState } from 'react';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import ErrorBoundary from './components/common/ErrorBoundary';
import { FeedbackProvider } from './context/FeedbackContext';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_admin_user');
      const token = localStorage.getItem('pos_admin_token');
      return (saved && token) ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('pos_admin_token');
    localStorage.removeItem('pos_admin_user');
    setCurrentUser(null);
  };

  let content;

  if (!currentUser) {
    content = <AdminLogin onLoginSuccess={(user) => setCurrentUser(user)} />;
  } else {
    content = <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <ErrorBoundary>
      <FeedbackProvider>
        {content}
      </FeedbackProvider>
    </ErrorBoundary>
  );
}
