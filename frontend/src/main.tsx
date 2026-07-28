// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import App from './App';
import './index.css';

// Auth0Provider needs to be inside the Router so it can use react-router's
// navigate() instead of a full page reload after the redirect completes.
function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: AppState) => {
    // Send the user back to wherever they were trying to go before login,
    // or the dashboard by default.
    navigate(appState?.returnTo || '/Dashboard');
  };

  return (
    <Auth0Provider
      domain="dev-vqru0yyw14evmlui.us.auth0.com"
      clientId="WvuIm5jylPNX2XVVdr1Dt2reWtg6Mum2"
      authorizationParams={{
        redirect_uri: window.location.origin,
        // REQUIRED for the backend to receive a real JWT instead of an
        // opaque token. Replace with your actual API Identifier once
        // you've created the "Calorific API" application in Auth0.
        audience: 'https://calorific-api.azurewebsites.net',
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <App />
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>
);
