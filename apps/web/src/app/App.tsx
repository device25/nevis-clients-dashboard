import { DataProvider } from '@nevis/data';
import { ClientsPage } from '#ui';
import { RootErrorBoundary } from './RootErrorBoundary';

export function App() {
  return (
    <RootErrorBoundary>
      <DataProvider>
        <ClientsPage />
      </DataProvider>
    </RootErrorBoundary>
  );
}
