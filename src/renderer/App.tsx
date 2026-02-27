import { ImportProvider } from './context/ImportContext';
import { useVolumes } from './hooks/useVolumes';
import { useSettings } from './hooks/useSettings';
import { Layout } from './components/Layout';
import { SourcePanel } from './components/SourcePanel';
import { ThumbnailGrid } from './components/ThumbnailGrid';
import { DestinationPanel } from './components/DestinationPanel';
import { ImportProgress } from './components/ImportProgress';
import { ImportSummary } from './components/ImportSummary';

function AppInner() {
  useVolumes();
  useSettings();

  return (
    <>
      <Layout
        left={<SourcePanel />}
        center={<ThumbnailGrid />}
        right={<DestinationPanel />}
      />
      <ImportProgress />
      <ImportSummary />
    </>
  );
}

export function App() {
  return (
    <ImportProvider>
      <AppInner />
    </ImportProvider>
  );
}
