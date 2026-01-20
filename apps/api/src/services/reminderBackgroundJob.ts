// Feature #204: Background job for due reminder notifications
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for reminder job');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ReminderJobStats {
  total: number;
  processed: number;
  errors: number;
}

class ReminderBackgroundJob {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private stats: ReminderJobStats = {
    total: 0,
    processed: 0,
    errors: 0,
  };

  /**
   * Start the background job
   * @param intervalMs - Check interval in milliseconds (default: 60000 = 1 minute)
   */
  start(intervalMs: number = 60000) {
    if (this.intervalId) {
      console.log('[ReminderJob] Already running');
      return;
    }

    console.log(`[ReminderJob] Starting background job (interval: ${intervalMs}ms)`);

    // Run once immediately on start
    this.processDueReminders();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.processDueReminders();
    }, intervalMs);
  }

  /**
   * Stop the background job
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[ReminderJob] Stopped');
      console.log('[ReminderJob] Stats:', this.stats);
    }
  }

  /**
   * Get current job statistics
   */
  getStats(): ReminderJobStats {
    return { ...this.stats };
  }

  /**
   * Process all due reminders
   */
  private async processDueReminders() {
    // Prevent overlapping runs
    if (this.isRunning) {
      console.log('[ReminderJob] Previous run still in progress, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[ReminderJob] Checking for due reminders...');

      // Find all pending reminders that are due
      const now = new Date().toISOString();

      const { data: dueReminders, error } = await supabase
        .from('DecisionsFollowUpReminders')
        .select('*')
        .eq('status', 'pending')
        .lte('remind_at', now);

      if (error) {
        console.error('[ReminderJob] Error fetching due reminders:', error);
        this.stats.errors++;
        return;
      }

      if (!dueReminders || dueReminders.length === 0) {
        console.log('[ReminderJob] No due reminders found');
        return;
      }

      console.log(`[ReminderJob] Found ${dueReminders.length} due reminders`);
      this.stats.total += dueReminders.length;

      // Process each reminder
      for (const reminder of dueReminders) {
        try {
          await this.processReminder(reminder);
          this.stats.processed++;
        } catch (error) {
          console.error(`[ReminderJob] Error processing reminder ${reminder.id}:`, error);
          this.stats.errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[ReminderJob] Processed ${dueReminders.length} reminders in ${duration}ms`);

    } catch (error) {
      console.error('[ReminderJob] Unexpected error:', error);
      this.stats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single reminder
   * For MVP, this just marks the reminder as sent
   * Push notifications will be implemented in a separate feature (#205)
   */
  private async processReminder(reminder: any) {
    const { id, decision_id, user_id } = reminder;

    // For MVP: Mark as sent (notification delivery will be added in feature #205)
    const { error } = await supabase
      .from('DecisionsFollowUpReminders')
      .update({ status: 'sent' })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update reminder status: ${error.message}`);
    }

    console.log(`[ReminderJob] Reminder ${id} marked as sent for decision ${decision_id}`);

    // TODO (Feature #205): Send push notification
    // This will integrate with Web Push API for PWA notifications
  }
}

// Export singleton instance
export const reminderJob = new ReminderBackgroundJob();
