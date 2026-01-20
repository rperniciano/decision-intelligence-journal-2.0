const fs = require('fs');

// Read the file
const content = fs.readFileSync('apps/web/src/pages/DecisionDetailPage.tsx', 'utf8');
const lines = content.split('\n');

// Find the line with "Action buttons" comment right after Notes closing div
let insertIndex = null;
for (let i = 1500; i < Math.min(1530, lines.length); i++) {
  if (lines[i].includes('{/* Action buttons */}')) {
    insertIndex = i;
    break;
  }
}

if (!insertIndex) {
  console.error('Could not find insertion point');
  process.exit(1);
}

// Voice reflection UI to insert
const reflectionUI = `
            {/* Feature #188: Voice Reflection Recording */}
            <div className="mb-6 p-4 bg-accent/5 rounded-xl border border-accent/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <label className="block text-sm font-medium text-accent">Voice Reflection (optional)</label>
                </div>
                {!showReflectionRecording && !reflectionTranscript && (
                  <button
                    type="button"
                    onClick={handleStartReflectionRecording}
                    className="text-xs px-3 py-1.5 bg-accent/20 text-accent rounded-full hover:bg-accent/30 transition-colors"
                  >
                    Record
                  </button>
                )}
              </div>

              {/* Recording UI */}
              {showReflectionRecording && (
                <div className="space-y-3">
                  {isRecordingReflection ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 text-accent mb-3 animate-pulse">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-mono text-accent mb-2">
                        {formatRecordingTime(reflectionRecordingTime)}
                      </p>
                      <p className="text-xs text-text-secondary mb-4">Recording your reflection...</p>
                      <button
                        type="button"
                        onClick={handleStopReflectionRecording}
                        className="px-6 py-2 bg-rose-500/20 text-rose-400 rounded-full text-sm font-medium hover:bg-rose-500/30 transition-colors"
                      >
                        Stop Recording
                      </button>
                    </div>
                  ) : isProcessingReflection ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mb-3">
                        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <p className="text-sm text-text-secondary">Processing your reflection...</p>
                    </div>
                  ) : reflectionTranscript ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-text-secondary mb-1">Transcript</p>
                        <p className="text-sm text-text-primary italic">"{reflectionTranscript}"</p>
                      </div>
                      {reflectionInsights && (
                        <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                          <p className="text-xs text-accent mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Key Insights
                          </p>
                          <p className="text-sm text-text-primary">{reflectionInsights}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowReflectionRecording(false);
                          setReflectionTranscript('');
                          setReflectionInsights('');
                        }}
                        className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Record new reflection
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {!showReflectionRecording && !reflectionTranscript && (
                <p className="text-xs text-text-secondary">
                  Record a voice reflection on your decision outcome. AI will extract key insights automatically.
                </p>
              )}
            </div>
`;

// Insert the reflection UI
lines.splice(insertIndex, 0, reflectionUI);

// Write back
fs.writeFileSync('apps/web/src/pages/DecisionDetailPage.tsx', lines.join('\n'), 'utf8');

console.log(`Successfully inserted voice reflection UI at line ${insertIndex}`);
