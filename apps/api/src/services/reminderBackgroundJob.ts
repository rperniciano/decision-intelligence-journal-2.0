// Feature #204: Background job for due reminder notifications
// Feature #263: Quiet hours respected for notifications
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for reminder job');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function parseTimeString(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if current time is within quiet hours
 * @param currentTimeStr - Current time in "HH:MM" format
 * @param quietStart - Quiet hours start time in "HH:MM" format
 * @param quietEnd - Quiet hours end time in "HH:MM" format
 */
function isInQuietHours(currentTimeStr: string, quietStart: string, quietEnd: string): boolean {
  const currentMinutes = parseTimeString(currentTimeStr);
  const startMinutes = parseTimeString(quietStart);
  const endMinutes = parseTimeString(quietEnd);

  if (endMinutes < startMinutes) {
    // Quiet hours span midnight (e.g., 22:00 to 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Quiet hours within same day (e.g., 01:00 to 05:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

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
   * Feature #263: Respects quiet hours - delays notifications until after quiet hours
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

      // Process each reminder (with quiet hours check)
      for (const reminder of dueReminders) {
        try {
          // Feature #263: Check if we should process this reminder now or delay it
          const shouldProcess = await this.shouldProcessReminderNow(reminder);

          if (shouldProcess) {
            await this.processReminder(reminder);
            this.stats.processed++;
          } else {
            console.log(`[ReminderJob] Reminder ${reminder.id} delayed due to quiet hours`);
          }
        } catch (error) {
          console.error(`[ReminderJob] Error processing reminder ${reminder.id}:`, error);
          this.stats.errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[ReminderJob] Checked ${dueReminders.length} reminders in ${duration}ms`);

    } catch (error) {
      console.error('[ReminderJob] Unexpected error:', error);
      this.stats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if a reminder should be processed now or delayed due to quiet hours
   * Feature #263: Returns false if current time is within user's quiet hours
   */
  private async shouldProcessReminderNow(reminder: any): Promise<boolean> {
    try {
      // Get user's quiet hours settings
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(reminder.user_id);

      if (userError || !user) {
        console.error(`[ReminderJob] Error fetching user ${reminder.user_id}:`, userError);
        // If we can't get user settings, process the reminder anyway
        return true;
      }

      const userMetadata = user?.user_metadata || {};

      // Get quiet hours settings (default: 10pm-8am if not set)
      const quietHoursStart = userMetadata.quiet_hours_start || '22:00';
      const quietHoursEnd = userMetadata.quiet_hours_end || '08:00';
      const quietHoursEnabled = userMetadata.quiet_hours_enabled !== false; // default true
      const userTimezone = userMetadata.timezone || 'UTC';

      // If quiet hours are disabled, process the reminder
      if (!quietHoursEnabled) {
        return true;
      }

      // Get current time in user's timezone
      const now = new Date();
      const timeZoneFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const currentTimeStr = timeZoneFormatter.format(now);

      // Check if current time is within quiet hours
      const isCurrentlyQuietHours = isInQuietHours(currentTimeStr, quietHoursStart, quietHoursEnd);

      if (isCurrentlyQuietHours) {
        console.log(`[ReminderJob] User ${reminder.user_id} is in quiet hours (${currentTimeStr} between ${quietHoursStart}-${quietHoursEnd})`);
        return false; // Don't process now, will be retried after quiet hours
      }

      // Not in quiet hours, process the reminder
      return true;

    } catch (error) {
      console.error(`[ReminderJob] Error checking quiet hours for reminder ${reminder.id}:`, error);
      // If we can't check quiet hours, process the reminder anyway
      return true;
    }
  }

  /**
   * Process a single reminder
   * For MVP, this just marks the reminder as sent
   * Push notifications will be implemented in a separate feature (#205)
   */
  private async processReminder(reminder: any) {
    const { id, decision_id } = reminder;

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
