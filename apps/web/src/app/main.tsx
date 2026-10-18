import '@fontsource-variable/inter/opsz.css';
import '@nevis/design-system/styles.css';
import { StrictMode } from 'react';
import { App } from './App';
import { createAppRoot } from './createAppRoot';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Missing #root element');
}

createAppRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
