import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { supabase } from '../lib/supabase';

export function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    setExporting(format);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to export data');
        setExporting(null);
        return;
      }

      // Fetch all decisions from API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/decisions?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch decisions');
      }

      const data = await response.json();
      const decisions = data.decisions || [];

      if (format === 'json') {
        // Create JSON export
        const exportData = {
          exportDate: new Date().toISOString(),
          totalDecisions: decisions.length,
          decisions: decisions,
        };

        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `decisions-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Create CSV export
        const csvHeaders = [
          'Title',
          'Status',
          'Category',
          'Emotional State',
          'Confidence Level',
          'Chosen Option',
          'Options',
          'Notes',
          'Created Date',
          'Decided Date',
          'Abandoned Date',
        ];

        const csvRows = decisions.map((decision: any) => {
          // Format options as a semicolon-separated list
          const optionsText = decision.options?.map((opt: any) => opt.title).join('; ') || '';

          // Get chosen option if exists
          const chosenOption = decision.options?.find((opt: any) => opt.is_chosen)?.title || '';

          return [
            decision.title || '',
            decision.status || '',
            decision.category_name || 'Uncategorized',
            decision.emotional_state || '',
            decision.confidence_level || '',
            chosenOption,
            optionsText,
            decision.notes || '',
            decision.created_at ? new Date(decision.created_at).toLocaleString() : '',
            decision.decided_at ? new Date(decision.decided_at).toLocaleString() : '',
            decision.abandoned_at ? new Date(decision.abandoned_at).toLocaleString() : '',
          ].map(field => {
            // Escape fields containing commas, quotes, or newlines
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
              return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
          }).join(',');
        });

        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `decisions-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // PDF not implemented yet
        alert(`Export as ${format.toUpperCase()} - Coming soon!`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/settings" className="text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <motion.h1
            className="text-2xl font-semibold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Export Data
          </motion.h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <motion.p
          className="text-text-secondary mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Download your decision data in your preferred format. Your data will be prepared and downloaded automatically.
        </motion.p>

        {/* Export options */}
        <div className="space-y-3">
          {/* JSON Export */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <button
              onClick={() => handleExport('json')}
              disabled={exporting !== null}
              className="w-full glass p-4 rounded-xl rim-light hover:bg-white/[0.03] transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium mb-1">JSON Format</div>
                    <div className="text-sm text-text-secondary">Complete data with full structure</div>
                  </div>
                </div>
                {exporting === 'json' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent"></div>
                ) : (
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
            </button>
          </motion.div>

          {/* CSV Export */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="w-full glass p-4 rounded-xl rim-light hover:bg-white/[0.03] transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium mb-1">CSV Format</div>
                    <div className="text-sm text-text-secondary">Spreadsheet-friendly format</div>
                  </div>
                </div>
                {exporting === 'csv' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-400 border-t-transparent"></div>
                ) : (
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
            </button>
          </motion.div>

          {/* PDF Export */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="w-full glass p-4 rounded-xl rim-light hover:bg-white/[0.03] transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium mb-1">PDF Format</div>
                    <div className="text-sm text-text-secondary">Professional formatted report</div>
                  </div>
                </div>
                {exporting === 'pdf' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-400 border-t-transparent"></div>
                ) : (
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
            </button>
          </motion.div>
        </div>

        {/* Info note */}
        <motion.div
          className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <div className="font-medium text-sm mb-1">Your Privacy Matters</div>
              <div className="text-sm text-text-secondary">
                Exported data includes all your decisions, notes, and insights. Keep this file secure as it contains personal information.
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default ExportPage;
