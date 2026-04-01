import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { getStoredThemeMode } from './theme';

// Set initial theme before React mounts to prevent flash
const stored = getStoredThemeMode();
if (stored === 'dark' || (stored === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.setAttribute('data-theme', 'dark');
} else {
  document.documentElement.setAttribute('data-theme', 'light');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
