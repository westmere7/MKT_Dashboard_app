import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DataProvider } from './store/useData';
import { Display } from './display/Display';
import { Admin } from './admin/Admin';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Display />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ErrorBoundary>
  );
}
