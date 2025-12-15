import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileDropZone } from './components/FileDropZone';
import { ScanResults } from './components/ScanResults';
import { StatusBar } from './components/StatusBar';
import type { ScanResult, ScanStatus } from './types';

function App() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (filePath: string) => {
    setCurrentFile(filePath);
    setStatus('scanning');
    setError(null);
    setScanResult(null);

    try {
      const result = await window.electronAPI.scanCrashLog(filePath);
      setScanResult(result);
      setStatus('complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStatus('error');
    }
  }, []);

  const handleOpenFile = useCallback(async () => {
    const filePath = await window.electronAPI.openFileDialog();
    if (filePath) {
      handleFileSelect(filePath);
    }
  }, [handleFileSelect]);

  const handleReset = useCallback(() => {
    setScanResult(null);
    setStatus('idle');
    setError(null);
    setCurrentFile(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Header onOpenFile={handleOpenFile} onReset={handleReset} />

      <main className="flex-1 container mx-auto px-4 py-6">
        {status === 'idle' && (
          <FileDropZone onFileSelect={handleFileSelect} onOpenDialog={handleOpenFile} />
        )}

        {status === 'scanning' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-slate-400">Scanning crash log...</p>
              {currentFile && (
                <p className="text-slate-500 text-sm mt-2 truncate max-w-md">
                  {currentFile}
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Scan Failed</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'complete' && scanResult && (
          <ScanResults result={scanResult} onReset={handleReset} />
        )}
      </main>

      <StatusBar status={status} filePath={currentFile} issueCount={scanResult?.issues.length} />
    </div>
  );
}

export default App;
