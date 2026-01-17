import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function RecordPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    try {
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
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);

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

  const processRecording = async () => {
    try {
      setIsProcessing(true);

      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', audioBlob, `recording-${Date.now()}.webm`);

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
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();

      // Navigate to the created decision
      navigate(`/decisions/${result.decision.id}`);
    } catch (err) {
      console.error('Error processing recording:', err);
      setError((err as Error).message || 'Failed to process recording');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      handleStopRecording();
    }
    navigate('/dashboard');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-bg-deep z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-white/5">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-lg font-medium">Record Decision</h1>

        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Main recording area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 glass rounded-lg border border-red-500/20 bg-red-500/10 max-w-md"
          >
            <p className="text-red-400 text-sm">{error}</p>
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
                <svg className="w-16 h-16 text-bg-deep" fill="currentColor" viewBox="0 0 24 24">
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
                onClick={handleStartRecording}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-accent to-accent-700 glow-accent-strong flex items-center justify-center mb-8"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', mass: 1, damping: 15 }}
              >
                <svg className="w-16 h-16 text-bg-deep" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </motion.button>

              <h2 className="text-2xl font-semibold mb-2 text-gradient">
                Tap to Record
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
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
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
                onClick={handleStopRecording}
                className="px-8 py-3 glass glass-hover rounded-full font-medium transition-all duration-200"
              >
                Stop Recording
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions at bottom */}
        {!isRecording && (
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
          </motion.div>
        )}
      </main>

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default RecordPage;
