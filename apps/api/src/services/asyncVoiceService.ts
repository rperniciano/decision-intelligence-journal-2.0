import { VoiceService } from './voiceService';
import { jobManager } from './jobManager';
import { DecisionService } from './decisionServiceNew';

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
      // Step 1: Upload audio (already done in sync part, but update status)
      jobManager.updateStatus(jobId, 'uploaded', 0.1);

      // Upload to storage
      const { url: audioUrl } = await VoiceService.uploadAudio(userId, audioBuffer, filename);
      jobManager.updateJob(jobId, { audioUrl });

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

      // Step 4: Create decision
      const decision = await DecisionService.createDecision(userId, {
        title: extraction.title,
        status: 'draft',
        category: extraction.suggestedCategory || 'Personal',
        emotional_state: extraction.emotionalState,
        options: extraction.options,
        transcription: transcriptionResult.transcript,
        audio_url: audioUrl,
        audio_duration_seconds: transcriptionResult.duration,
      });

      // Mark job as completed
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
