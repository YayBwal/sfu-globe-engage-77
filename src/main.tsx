
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx'
import './index.css'

// Apply the saved theme immediately before React renders
// to prevent flash of incorrect theme
const savedTheme = localStorage.getItem('theme');
if (
  savedTheme === 'dark' || 
  (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
  (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById("root")!).render(
  <Router>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);
