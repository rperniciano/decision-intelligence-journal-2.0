import type { ProcessingJob, ProcessingStatus } from '@decision-intelligence/shared/types/decision';
import { randomUUID } from 'crypto';

/**
 * In-memory job store for MVP
 * In production, this would be replaced with a database table
 */
class JobManager {
  private jobs: Map<string, ProcessingJob> = new Map();

  /**
   * Create a new processing job
   */
  createJob(userId: string, audioUrl: string, audioDurationSeconds: number | null): ProcessingJob {
    const job: ProcessingJob = {
      id: randomUUID(),
      userId,
      status: 'uploaded',
      progress: 0,
      audioUrl,
      audioDurationSeconds,
      transcript: null,
      extraction: null,
      decisionId: null,
      errorMessage: null,
      errorCode: null,
      retryCount: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update job status
   */
  updateJob(jobId: string, updates: Partial<ProcessingJob>): ProcessingJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) {
      return undefined;
    }

    const updatedJob = { ...job, ...updates };
    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }

  /**
   * Update job status and progress
   */
  updateStatus(
    jobId: string,
    status: ProcessingStatus,
    progress: number,
    additionalData?: Partial<ProcessingJob>
  ): ProcessingJob | undefined {
    const updates: Partial<ProcessingJob> = {
      status,
      progress,
      ...additionalData,
    };

    if (status === 'transcribing' && !this.jobs.get(jobId)?.startedAt) {
      updates.startedAt = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date().toISOString();
    }

    return this.updateJob(jobId, updates);
  }

  /**
   * Mark job as failed
   */
  markFailed(jobId: string, errorMessage: string, errorCode?: string): ProcessingJob | undefined {
    return this.updateStatus(jobId, 'failed', 1, {
      errorMessage,
      errorCode,
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark job as completed
   */
  markCompleted(
    jobId: string,
    transcript: string,
    extraction: any,
    decisionId: string
  ): ProcessingJob | undefined {
    return this.updateStatus(jobId, 'completed', 1, {
      transcript,
      extraction,
      decisionId,
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * Clean up old jobs (optional, for memory management)
   */
  cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, job] of this.jobs.entries()) {
      const jobAge = now - new Date(job.createdAt).getTime();
      if (jobAge > maxAgeMs && (job.status === 'completed' || job.status === 'failed')) {
        this.jobs.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance
export const jobManager = new JobManager();
