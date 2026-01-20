import { AssemblyAI } from 'assemblyai';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  duration: number;
}

export interface ExtractionResult {
  title: string;
  options: Array<{
    name: string;
    pros: string[];
    cons: string[];
  }>;
  emotionalState: string;
  suggestedCategory: string | null;
  confidence: number;
}

export class VoiceService {
  /**
   * Upload audio file to Supabase Storage
   */
  static async uploadAudio(
    userId: string,
    audioBuffer: Buffer,
    filename: string
  ): Promise<{ url: string; path: string }> {
    const timestamp = Date.now();
    const path = `${userId}/${timestamp}-${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('audio-recordings')
      .upload(path, audioBuffer, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  }

  /**
   * Transcribe audio using AssemblyAI
   */
  static async transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
    try {
      // Start transcription
      const transcript = await assemblyai.transcripts.transcribe({
        audio_url: audioUrl,
      });

      if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      return {
        transcript: transcript.text || '',
        confidence: transcript.confidence || 0,
        duration: (transcript.audio_duration || 0) / 1000, // Convert to seconds
      };
    } catch (error) {
      throw new Error(`AssemblyAI transcription error: ${(error as Error).message}`);
    }
  }

  /**
   * Extract decision data using OpenAI GPT-4
   * Returns partial results with low confidence if extraction fails
   */
  static async extractDecisionData(transcript: string): Promise<ExtractionResult> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts structured decision data from voice transcripts.
Extract the following information:
- title: A clear, concise title for the decision (max 100 chars)
- options: Array of options being considered (each with name, pros array, cons array)
- emotionalState: One of: calm, confident, anxious, excited, uncertain, stressed, neutral, hopeful, frustrated
- suggestedCategory: Business, Health, Relationships, Career, Finance, Education, Lifestyle, or null

Return ONLY valid JSON matching this structure:
{
  "title": "string",
  "options": [{"name": "string", "pros": ["string"], "cons": ["string"]}],
  "emotionalState": "calm|confident|anxious|excited|uncertain|stressed|neutral|hopeful|frustrated",
  "suggestedCategory": "Business|Health|Relationships|Career|Finance|Education|Lifestyle|null",
  "confidence": 0.0-1.0
}

If the transcript is unclear or incomplete, still extract what you can but set a lower confidence score.
Confidence scoring:
- 0.9-1.0: Very clear transcript with all required information
- 0.7-0.9: Clear transcript with most information
- 0.5-0.7: Unclear or incomplete transcript, some information missing
- 0.3-0.5: Very unclear or minimal information
- 0.0-0.3: Almost no useful information`,
          },
          {
            role: 'user',
            content: `Extract decision data from this transcript:\n\n${transcript}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const extracted = JSON.parse(content);

      // Validate and normalize the extracted data
      const confidence = typeof extracted.confidence === 'number' ? extracted.confidence : 0.5;

      // Ensure we have at least minimal data
      const options = Array.isArray(extracted.options) && extracted.options.length > 0
        ? extracted.options
        : [{ name: 'Option 1', pros: [], cons: [] }];

      return {
        title: extracted.title || 'Untitled Decision',
        options,
        emotionalState: extracted.emotionalState || 'neutral',
        suggestedCategory: extracted.suggestedCategory || null,
        confidence,
      };
    } catch (error) {
      // Return partial result with low confidence instead of throwing
      console.error('Extraction error, returning partial result:', error);
      return {
        title: 'Untitled Decision',
        options: [{ name: 'Option 1', pros: [], cons: [] }],
        emotionalState: 'neutral',
        suggestedCategory: null,
        confidence: 0.2, // Very low confidence indicating extraction failed
      };
    }
  }

  /**
   * Complete voice-to-decision pipeline
   */
  static async processVoiceRecording(
    userId: string,
    audioBuffer: Buffer,
    filename: string
  ): Promise<{
    audioUrl: string;
    transcript: string;
    extraction: ExtractionResult;
    duration: number;
  }> {
    // Step 1: Upload audio
    const { url: audioUrl } = await this.uploadAudio(userId, audioBuffer, filename);

    // Step 2: Transcribe
    const transcriptionResult = await this.transcribeAudio(audioUrl);

    // Step 3: Extract decision data
    const extraction = await this.extractDecisionData(transcriptionResult.transcript);

    return {
      audioUrl,
      transcript: transcriptionResult.transcript,
      extraction,
      duration: transcriptionResult.duration,
    };
  }
}
