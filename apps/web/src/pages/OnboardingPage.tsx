import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: "What should we call you?",
    description: "Help us personalize your experience"
  },
  {
    id: 2,
    title: "Welcome to Decisions",
    description: "Your voice-first decision intelligence journal"
  },
  {
    id: 3,
    title: "How it works",
    description: "Speak your decisions naturally, and AI extracts the details"
  },
  {
    id: 4,
    title: "Ready to begin?",
    description: "Let's record your first decision together"
  }
];

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete - go to dashboard
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Progress indicator */}
      <div className="absolute top-8 left-0 right-0 flex justify-center gap-2 px-4">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentStep
                ? 'w-12 bg-accent'
                : index < currentStep
                ? 'w-8 bg-accent/50'
                : 'w-8 bg-white/10'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-8 text-text-secondary hover:text-text-primary transition-colors text-sm"
      >
        Skip
      </button>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass p-8 rounded-2xl rim-light text-center">
            {/* Icon/Visual */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent to-accent-700 flex items-center justify-center glow-accent"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.9, 1, 0.9]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {currentStep === 0 && (
                <svg className="w-10 h-10 text-bg-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {currentStep === 1 && (
                <svg className="w-10 h-10 text-bg-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {currentStep === 2 && (
                <svg className="w-10 h-10 text-bg-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
              {currentStep === 3 && (
                <svg className="w-10 h-10 text-bg-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl font-semibold mb-3 text-gradient">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-text-secondary mb-6">
              {step.description}
            </p>

            {/* Step-specific content */}
            {currentStep === 0 && (
              <div className="mb-6">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 text-center"
                  autoFocus
                />
              </div>
            )}

            {currentStep === 1 && (
              <div className="mb-6 space-y-3 text-left">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">Voice-First</h3>
                    <p className="text-sm text-text-secondary">Speak your decisions naturally</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">AI-Powered</h3>
                    <p className="text-sm text-text-secondary">Automatic extraction of options and pros/cons</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">Pattern Discovery</h3>
                    <p className="text-sm text-text-secondary">Understand your decision-making style</p>
                  </div>
                </motion.div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="mb-6 space-y-4 text-left">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-subtle p-4 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🎤</span>
                    <h3 className="font-medium">1. Speak</h3>
                  </div>
                  <p className="text-sm text-text-secondary">Tell us about your decision in your own words</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-subtle p-4 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">✨</span>
                    <h3 className="font-medium">2. AI Extracts</h3>
                  </div>
                  <p className="text-sm text-text-secondary">We automatically structure your thoughts</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-subtle p-4 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📊</span>
                    <h3 className="font-medium">3. Discover</h3>
                  </div>
                  <p className="text-sm text-text-secondary">Track outcomes and learn your patterns</p>
                </motion.div>
              </div>
            )}

            {/* Continue button */}
            <motion.button
              onClick={handleNext}
              disabled={currentStep === 0 && !userName.trim()}
              className="w-full py-3 bg-accent text-bg-deep font-medium rounded-xl hover:bg-accent-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
            </motion.button>

            {/* Step counter */}
            <p className="mt-4 text-sm text-text-secondary">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Grain overlay */}
      <div className="grain-overlay" />
    </div>
  );
}

export default OnboardingPage;
