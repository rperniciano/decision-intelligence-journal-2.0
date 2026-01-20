import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SkipLink } from '../components/SkipLink';

export function RecordPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAudioBlob, setSavedAudioBlob] = useState<Blob | null>(null);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordButtonRef = useRef<HTMLButtonElement>(null);
  const stopButtonRef = useRef<HTMLButtonElement>(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  // AbortController for cancelling polling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStartRecording = async () => {
    // Prevent double-clicks - guard against multiple simultaneous recording attempts
    if (isStartingRecording || isRecording) {
      return;
    }

    try {
      setIsStartingRecording(true);
      setError(null);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Process the recording
        await processRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setIsRecording(true);
      setIsStartingRecording(false);
      setRecordingTime(0);
      setStatusAnnouncement('Recording started. Speak now. Press Space or Escape to stop.');

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
      setIsStartingRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setStatusAnnouncement('Recording stopped. Processing your decision.');

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const pollJobStatus = async (jobId: string, token: string): Promise<string> => {
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
    let attempts = 0;

    // Create new AbortController for this polling session
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      while (attempts < maxAttempts) {
        // Check if component is still mounted and not aborted
        if (!isMountedRef.current || abortController.signal.aborted) {
          throw new Error('Polling cancelled - component unmounted');
        }

        // Poll for status
        const statusResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/recordings/${jobId}/status`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: abortController.signal, // Allow aborting the request
          }
        );

        // Check again after async operation
        if (!isMountedRef.current) {
          throw new Error('Polling cancelled - component unmounted during request');
        }

        if (!statusResponse.ok) {
          throw new Error('Failed to check processing status');
        }

        const statusData = await statusResponse.json();

        // Check if completed
        if (statusData.status === 'completed') {
          if (!statusData.decisionId) {
            throw new Error('Processing completed but no decision was created');
          }
          return statusData.decisionId;
        }

        // Check if failed
        if (statusData.status === 'failed') {
          throw new Error(statusData.errorMessage || 'Processing failed');
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
        attempts++;
      }

      throw new Error('Processing timed out. Please try again.');
    } finally {
      // Clean up abort controller
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      abortController.abort();
    }
  };

  const processRecording = async (audioBlob?: Blob) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Create audio blob if not provided (initial recording)
      const blob = audioBlob || new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (blob.size > maxSize) {
        throw new Error(`Audio file is too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB. Try recording a shorter message.`);
      }

      // Save the audio blob for retry
      setSavedAudioBlob(blob);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, `recording-${Date.now()}.webm`);

      // Upload to API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recordings/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed. Please try again or enter manually.');
      }

      const result = await response.json();

      // Start polling for job completion
      const decisionId = await pollJobStatus(result.jobId, session.access_token);

      // Only navigate and update state if component is still mounted
      if (isMountedRef.current) {
        // Navigate to the created decision
        navigate(`/decisions/${decisionId}`);
      }
    } catch (err) {
      console.error('Error processing recording:', err);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        const errorMessage = (err as Error).message;
        // Don't show error for cancelled polling (user navigated away)
        if (!errorMessage.includes('cancelled')) {
          setError(errorMessage || 'Transcription failed. Please try again or enter manually.');
        }
        setIsProcessing(false);
      }
    }
  };

  const handleRetry = () => {
    if (savedAudioBlob) {
      processRecording(savedAudioBlob);
    }
  };

  const handleEnterManually = () => {
    // Navigate to manual decision creation page
    navigate('/decisions/new');
  };

  const handleClose = () => {
    if (isRecording) {
      handleStopRecording();
    }
    navigate('/dashboard');
  };

  // Keyboard event handler for recording controls
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore key events when processing or when focus is on an input/textarea
    if (isProcessing) return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    // Spacebar or Enter to start/stop recording
    if (event.key === ' ' || event.key === 'Enter') {
      // Prevent scrolling when pressing spacebar
      event.preventDefault();

      if (isRecording) {
        handleStopRecording();
      } else if (!isStartingRecording && !error) {
        handleStartRecording();
      }
    }

    // Escape to stop recording or go back
    if (event.key === 'Escape') {
      event.preventDefault();
      if (isRecording) {
        handleStopRecording();
      } else {
        handleClose();
      }
    }
  }, [isRecording, isStartingRecording, isProcessing, error]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Cleanup on unmount - abort any pending polling and mark as unmounted
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Abort any pending polling requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Focus management: focus stop button when recording starts
  useEffect(() => {
    if (isRecording && stopButtonRef.current) {
      stopButtonRef.current.focus();
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-bg-deep z-50 flex flex-col">
      <SkipLink />

      {/* Screen reader announcements for recording status */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusAnnouncement}
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-white/5">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-medium">Record Decision</h1>

        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Main recording area */}
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center p-6" tabIndex={-1}>
        {/* Error message with retry options */}
        {error && savedAudioBlob && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 glass rounded-lg border border-red-500/20 bg-red-500/10 max-w-md"
          >
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="flex-1 px-4 py-2 bg-accent hover:bg-accent-600 text-bg-deep rounded-lg font-medium transition-colors"
                    disabled={isProcessing}
                  >
                    Retry Transcription
                  </button>
                  <button
                    onClick={handleEnterManually}
                    className="flex-1 px-4 py-2 glass glass-hover rounded-lg font-medium transition-colors"
                  >
                    Enter Manually
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {error && !savedAudioBlob && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 glass rounded-lg border border-red-500/20 bg-red-500/10 max-w-md"
          >
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <p className="text-text-secondary text-xs mb-4">
                  To enable microphone access: Go to your browser settings → Site permissions → Microphone → Allow
                </p>
                <button
                  onClick={handleEnterManually}
                  className="w-full px-4 py-2 glass glass-hover rounded-lg font-medium transition-colors text-sm"
                >
                  Enter Decision Manually Instead
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                className="w-40 h-40 rounded-full bg-gradient-to-br from-accent to-accent-700 flex items-center justify-center mb-8"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <svg className="w-16 h-16 text-bg-deep" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </motion.div>

              <h2 className="text-2xl font-semibold mb-2 text-gradient">
                Processing Your Decision...
              </h2>
              <p className="text-text-secondary max-w-md">
                Transcribing audio and extracting decision insights with AI
              </p>
            </motion.div>
          ) : !isRecording ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.button
                ref={recordButtonRef}
                onClick={handleStartRecording}
                disabled={isStartingRecording}
                aria-label="Start recording. Press Space or Enter to record"
                aria-describedby="keyboard-hint"
                className={`w-40 h-40 rounded-full bg-gradient-to-br from-accent to-accent-700 glow-accent-strong flex items-center justify-center mb-8 focus:outline-none focus:ring-4 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg-deep ${isStartingRecording ? 'opacity-70 cursor-not-allowed' : ''}`}
                whileHover={isStartingRecording ? {} : { scale: 1.05 }}
                whileTap={isStartingRecording ? {} : { scale: 0.95 }}
                transition={{ type: 'spring', mass: 1, damping: 15 }}
              >
                <svg className="w-16 h-16 text-bg-deep" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </motion.button>

              <h2 className="text-2xl font-semibold mb-2 text-gradient">
                Tap or Press Space to Record
              </h2>
              <p className="text-text-secondary max-w-md">
                Speak naturally about your decision. Describe what you're deciding, your options, and how you're feeling about it.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              {/* Pulsing recording indicator */}
              <motion.div
                className="relative w-40 h-40 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mb-8"
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 20px rgba(239, 68, 68, 0.3)',
                    '0 0 60px rgba(239, 68, 68, 0.6)',
                    '0 0 20px rgba(239, 68, 68, 0.3)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>

                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-500"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              </motion.div>

              <div className="text-4xl font-bold text-red-500 mb-4 tabular-nums">
                {formatTime(recordingTime)}
              </div>

              <h2 className="text-xl font-semibold mb-2">Recording...</h2>
              <p className="text-text-secondary mb-8 max-w-md">
                Speak clearly and take your time. I'm listening.
              </p>

              <button
                ref={stopButtonRef}
                onClick={handleStopRecording}
                aria-label="Stop recording. Press Space, Enter, or Escape to stop"
                className="px-8 py-3 glass glass-hover rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg-deep"
              >
                Stop Recording (Space/Esc)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions at bottom */}
        {!isRecording && !isProcessing && (
          <motion.div
            className="mt-16 glass p-6 rounded-2xl max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-accent">
              What to say
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>What decision are you making?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>What are your options?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>What are the pros and cons of each option?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>How are you feeling about this decision?</span>
              </li>
            </ul>

            {/* Keyboard shortcuts hint */}
            <div id="keyboard-hint" className="mt-4 pt-4 border-t border-white/10">
              <h4 className="font-medium mb-2 text-xs uppercase tracking-wide text-text-secondary">
                Keyboard Shortcuts
              </h4>
              <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-text-primary font-mono">Space</kbd>
                  <span>Start/Stop</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-text-primary font-mono">Enter</kbd>
                  <span>Start/Stop</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-text-primary font-mono">Esc</kbd>
                  <span>Stop/Back</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default RecordPage;
