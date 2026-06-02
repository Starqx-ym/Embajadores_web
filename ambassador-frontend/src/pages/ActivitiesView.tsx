import React from 'react';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';

export default function ActivitiesView() {
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (user && String(user.role).toLowerCase().includes('embajador')) {
    return <StudentDashboard />;
  }

  return <AdminDashboard />;
}
