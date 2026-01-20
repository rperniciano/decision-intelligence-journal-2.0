import { VoiceService } from './voiceService.js';
import { jobManager } from './jobManager.js';
import { DecisionService } from './decisionServiceNew.js';

/**
 * Async voice processing service that updates job status as it progresses
 */
export class AsyncVoiceService {
  /**
   * Process a voice recording asynchronously
   * Updates job status throughout the pipeline
   */
  static async processRecordingAsync(
    jobId: string,
    userId: string,
    audioBuffer: Buffer,
    filename: string
  ): Promise<void> {
    try {
      // Step 1: Upload audio if not already uploaded
      jobManager.updateStatus(jobId, 'uploaded', 0.1);

      // Check if audio URL already exists (uploaded in sync part)
      let audioUrl = jobManager.getJob(jobId)?.audioUrl;

      if (!audioUrl) {
        // Upload to storage
        const uploadResult = await VoiceService.uploadAudio(userId, audioBuffer, filename);
        audioUrl = uploadResult.url;
        jobManager.updateJob(jobId, { audioUrl });
      }

      // Step 2: Transcribe
      jobManager.updateStatus(jobId, 'transcribing', 0.3);
      const transcriptionResult = await VoiceService.transcribeAudio(audioUrl);

      jobManager.updateJob(jobId, {
        transcript: transcriptionResult.transcript,
        audioDurationSeconds: transcriptionResult.duration,
        progress: 0.6,
      });

      // Step 3: Extract decision data
      jobManager.updateStatus(jobId, 'extracting', 0.7);
      const extraction = await VoiceService.extractDecisionData(transcriptionResult.transcript);

      // Step 4: Create decision (even with partial results)
      const decision = await DecisionService.createDecision(userId, {
        title: extraction.title,
        status: 'draft',
        category: extraction.suggestedCategory || 'Personal',
        emotional_state: extraction.emotionalState,
        options: extraction.options,
        transcription: transcriptionResult.transcript,
        audio_url: audioUrl,
        audio_duration_seconds: transcriptionResult.duration,
        ai_confidence: extraction.confidence, // Store confidence for display
      });

      if (!decision) {
        throw new Error('Failed to create decision');
      }

      // Mark job as completed (even with partial results)
      jobManager.markCompleted(
        jobId,
        transcriptionResult.transcript,
        extraction,
        decision.id
      );
    } catch (error) {
      // Mark job as failed
      jobManager.markFailed(
        jobId,
        (error as Error).message,
        'PROCESSING_ERROR'
      );
      throw error;
    }
  }

  /**
   * Start async processing in the background
   */
  static startBackgroundProcessing(
    jobId: string,
    userId: string,
    audioBuffer: Buffer,
    filename: string
  ): void {
    // Run processing in background (don't await)
    this.processRecordingAsync(jobId, userId, audioBuffer, filename).catch((error) => {
      console.error(`Background processing failed for job ${jobId}:`, error);
    });
  }
}
