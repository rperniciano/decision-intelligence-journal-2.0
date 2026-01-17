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
}

export class DecisionService {
  /**
   * Get all decisions for a user
   */
  static async getDecisions(userId: string, filters?: {
    status?: Decision['status'];
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('decisions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      decisions: data || [],
      total: count || 0,
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
          .map(pc => pc.content);

        const cons = (prosCons || [])
          .filter(pc => pc.type === 'con')
          .map(pc => pc.content);

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
   * Update a decision
   */
  static async updateDecision(
    decisionId: string,
    userId: string,
    dto: UpdateDecisionDTO
  ) {
    const { data, error } = await supabase
      .from('decisions')
      .update(dto)
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
   */
  static async updateOptionChosen(
    decisionId: string,
    userId: string,
    optionId: string
  ) {
    const decision = await this.getDecisionById(decisionId, userId);
    if (!decision) return null;

    const updatedOptions = decision.options.map((opt: DecisionOption) => ({
      ...opt,
      isChosen: opt.id === optionId,
    }));

    return await this.updateDecision(decisionId, userId, {
      options: updatedOptions,
      status: 'decided',
      decided_at: new Date().toISOString(),
    });
  }
}
