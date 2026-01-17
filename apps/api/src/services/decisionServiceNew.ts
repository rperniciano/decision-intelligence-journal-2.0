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
   * Get all decisions for a user with their options, pros/cons, and category
   */
  static async getDecisions(userId: string, filters?: {
    status?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
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

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

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
        decidedAt: data.decided_at,
        options: (data.options || []).map((opt: any) => ({
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
              title: opt.text || opt.title,
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
   * Update a decision
   */
  static async updateDecision(decisionId: string, userId: string, dto: any) {
    try {
      // First verify the decision belongs to the user
      const { data: existing, error: fetchError } = await supabase
        .from('decisions')
        .select('id')
        .eq('id', decisionId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (fetchError || !existing) {
        return null;
      }

      // Prepare update data
      const updateData: any = {};

      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.detected_emotional_state !== undefined) updateData.detected_emotional_state = dto.detected_emotional_state;
      if (dto.category_id !== undefined) updateData.category_id = dto.category_id;

      // Update the decision
      const { data: updated, error: updateError } = await supabase
        .from('decisions')
        .update(updateData)
        .eq('id', decisionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Return the complete decision with all relations
      return await this.getDecisionById(decisionId, userId);
    } catch (error) {
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

      const { data, error, count } = await query;

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
}
