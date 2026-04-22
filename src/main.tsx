import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { getStoredAppearance, resolveMode } from './theme';

const appearance = getStoredAppearance();
document.documentElement.setAttribute('data-skin', appearance.skin);
document.documentElement.setAttribute('data-theme', resolveMode(appearance));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
