import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './lib/WalletContext';
import { ToastProvider } from './lib/ToastContext';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateManifest from './pages/CreateManifest';
import ManifestDetail from './pages/ManifestDetail';
import Analytics from './pages/Analytics';
import Feedback from './pages/Feedback';

export default function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Nav />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/create" element={<CreateManifest />} />
                  <Route path="/manifest/:id" element={<ManifestDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/feedback" element={<Feedback />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </ToastProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}
