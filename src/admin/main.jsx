import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './App';
import './admin-theme.css';

console.log("Admin Panel initialized v2 - Theme updated");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
