import FortigateMonitor from './FortigateMonitor'
import InterfaceTestData from './InterfaceTestData'

function App() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page') || 'monitor';
  if (page === 'test-data') return <InterfaceTestData />;
  return <FortigateMonitor />
}

export default App