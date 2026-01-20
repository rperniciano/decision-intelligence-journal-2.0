import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
config({ path: path.resolve(__dirname, '../../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check .env file.');
}

// Service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface DecisionOption {
  id: string;
  text: string;
  pros: string[];
  cons: string[];
  isChosen?: boolean;
}

export interface Decision {
  id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'deliberating' | 'decided' | 'abandoned' | 'reviewed';
  category: string;
  emotional_state?: string;
  created_at: string;
  decided_at?: string;
  options: DecisionOption[];
  notes?: string;
  transcription?: string;
  deleted_at?: string;
}

export interface CreateDecisionDTO {
  title: string;
  status?: Decision['status'];
  category: string;
  emotional_state?: string;
  options?: DecisionOption[];
  notes?: string;
  transcription?: string;
}

export interface UpdateDecisionDTO {
  title?: string;
  status?: Decision['status'];
  category?: string;
  emotional_state?: string;
  decided_at?: string;
  notes?: string;
  updated_at?: string; // For optimistic locking (concurrent edit detection)
}

export class DecisionService {
  /**
   * Feature #184: Calculate smart reminder timing based on decision category
   * Different categories have different optimal check-in intervals
   */
  private static getReminderDaysForCategory(categoryName: string | null): number {
    // Default: 2 weeks (14 days)
    const defaultDays = 14;

    if (!categoryName) {
      return defaultDays;
    }

    // Category-based reminder timing (AI-adjusted by decision type)
    const categoryReminderDays: { [key: string]: number } = {
      // Financial decisions: outcomes clear quickly (1 week)
      'Finance': 7,
      'Business': 7,

      // Career decisions: medium-term feedback needed (2 weeks)
      'Career': 14,

      // Health decisions: medium-term (2-3 weeks)
      'Health': 21,

      // Relationship decisions: longer to evaluate (3-4 weeks)
      'Relationships': 28,

      // Education: semester/term-based (4 weeks)
      'Education': 28,

      // Lifestyle: personal preferences emerge quickly (1-2 weeks)
      'Lifestyle': 10,
    };

    return categoryReminderDays[categoryName] || defaultDays;
  }

