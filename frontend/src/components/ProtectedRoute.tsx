// src/components/ProtectedRoute.tsx
import { withAuthenticationRequired } from '@auth0/auth0-react';
import type { ComponentType } from 'react';

// Wraps any page component so unauthenticated users are redirected to
// Auth0's Universal Login automatically before the page ever renders.
// Usage: <Route path="/Dashboard" element={<ProtectedRoute component={DashboardPage} />} />
export default function ProtectedRoute({ component }: { component: ComponentType }) {
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF8ED' }}>
        <p style={{ color: '#777167', fontSize: 14 }}>Loading...</p>
      </div>
    ),
  });
  return <Component />;
}
