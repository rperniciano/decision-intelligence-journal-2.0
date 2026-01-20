import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { SkipLink } from '../components/SkipLink';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

// Feature #279: Interface for filter state
interface ExportFilters {
  filter: string;
  category: string;
  time: string;
  search: string;
}

export function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const isExportingRef = useRef(false);

  // Feature #279: Retrieve filter state from sessionStorage
  const [activeFilters, setActiveFilters] = useState<ExportFilters | null>(null);

  useEffect(() => {
    const storedFilters = sessionStorage.getItem('exportFilters');
    if (storedFilters) {
      try {
        setActiveFilters(JSON.parse(storedFilters));
      } catch (e) {
        console.error('Failed to parse stored filters:', e);
      }
    }
  }, []);

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    // Prevent multiple simultaneous exports using ref for immediate check
    if (isExportingRef.current) {
      console.log('Export already in progress, ignoring duplicate click');
      return;
    }

    isExportingRef.current = true;
    setExporting(format);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to export data');
        isExportingRef.current = false;
        setExporting(null);
        return;
      }

      if (format === 'json') {
        // Call JSON export endpoint
        const response = await fetch(`${import.meta.env.VITE_API_URL}/export/json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to export data');
        }

        const exportData = await response.json();

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
        // Feature #279: Build query parameters with filters
        const params = new URLSearchParams();
        params.append('limit', '1000');

        // Apply filters if they exist
        if (activeFilters) {
          if (activeFilters.filter && activeFilters.filter !== 'all') {
            params.append('status', activeFilters.filter);
          }
          if (activeFilters.category && activeFilters.category !== 'all') {
            params.append('category', activeFilters.category);
          }
          if (activeFilters.search && activeFilters.search.trim()) {
            params.append('search', activeFilters.search.trim());
          }
        }

        // Fetch filtered decisions from API for CSV export
        const url = `${import.meta.env.VITE_API_URL}/decisions?${params.toString()}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch decisions');
        }

        const data = await response.json();
        const decisions = data.decisions || [];
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
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `decisions-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      } else if (format === 'pdf') {
        // Feature #279: Build query parameters with filters
        const params = new URLSearchParams();
        params.append('limit', '1000');

        // Apply filters if they exist
        if (activeFilters) {
          if (activeFilters.filter && activeFilters.filter !== 'all') {
            params.append('status', activeFilters.filter);
          }
          if (activeFilters.category && activeFilters.category !== 'all') {
            params.append('category', activeFilters.category);
          }
          if (activeFilters.search && activeFilters.search.trim()) {
            params.append('search', activeFilters.search.trim());
          }
        }

        // Fetch filtered decisions for PDF export
        const url = `${import.meta.env.VITE_API_URL}/decisions?${params.toString()}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch decisions for PDF export');
        }

        const data = await response.json();
        const decisions = data.decisions || [];

        if (decisions.length === 0) {
          alert('No decisions to export');
          return;
        }

        // Create PDF document
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        // Helper function to check if we need a new page
        const checkNewPage = (neededSpace: number) => {
          if (yPosition + neededSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
        };

        // Helper function to wrap text
        const wrapText = (text: string, maxWidth: number): string[] => {
          const lines: string[] = [];
          const words = text.split(' ');
          let currentLine = '';

          words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = doc.getTextWidth(testLine);
            if (metrics > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          if (currentLine) {
            lines.push(currentLine);
          }
          return lines;
        };

        // Title page
        doc.setFontSize(24);
        doc.setTextColor(0, 212, 170); // Accent color (#00d4aa)
        doc.text('Decision Intelligence Journal', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text('Exported on ' + new Date().toLocaleDateString(), pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;
        doc.text(`Total Decisions: ${decisions.length}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        // Add page for each decision
        decisions.forEach((decision: any, index: number) => {
          // Add new page for each decision after the first
          if (index > 0) {
            doc.addPage();
            yPosition = margin;
          }

          // Decision title
          checkNewPage(20);
          doc.setFontSize(16);
          doc.setTextColor(20, 20, 20);
          const titleLines = wrapText(decision.title || 'Untitled', maxWidth);
          titleLines.forEach((line, i) => {
            doc.text(line, margin, yPosition + (i * 7));
          });
          yPosition += titleLines.length * 7 + 5;

          // Decision metadata
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);

          // Status with color coding
          const statusColors: Record<string, number[]> = {
            draft: [150, 150, 150],
            in_progress: [0, 150, 255],
            decided: [0, 200, 100],
            abandoned: [200, 100, 100],
          };
          const statusColor = statusColors[decision.status] || [100, 100, 100];
          doc.setTextColor(...statusColor);
          doc.text(`Status: ${decision.status || 'N/A'}`, margin, yPosition);
          yPosition += 6;

          doc.setTextColor(100, 100, 100);
          doc.text(`Category: ${decision.category_name || 'Uncategorized'}`, margin, yPosition);
          yPosition += 6;

          if (decision.emotional_state) {
            doc.text(`Emotional State: ${decision.emotional_state}`, margin, yPosition);
            yPosition += 6;
          }

          if (decision.confidence_level) {
            doc.text(`Confidence: ${decision.confidence_level}`, margin, yPosition);
            yPosition += 6;
          }

          if (decision.created_at) {
            doc.text(`Created: ${new Date(decision.created_at).toLocaleString()}`, margin, yPosition);
            yPosition += 6;
          }

          if (decision.decided_at) {
            doc.text(`Decided: ${new Date(decision.decided_at).toLocaleString()}`, margin, yPosition);
            yPosition += 6;
          }

          if (decision.abandoned_at) {
            doc.text(`Abandoned: ${new Date(decision.abandoned_at).toLocaleString()}`, margin, yPosition);
            yPosition += 6;
          }
          yPosition += 5;

          // Options section
          if (decision.options && decision.options.length > 0) {
            checkNewPage(15);
            doc.setFontSize(12);
            doc.setTextColor(20, 20, 20);
            doc.text('Options:', margin, yPosition);
            yPosition += 7;

            doc.setFontSize(10);
            decision.options.forEach((option: any) => {
              checkNewPage(12);
              const isChosen = option.is_chosen ? '✓ ' : '  ';
              const optionText = `${isChosen}${option.title || 'Untitled'}`;
              const optionLines = wrapText(optionText, maxWidth - 5);
              optionLines.forEach((line, i) => {
                if (i === 0) {
                  doc.setTextColor(option.is_chosen ? 0 : 100, option.is_chosen ? 200 : 100, option.is_chosen ? 100 : 100);
                } else {
                  doc.setTextColor(100, 100, 100);
                }
                doc.text(line, margin + 5, yPosition + (i * 6));
              });
              yPosition += optionLines.length * 6 + 3;

              // Option pros/cons if available
              if (option.pros && option.pros.length > 0) {
                doc.setTextColor(80, 80, 80);
                const prosText = `Pros: ${option.pros.map((p: any) => p.text).join(', ')}`;
                const prosLines = wrapText(prosText, maxWidth - 10);
                prosLines.forEach((line, i) => {
                  doc.text(line, margin + 10, yPosition + (i * 5));
                });
                yPosition += prosLines.length * 5 + 2;
              }

              if (option.cons && option.cons.length > 0) {
                doc.setTextColor(80, 80, 80);
                const consText = `Cons: ${option.cons.map((c: any) => c.text).join(', ')}`;
                const consLines = wrapText(consText, maxWidth - 10);
                consLines.forEach((line, i) => {
                  doc.text(line, margin + 10, yPosition + (i * 5));
                });
                yPosition += consLines.length * 5 + 2;
              }
            });
            yPosition += 5;
          }

          // Notes section
          if (decision.notes) {
            checkNewPage(15);
            doc.setFontSize(12);
            doc.setTextColor(20, 20, 20);
            doc.text('Notes:', margin, yPosition);
            yPosition += 7;

            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            const notesLines = wrapText(decision.notes, maxWidth);
            notesLines.forEach((line) => {
              checkNewPage(6);
              doc.text(line, margin, yPosition);
              yPosition += 6;
            });
          }

          // Outcome section if available
          if (decision.outcome && decision.outcome.result) {
            checkNewPage(15);
            doc.setFontSize(12);
            doc.setTextColor(20, 20, 20);
            doc.text('Outcome:', margin, yPosition);
            yPosition += 7;

            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            const outcomeLines = wrapText(`Result: ${decision.outcome.result}`, maxWidth);
            outcomeLines.forEach((line) => {
              checkNewPage(6);
              doc.text(line, margin, yPosition);
              yPosition += 6;
            });

            if (decision.outcome.satisfaction) {
              doc.text(`Satisfaction: ${decision.outcome.satisfaction}/5`, margin, yPosition);
              yPosition += 6;
            }
          }
        });

        // Save the PDF
        doc.save(`decisions-export-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      isExportingRef.current = false;
      setExporting(null);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <SkipLink />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/settings" className="text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6" tabIndex={-1}>
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
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
            <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <div className="font-medium text-sm mb-1">Your Privacy Matters</div>
              <div className="text-sm text-text-secondary">
                {activeFilters && (activeFilters.filter !== 'all' || activeFilters.category !== 'all' || activeFilters.search) ? (
                  <>
                    Export will include only <span className="text-accent font-medium">filtered</span> decisions from your History view.
                  </>
                ) : (
                  <>
                    Exported data includes all your decisions, notes, and insights.
                  </>
                )}
                {' '}Keep this file secure as it contains personal information.
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
