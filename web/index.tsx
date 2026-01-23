import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { ToastProvider } from './src/components/Toast';
import { ConfirmDialogProvider } from './src/components/ConfirmDialog';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmDialogProvider>
          <App />
        </ConfirmDialogProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);