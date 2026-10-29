import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/app-shell';
import { SonnerToaster } from './components/ui/toaster';
import { DashboardPage } from './pages/dashboard';
import { EmployeesPage } from './pages/employees';
import { TimePage } from './pages/time';
import { ReportsPage } from './pages/reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/time" element={<TimePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        <SonnerToaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}