  /**
   * Get all decisions for a user
   */
  static async getDecisions(userId: string, filters?: {
    status?: Decision['status'];
    category?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    fromDate?: string; // Feature #200: Date range filter - start date
    toDate?: string; // Feature #200: Date range filter - end date
  }) {
    // Build base query for counting
    let countQuery = supabase
      .from('decisions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Build data query
    let query = supabase
      .from('decisions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (filters?.status) {
      countQuery = countQuery.eq('status', filters.status);
      query = query.eq('status', filters.status);
    }

    if (filters?.category) {
      countQuery = countQuery.eq('category', filters.category);
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      countQuery = countQuery.ilike('title', `%${filters.search}%`);
      query = query.ilike('title', `%${filters.search}%`);
    }

    // Feature #200: Apply date range filtering
    if (filters?.fromDate) {
      // Filter for decisions created on or after fromDate (inclusive)
      countQuery = countQuery.gte('created_at', filters.fromDate);
      query = query.gte('created_at', filters.fromDate);
    }

    if (filters?.toDate) {
      // Filter for decisions created on or before toDate (inclusive)
      // Add 23:59:59 to include the entire end date
      const endDate = new Date(filters.toDate);
      endDate.setHours(23, 59, 59, 999);
      countQuery = countQuery.lte('created_at', endDate.toISOString());
      query = query.lte('created_at', endDate.toISOString());
    }

    // Apply sorting
    const sortBy = filters?.sort || 'date_desc';
    switch (sortBy) {
      case 'date_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'date_desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'title_asc':
        query = query.order('title', { ascending: true });
        break;
      case 'title_desc':
        query = query.order('title', { ascending: false });
        break;
      case 'category_asc':
        query = query.order('category', { ascending: true });
        break;
      case 'category_desc':
        query = query.order('category', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    // Get total count (without pagination)
    const { count: totalCount, error: countError } = await countQuery;
    if (countError) throw countError;

    // Apply range for pagination to data query
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    return {
      decisions: data || [],
      total: totalCount || 0,
      limit,
      offset,
    };
  }

  /**
   * Get a single decision by ID
   */
  static async getDecisionById(decisionId: string, userId: string) {
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', decisionId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    // Fetch options with pros/cons
    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('*')
      .eq('decision_id', decisionId)
      .order('created_at', { ascending: true });

    if (optionsError) {
      console.error('Error fetching options:', optionsError);
    }

    // For each option, fetch pros and cons
    const optionsWithProsCons = await Promise.all(
      (options || []).map(async (option) => {
        const { data: prosCons, error: prosConsError } = await supabase
          .from('pros_cons')
          .select('*')
          .eq('option_id', option.id)
          .order('display_order', { ascending: true });

        if (prosConsError) {
          console.error('Error fetching pros/cons:', prosConsError);
        }

        const pros = (prosCons || [])
          .filter(pc => pc.type === 'pro')
          .map(pc => ({ id: pc.id, content: pc.content, type: 'pro' as const }));

        const cons = (prosCons || [])
          .filter(pc => pc.type === 'con')
          .map(pc => ({ id: pc.id, content: pc.content, type: 'con' as const }));

        return {
          id: option.id,
          text: option.title,
          pros,
          cons,
          isChosen: option.is_chosen || false,
        };
      })
    );

    return {
      ...data,
      options: optionsWithProsCons,
    };
  }

  /**
   * Create a new decision
   */
  static async createDecision(userId: string, dto: CreateDecisionDTO) {
    const decision = {
      user_id: userId,
      title: dto.title,
      status: dto.status || 'draft',
      category: dto.category,
      emotional_state: dto.emotional_state,
      options: dto.options || [],
      notes: dto.notes,
      transcription: dto.transcription,
    };

    const { data, error } = await supabase
      .from('decisions')
      .insert(decision)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Update a decision with optimistic locking
   * @throws {Error} with code 'CONFLICT' if updated_at doesn't match (concurrent edit detected)
   */
  static async updateDecision(
    decisionId: string,
    userId: string,
    dto: UpdateDecisionDTO
  ) {
    // Extract updated_at from DTO (it's used for locking, not for updating)
    const { updated_at: clientUpdatedAt, ...updateData } = dto;

    // Get current decision to check if status is changing to 'decided'
    const { data: currentDecision } = await supabase
      .from('decisions')
      .select('id, status')
      .eq('id', decisionId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    const isChangingToDecided = currentDecision &&
      currentDecision.status !== 'decided' &&
      updateData.status === 'decided';

    // Build the update query
    let query = supabase
      .from('decisions')
      .update(updateData)
      .eq('id', decisionId)
      .eq('user_id', userId)
      .is('deleted_at', null);

    // If client provided updated_at, use it for optimistic locking
    if (clientUpdatedAt) {
      query = query.filter('updated_at', 'eq', clientUpdatedAt);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - could be not found or version mismatch
        if (clientUpdatedAt) {
          // Check if decision exists at all
          const { data: existing } = await supabase
            .from('decisions')
            .select('id, updated_at')
            .eq('id', decisionId)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .single();

          if (existing) {
            // Decision exists but updated_at didn't match = concurrent edit
            const conflictError = new Error('Decision was modified by another session. Please refresh and try again.');
            (conflictError as any).code = 'CONFLICT';
            (conflictError as any).currentData = existing;
            throw conflictError;
          }
        }
        return null;
      }
      throw error;
    }

    // Feature #184: Smart automatic reminders (2 weeks default, AI-adjusted by decision type)
    // Create automatic reminder when status changes to 'decided'
    if (data && isChangingToDecided) {
      try {
        // Get the decision's category for smart reminder timing
        const categoryName = data.category || null;
        const reminderDays = this.getReminderDaysForCategory(categoryName);

        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + reminderDays);

        const { error: reminderError } = await supabase
          .from('DecisionsFollowUpReminders')
          .insert({
            decision_id: decisionId,
            user_id: userId,
            remind_at: reminderDate.toISOString(),
            status: 'pending'
          });

        if (reminderError) {
          console.error('Failed to create automatic reminder:', reminderError);
        } else {
          console.log(`Feature #184: Smart automatic reminder created for decision ${decisionId} (${categoryName || 'no category'}) at ${reminderDate.toISOString()} (${reminderDays} days)`);
        }
      } catch (reminderError) {
        console.error('Exception creating automatic reminder:', reminderError);
      }
    }

    return data;
  }

  /**
   * Soft delete a decision
   */
  static async deleteDecision(decisionId: string, userId: string) {
    const { data, error } = await supabase
      .from('decisions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', decisionId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Update option chosen status
   * Automatically creates a 2-week reminder when decision is marked as decided
   */
  static async updateOptionChosen(
    decisionId: string,
    userId: string,
    optionId: string
  ) {
    const decision = await this.getDecisionById(decisionId, userId);
    if (!decision) return null;

    // First, set all options for this decision to is_chosen = false
    await supabase
      .from('options')
      .update({ is_chosen: false })
      .eq('decision_id', decisionId);

    // Then, set the chosen option to is_chosen = true
    const { error: optionError } = await supabase
      .from('options')
      .update({ is_chosen: true })
      .eq('id', optionId)
      .eq('decision_id', decisionId);

    if (optionError) throw optionError;

    // Update the decision status and decided_at timestamp
    // Note: updateDecision will automatically create a smart reminder (Feature #184)
    const updatedDecision = await this.updateDecision(decisionId, userId, {
      status: 'decided',
      decided_at: new Date().toISOString(),
    });

    return updatedDecision;
  }
}
