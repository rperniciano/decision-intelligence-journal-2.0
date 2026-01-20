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
   * Get all decisions for a user with their options, pros/cons, and category
   */
  static async getDecisions(userId: string, filters?: {
    status?: string;
    categoryId?: string;
    emotion?: string; // Feature #201: emotion filtering
    search?: string;
    outcome?: string; // Feature #203: outcome filtering (better, as_expected, worse)
    limit?: number;
    offset?: number;
    cursor?: string; // ISO timestamp for cursor-based pagination (Feature #267)
    fromDate?: string; // Feature #200: Date range filter - start date (ISO format)
    toDate?: string; // Feature #200: Date range filter - end date (ISO format)
  }) {
    try {
      // Build the base query for count (simplified select for better performance)
      let countQuery = supabase
        .from('decisions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Apply same filters to count query
      if (filters?.status) {
        countQuery = countQuery.eq('status', filters.status);
      }
      if (filters?.categoryId) {
        countQuery = countQuery.eq('category_id', filters.categoryId);
      }
      if (filters?.emotion) {
        countQuery = countQuery.eq('detected_emotional_state', filters.emotion);
      }
      if (filters?.search) {
        countQuery = countQuery.ilike('title', `%${filters.search}%`);
      }
      // Feature #203: outcome filter - only count decisions with matching outcome
      if (filters?.outcome) {
        countQuery = countQuery.eq('outcome', filters.outcome);
      }

      // Feature #200: Apply date range filtering to count query
      if (filters?.fromDate) {
        // Handle date-only string (YYYY-MM-DD) by converting to ISO timestamp at midnight
        const startDate = new Date(filters.fromDate);
        startDate.setHours(0, 0, 0, 0);
        countQuery = countQuery.gte('created_at', startDate.toISOString());
      }
      if (filters?.toDate) {
        // Handle date-only string (YYYY-MM-DD) by converting to ISO timestamp at end of day
        const endDate = new Date(filters.toDate);
        endDate.setHours(23, 59, 59, 999);
        countQuery = countQuery.lte('created_at', endDate.toISOString());
      }

      // Get the count
      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Supabase count error:', countError);
        throw countError;
      }

      // Build the main query for data
      let query = supabase
        .from('decisions')
        .select(`
          *,
          category:categories(id, name, icon, color),
          options:options!options_decision_id_fkey(
            id,
            title,
            display_order,
            pros_cons(id, type, content, display_order)
          )
        `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.emotion) {
        query = query.eq('detected_emotional_state', filters.emotion);
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      // Feature #203: outcome filter - only fetch decisions with matching outcome
      if (filters?.outcome) {
        query = query.eq('outcome', filters.outcome);
      }

      // Feature #200: Apply date range filtering to main query
      if (filters?.fromDate) {
        // Handle date-only string (YYYY-MM-DD) by converting to ISO timestamp at midnight
        const startDate = new Date(filters.fromDate);
        startDate.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startDate.toISOString());
      }
      if (filters?.toDate) {
        // Handle date-only string (YYYY-MM-DD) by converting to ISO timestamp at end of day
        const endDate = new Date(filters.toDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const limit = filters?.limit || 20;

      // Feature #267: Cursor-based pagination for consistency when data changes
      // If cursor is provided, use it instead of offset
      if (filters?.cursor) {
        // Cursor-based: get items created before the cursor timestamp
        query = query.lt('created_at', filters.cursor);
        query = query.limit(limit);
      } else {
        // Offset-based: traditional pagination (backward compatible)
        const offset = filters?.offset || 0;
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Transform data to match expected format
      const decisions = (data || []).map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        title: d.title,
        status: d.status,
        category: d.category?.name || 'Uncategorized',
        category_id: d.category_id,
        emotional_state: d.detected_emotional_state,
        created_at: d.created_at,
        decided_at: d.decided_at,
        decide_by_date: d.decide_by_date,
        options: (d.options || []).map((opt: any) => ({
          id: opt.id,
          text: opt.title,
          pros: (opt.pros_cons || [])
            .filter((pc: any) => pc.type === 'pro')
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((pc: any) => pc.content),
          cons: (opt.pros_cons || [])
            .filter((pc: any) => pc.type === 'con')
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((pc: any) => pc.content),
          isChosen: d.chosen_option_id === opt.id
        })).sort((a: any, b: any) => a.display_order - b.display_order),
        notes: d.description,
        transcription: d.raw_transcript,
        deleted_at: d.deleted_at,
        outcome: d.outcome,
        outcome_notes: d.outcome_notes,
        outcome_recorded_at: d.outcome_recorded_at
      }));

      // Feature #267: Calculate next cursor for cursor-based pagination
      // The cursor is the created_at timestamp of the last item on this page
      const lastDecision = decisions[decisions.length - 1];
      const nextCursor = lastDecision ? lastDecision.created_at : null;
      const hasMore = decisions.length === limit;

      return {
        decisions,
        total: count || 0,
        limit,
        offset: filters?.offset || 0,
        // Cursor-based pagination fields (Feature #267)
        nextCursor,
        hasMore,
      };
    } catch (error) {
      console.error('Error in getDecisions:', error);
      throw error;
    }
  }

  /**
   * Get a single decision by ID
   */
  static async getDecisionById(decisionId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select(`
          *,
          category:categories(id, name, icon, color),
          options:options!options_decision_id_fkey(
            id,
            title,
            display_order,
            pros_cons(id, type, content, display_order)
          )
        `)
        .eq('id', decisionId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      // Transform to match expected format (camelCase for frontend)
      return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        status: data.status,
        category: data.category?.name || 'Uncategorized',
        category_id: data.category_id,
        emotionalState: data.detected_emotional_state,
        createdAt: data.created_at,
        updatedAt: data.updated_at, // Include for optimistic locking (concurrent edit detection)
        decidedAt: data.decided_at,
        decide_by_date: data.decide_by_date,
        options: (data.options || []).map((opt: any) => ({
          id: opt.id,
          text: opt.title,
          pros: (opt.pros_cons || [])
            .filter((pc: any) => pc.type === 'pro')
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((pc: any) => ({ id: pc.id, content: pc.content, type: 'pro' as const })),
          cons: (opt.pros_cons || [])
            .filter((pc: any) => pc.type === 'con')
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((pc: any) => ({ id: pc.id, content: pc.content, type: 'con' as const })),
          isChosen: data.chosen_option_id === opt.id
        })).sort((a: any, b: any) => a.display_order - b.display_order),
        notes: data.description,
        transcription: data.raw_transcript,
        outcome: data.outcome,
        outcomeNotes: data.outcome_notes,
        outcomeRecordedAt: data.outcome_recorded_at,
        deletedAt: data.deleted_at
      };
    } catch (error) {
      console.error('Error in getDecisionById:', error);
      throw error;
    }
  }

  /**
   * Create a new decision
   */
  static async createDecision(userId: string, dto: any) {
    try {
      // First, get or create the category
      let categoryId = dto.category_id;

      if (!categoryId && dto.category) {
        // Try to find existing category
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', userId)
          .eq('name', dto.category)
          .single();

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create new category
          const slug = dto.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const { data: newCategory, error: catError } = await supabase
            .from('categories')
            .insert({
              user_id: userId,
              name: dto.category,
              slug: slug,
              icon: '📁',
              color: '#00d4aa'
            })
            .select()
            .single();

          if (catError) throw catError;
          categoryId = newCategory.id;
        }
      }

      // Create the decision
      const { data: decision, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          user_id: userId,
          title: dto.title,
          status: dto.status || 'draft',
          category_id: categoryId,
          detected_emotional_state: dto.emotional_state,
          description: dto.notes,
          raw_transcript: dto.transcription,
          audio_url: dto.audio_url,
          audio_duration_seconds: dto.audio_duration_seconds,
          decided_at: dto.decided_at,
          decide_by_date: dto.decide_by_date,
        })
        .select()
        .single();

      if (decisionError) throw decisionError;

      // Create options and their pros/cons if provided
      if (dto.options && dto.options.length > 0) {
        for (let i = 0; i < dto.options.length; i++) {
          const opt = dto.options[i];

          const { data: option, error: optError } = await supabase
            .from('options')
            .insert({
              decision_id: decision.id,
              title: opt.name || opt.text || opt.title,
              display_order: i,
            })
            .select()
            .single();

          if (optError) throw optError;

          // Create pros
          if (opt.pros && opt.pros.length > 0) {
            const prosToInsert = opt.pros.map((pro: string, idx: number) => ({
              option_id: option.id,
              type: 'pro',
              content: pro,
              display_order: idx,
            }));

            const { error: prosError } = await supabase
              .from('pros_cons')
              .insert(prosToInsert);

            if (prosError) throw prosError;
          }

          // Create cons
          if (opt.cons && opt.cons.length > 0) {
            const consToInsert = opt.cons.map((con: string, idx: number) => ({
              option_id: option.id,
              type: 'con',
              content: con,
              display_order: idx,
            }));

            const { error: consError } = await supabase
              .from('pros_cons')
              .insert(consToInsert);

            if (consError) throw consError;
          }

          // If this option is chosen, update the decision
          if (opt.isChosen) {
            await supabase
              .from('decisions')
              .update({ chosen_option_id: option.id })
              .eq('id', decision.id);
          }
        }
      }

      // Fetch the complete decision with all relations
      return await this.getDecisionById(decision.id, userId);
    } catch (error) {
      console.error('Error in createDecision:', error);
      throw error;
    }
  }

  /**
   * Update a decision with optimistic locking for concurrent edit detection
   * @throws {Error} with code 'CONFLICT' if updated_at doesn't match (concurrent edit detected)
   * @throws {Error} with code 'GONE' if decision was deleted by another session
   */
  static async updateDecision(decisionId: string, userId: string, dto: any) {
    try {
      // First verify the decision belongs to the user and get current version
      const { data: existing, error: fetchError } = await supabase
        .from('decisions')
        .select('id, status, decided_at, updated_at')
        .eq('id', decisionId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (fetchError || !existing) {
        // Decision not found or deleted - throw GONE error
        const goneError = new Error('This decision has been deleted.');
        (goneError as any).code = 'GONE';
        throw goneError;
      }

      // Check for concurrent edit if client provided updated_at
      // Client may send either snake_case (updated_at) or camelCase (updatedAt)
      const clientUpdatedAt = dto.updated_at || dto.updatedAt;
      if (clientUpdatedAt && clientUpdatedAt !== existing.updated_at) {
        const conflictError = new Error('Decision was modified by another session. Please refresh and try again.');
        (conflictError as any).code = 'CONFLICT';
        (conflictError as any).currentData = { id: existing.id, updated_at: existing.updated_at };
        throw conflictError;
      }

      // Feature #184: Track if status is changing to 'decided' for automatic reminder creation
      const isChangingToDecided = existing.status !== 'decided' && dto.status === 'decided';

      // Prepare update data (exclude updated_at from the actual update)
      const updateData: any = {};

      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.status !== undefined) updateData.status = dto.status;
      // Map emotional_state to detected_emotional_state for consistency
      if (dto.emotional_state !== undefined) updateData.detected_emotional_state = dto.emotional_state;
      if (dto.detected_emotional_state !== undefined) updateData.detected_emotional_state = dto.detected_emotional_state;
      if (dto.category_id !== undefined) updateData.category_id = dto.category_id;
      if (dto.chosen_option_id !== undefined) updateData.chosen_option_id = dto.chosen_option_id;
      if (dto.outcome !== undefined) updateData.outcome = dto.outcome;
      if (dto.outcome_notes !== undefined) updateData.outcome_notes = dto.outcome_notes;
      if (dto.decide_by_date !== undefined) updateData.decide_by_date = dto.decide_by_date;

      // If recording an outcome, set outcome_recorded_at timestamp
      if (dto.outcome !== undefined) {
        updateData.outcome_recorded_at = new Date().toISOString();
        // Also update status to 'reviewed' if recording an outcome
        if (!updateData.status) {
          updateData.status = 'reviewed';
        }
      }

      // If transitioning to "decided" status, set decided_at timestamp
      if (dto.status === 'decided' && !existing.decided_at) {
        updateData.decided_at = new Date().toISOString();
      }

      // Update the decision
      const { error: updateError } = await supabase
        .from('decisions')
        .update(updateData)
        .eq('id', decisionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Feature #184: Smart automatic reminders (2 weeks default, AI-adjusted by decision type)
      // Create automatic reminder when status changes to 'decided'
      if (isChangingToDecided) {
        try {
          // Fetch the decision with its category to determine smart reminder timing
          const { data: decisionWithCategory } = await supabase
            .from('decisions')
            .select(`
              category_id,
              category:categories(name)
            `)
            .eq('id', decisionId)
            .single();

          // Calculate reminder days based on category (AI-adjusted by decision type)
          const categoryName = decisionWithCategory?.category?.name || null;
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
            // Don't throw - the decision update succeeded, just log the error
          } else {
            console.log(`Feature #184: Smart automatic reminder created for decision ${decisionId} (${categoryName || 'no category'}) at ${reminderDate.toISOString()} (${reminderDays} days)`);
          }
        } catch (reminderError) {
          console.error('Exception creating automatic reminder:', reminderError);
          // Don't throw - the decision update succeeded
        }
      }

      // Return the complete decision with all relations
      return await this.getDecisionById(decisionId, userId);
    } catch (error: any) {
      // Re-throw CONFLICT errors as-is
      if (error.code === 'CONFLICT') {
        throw error;
      }
      console.error('Error in updateDecision:', error);
      throw error;
    }
  }

  /**
   * Get deleted (trashed) decisions for a user
   */
  static async getDeletedDecisions(userId: string, filters?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Build the base query for count (simplified select for better performance)
      let countQuery = supabase
        .from('decisions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('deleted_at', 'is', null);

      // Apply same filters to count query
      if (filters?.search) {
        countQuery = countQuery.ilike('title', `%${filters.search}%`);
      }

      // Get the count
      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Supabase count error:', countError);
        throw countError;
      }

      // Build the main query for data
      let query = supabase
        .from('decisions')
        .select(`
          *,
          category:categories(id, name, icon, color),
          options:options!options_decision_id_fkey(
            id,
            title,
            display_order,
            pros_cons(id, type, content, display_order)
          )
        `)
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Transform data to match expected format
      const decisions = (data || []).map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        title: d.title,
        status: d.status,
        category: d.category?.name || 'Uncategorized',
        category_id: d.category_id,
        emotional_state: d.detected_emotional_state,
        created_at: d.created_at,
        decided_at: d.decided_at,
        decide_by_date: d.decide_by_date,
        options: (d.options || []).map((opt: any) => ({
          id: opt.id,
          text: opt.title,
          pros: (opt.pros_cons || [])
            .filter((pc: any) => pc.type === 'pro')
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((pc: any) => pc.content),
          cons: (opt.pros_cons || [])
            .filter((pc: any) => pc.type === 'con')
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((pc: any) => pc.content),
          isChosen: d.chosen_option_id === opt.id
        })).sort((a: any, b: any) => a.display_order - b.display_order),
        notes: d.description,
        transcription: d.raw_transcript,
        deleted_at: d.deleted_at,
        outcome: d.outcome,
        outcome_notes: d.outcome_notes,
        outcome_recorded_at: d.outcome_recorded_at
      }));

      return {
        decisions,
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error in getDeletedDecisions:', error);
      throw error;
    }
  }

  /**
   * Soft delete a decision
   * Also deletes related options and pros/cons to maintain data integrity
   */
  static async deleteDecision(decisionId: string, userId: string) {
    // First, get all options for this decision
    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('id')
      .eq('decision_id', decisionId);

    if (optionsError) {
      console.error('Error fetching options for cascade delete:', optionsError);
    }

    // Delete pros/cons for all options
    if (options && options.length > 0) {
      const optionIds = options.map(o => o.id);
      const { error: prosconsError } = await supabase
        .from('pros_cons')
        .delete()
        .in('option_id', optionIds);

      if (prosconsError) {
        console.error('Error deleting pros/cons:', prosconsError);
      }
    }

    // Delete all options for this decision
    const { error: deleteOptionsError } = await supabase
      .from('options')
      .delete()
      .eq('decision_id', decisionId);

    if (deleteOptionsError) {
      console.error('Error deleting options:', deleteOptionsError);
    }

    // Soft delete the decision
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
   * Restore a soft-deleted decision
   */
  static async restoreDecision(decisionId: string, userId: string) {
    const { data, error } = await supabase
      .from('decisions')
      .update({ deleted_at: null })
      .eq('id', decisionId)
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
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
   * Permanently delete a decision from the database
   * This is a hard delete - cannot be undone
   */
  static async permanentlyDeleteDecision(decisionId: string, userId: string) {
    const { data, error } = await supabase
      .from('decisions')
      .delete()
      .eq('id', decisionId)
      .eq('user_id', userId)
      .not('deleted_at', 'is', null) // Only allow permanent deletion of soft-deleted items
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
   * Get dashboard statistics for a user
   */
  static async getStatistics(userId: string) {
    try {
      // Get total count of active decisions (not deleted)
      const { count: totalDecisions, error: countError } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (countError) {
        console.error('Count error:', countError);
        throw countError;
      }

      // Get count of decisions with status='decided'
      const { count: decidedCount, error: decidedError } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .eq('status', 'decided');

      if (decidedError) {
        console.error('Decided count error:', decidedError);
        // Don't throw - just set to 0
      }

      // Calculate positive outcomes percentage (simplified for now)
      // Using decided decisions as a proxy for positive outcomes
      const positiveOutcomePercentage = decidedCount && totalDecisions && totalDecisions > 0
        ? Math.round((decidedCount / totalDecisions) * 100)
        : 0;

      // Calculate decision score (simplified: based on number of decisions)
      // More decisions = higher score (max 100, +2 points per decision)
      const decisionScore = Math.min(100, (totalDecisions || 0) * 2);

      return {
        totalDecisions: totalDecisions || 0,
        positiveOutcomePercentage,
        decisionScore,
      };
    } catch (error) {
      console.error('Error in getStatistics:', error);
      throw error;
    }
  }

  /**
   * Abandon a decision (Feature #88)
   * Updates decision status to 'abandoned' with reason and optional note
   */
  static async abandonDecision(
    decisionId: string,
    userId: string,
    abandonReason: string,
    abandonNote?: string
  ) {
    try {
      // First verify the decision belongs to the user
      const { data: existingDecision, error: fetchError } = await supabase
        .from('decisions')
        .select('id, user_id, status')
        .eq('id', decisionId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (fetchError) {
        console.error('Error fetching decision for abandon:', fetchError);
        throw fetchError;
      }

      if (!existingDecision) {
        const error: any = new Error('Decision not found or unauthorized');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Check if already abandoned
      if (existingDecision.status === 'abandoned') {
        const error: any = new Error('Decision is already abandoned');
        error.code = 'CONFLICT';
        throw error;
      }

      // Update the decision
      const { data: updatedDecision, error: updateError } = await supabase
        .from('decisions')
        .update({
          status: 'abandoned',
          abandon_reason: abandonReason,
          abandon_note: abandonNote || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', decisionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error abandoning decision:', updateError);
        throw updateError;
      }

      return updatedDecision;
    } catch (error) {
      console.error('Error in abandonDecision:', error);
      throw error;
    }
  }
}
