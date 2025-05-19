import { Suspense, lazy } from 'react';

// Layout component
import Layout from './components/layout/Layout';

// Main dashboard component
const Dashboard = lazy(() => import('./pages/Dashboard'));

/**
 * Main App component that sets up the application structure
 * 
 * Uses lazy loading for improved performance
 * Content is wrapped in the common Layout component for consistent UI
 */
function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <Layout>
        <Dashboard />
      </Layout>
    </Suspense>
  );
}

export default App;
