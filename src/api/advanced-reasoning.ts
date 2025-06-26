import { openai } from './openai';
import { anthropic } from './anthropic';
import { grok } from './grok';
import { AssistantContext, SensorData, VisionAnalysis, AudioData, AIResponse } from '../types/assistant';

interface ReasoningInput {
  query: string;
  context: AssistantContext;
  sensorData?: SensorData;
  visionData?: VisionAnalysis;
  audioData?: AudioData;
  conversationHistory?: Array<{role: 'user' | 'assistant'; content: string}>;
}

interface ModelCapabilities {
  reasoning: number;
  vision: boolean;
  codeGeneration: number;
  realTimeData: boolean;
  contextWindow: number;
}

const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'openai': {
    reasoning: 9,
    vision: true,
    codeGeneration: 8,
    realTimeData: false,
    contextWindow: 128000
  },
  'anthropic': {
    reasoning: 10,
    vision: true,
    codeGeneration: 9,
    realTimeData: false,
    contextWindow: 200000
  },
  'grok': {
    reasoning: 8,
    vision: true,
    codeGeneration: 7,
    realTimeData: true,
    contextWindow: 131072
  }
};

class AdvancedReasoningEngine {
  private selectOptimalModel(input: ReasoningInput): 'openai' | 'anthropic' | 'grok' {
    const { query, context, sensorData, visionData } = input;
    
    // Analyze query complexity
    const hasComplexReasoning = /analyze|compare|synthesize|deduce|infer|reasoning|logic|problem/i.test(query);
    const hasVisionRequest = visionData || /image|photo|visual|see|look|camera/i.test(query);
    const hasRealTimeRequest = /current|now|live|real.time|latest/i.test(query);
    const hasCodeRequest = /code|program|script|function|algorithm/i.test(query);
    
    // Scoring system
    let scores = {
      openai: 0,
      anthropic: 0,
      grok: 0
    };
    
    // Prefer user's preferred model as baseline
    scores[context.userPreferences.preferredModel] += 2;
    
    // Complex reasoning favors Anthropic
    if (hasComplexReasoning) {
      scores.anthropic += 3;
      scores.openai += 2;
      scores.grok += 1;
    }
    
    // Vision capabilities
    if (hasVisionRequest) {
      scores.openai += 2;
      scores.anthropic += 2;
      scores.grok += 1;
    }
    
    // Real-time data favors Grok
    if (hasRealTimeRequest) {
      scores.grok += 3;
    }
    
    // Code generation
    if (hasCodeRequest) {
      scores.anthropic += 3;
      scores.openai += 2;
      scores.grok += 1;
    }
    
    // Context size considerations
    const contextSize = JSON.stringify(input).length;
    if (contextSize > 50000) {
      scores.anthropic += 2; // Largest context window
    }
    
    // Return highest scoring model
    const bestModel = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
    )[0] as 'openai' | 'anthropic' | 'grok';
    
    return bestModel;
  }

  private buildSystemPrompt(context: AssistantContext, sensorData?: SensorData): string {
    const now = new Date();
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
    
    let systemPrompt = `You are ARIA (Advanced Reasoning Intelligence Assistant), an autonomous AI assistant with access to real-time device sensors, vision, and contextual data. You have advanced reasoning capabilities and can take autonomous actions.

CURRENT CONTEXT:
- Time: ${now.toLocaleString()} (${timeOfDay})
- Location: ${context.currentLocation ? `${context.currentLocation.latitude}, ${context.currentLocation.longitude}` : 'Unknown'}
- Device Battery: ${context.deviceState.battery}%
- Connectivity: ${context.deviceState.connectivity}
- Recent Activity: ${context.recentActivity.join(', ') || 'None'}

CAPABILITIES:
- Advanced logical reasoning and problem solving
- Real-time sensor data analysis
- Computer vision and image understanding
- Voice processing and natural language understanding
- Contextual awareness and memory
- Autonomous task execution
- Multi-modal data synthesis

SENSOR DATA AVAILABLE:`;

    if (sensorData?.accelerometer) {
      systemPrompt += `\n- Motion: X:${sensorData.accelerometer.x.toFixed(2)}, Y:${sensorData.accelerometer.y.toFixed(2)}, Z:${sensorData.accelerometer.z.toFixed(2)}`;
    }
    
    if (sensorData?.location) {
      systemPrompt += `\n- Precise Location: ${sensorData.location.latitude}, ${sensorData.location.longitude} (±${sensorData.location.accuracy}m)`;
    }
    
    if (sensorData?.deviceInfo) {
      systemPrompt += `\n- Device State: Battery ${sensorData.deviceInfo.battery}%, Orientation: ${sensorData.deviceInfo.orientation}`;
    }

    systemPrompt += `\n\nRULES:
1. Always provide reasoning for your responses
2. Use available sensor and contextual data to inform decisions
3. Be proactive in suggesting actions or observations
4. Consider user's safety and privacy
5. Adapt your communication style to the context
6. When possible, predict user needs based on patterns
7. Provide confidence levels for your assessments

RESPONSE FORMAT:
Always structure responses with:
- Main response content
- Reasoning explanation
- Suggested actions (if any)
- Confidence assessment`;

    return systemPrompt;
  }

  private async callOpenAI(input: ReasoningInput): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(input.context, input.sensorData);
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(input.conversationHistory || []),
      { role: 'user' as const, content: input.query }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      content,
      reasoning: this.extractReasoning(content),
      actions: this.extractActions(content),
      confidence: this.assessConfidence(content),
      model: 'openai',
      timestamp: Date.now(),
      contextUsed: this.getContextUsed(input)
    };
  }

  private async callAnthropic(input: ReasoningInput): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(input.context, input.sensorData);
    
    const messages = [
      ...(input.conversationHistory || []),
      { role: 'user' as const, content: input.query }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    return {
      content,
      reasoning: this.extractReasoning(content),
      actions: this.extractActions(content),
      confidence: this.assessConfidence(content),
      model: 'anthropic',
      timestamp: Date.now(),
      contextUsed: this.getContextUsed(input)
    };
  }

  private async callGrok(input: ReasoningInput): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(input.context, input.sensorData);
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(input.conversationHistory || []),
      { role: 'user' as const, content: input.query }
    ];

    const response = await grok.chat.completions.create({
      model: 'grok-beta',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      content,
      reasoning: this.extractReasoning(content),
      actions: this.extractActions(content),
      confidence: this.assessConfidence(content),
      model: 'grok',
      timestamp: Date.now(),
      contextUsed: this.getContextUsed(input)
    };
  }

  private extractReasoning(content: string): string {
    // Extract reasoning from structured response
    const reasoningMatch = content.match(/(?:reasoning|because|due to|analysis):?\s*([^\\n]+)/i);
    return reasoningMatch?.[1] || 'Direct response based on available context';
  }

  private extractActions(content: string): string[] {
    // Extract suggested actions
    const actionMatches = content.match(/(?:actions?|suggestions?|recommendations?):?\s*(.*?)(?=\\n\\n|\n\n|$)/is);
    if (!actionMatches) return [];
    
    return actionMatches[1]
      .split(/\n|,|\d+\./)
      .filter(action => action.trim().length > 0)
      .map(action => action.trim().replace(/^[-•\*]\s*/, ''));
  }

  private assessConfidence(content: string): number {
    // Assess confidence based on language used
    const uncertaintyWords = ['might', 'could', 'possibly', 'perhaps', 'maybe', 'uncertain'];
    const confidenceWords = ['definitely', 'certainly', 'clearly', 'obviously', 'confirmed'];
    
    const uncertaintyCount = uncertaintyWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
    const confidenceCount = confidenceWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
    
    // Base confidence of 0.7, adjusted by language
    let confidence = 0.7;
    confidence += (confidenceCount * 0.05);
    confidence -= (uncertaintyCount * 0.05);
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private getContextUsed(input: ReasoningInput): string[] {
    const contextUsed = [];
    
    if (input.sensorData?.accelerometer) contextUsed.push('motion');
    if (input.sensorData?.location) contextUsed.push('location');
    if (input.sensorData?.deviceInfo) contextUsed.push('device_state');
    if (input.visionData) contextUsed.push('vision');
    if (input.audioData) contextUsed.push('audio');
    if (input.conversationHistory?.length) contextUsed.push('conversation_history');
    
    return contextUsed;
  }

  async processQuery(input: ReasoningInput): Promise<AIResponse> {
    try {
      const selectedModel = this.selectOptimalModel(input);
      
      console.log(`ARIA: Selected ${selectedModel} for query analysis`);
      
      switch (selectedModel) {
        case 'openai':
          return await this.callOpenAI(input);
        case 'anthropic':
          return await this.callAnthropic(input);
        case 'grok':
          return await this.callGrok(input);
        default:
          return await this.callOpenAI(input);
      }
    } catch (error) {
      console.error('Reasoning engine error:', error);
      
      // Fallback response
      return {
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        reasoning: 'Error occurred during model inference',
        confidence: 0.1,
        model: 'error',
        timestamp: Date.now(),
        contextUsed: []
      };
    }
  }

  // Multi-model consensus for critical decisions
  async getConsensus(input: ReasoningInput): Promise<AIResponse> {
    try {
      console.log('ARIA: Getting multi-model consensus...');
      
      const [openaiResponse, anthropicResponse, grokResponse] = await Promise.allSettled([
        this.callOpenAI(input),
        this.callAnthropic(input),
        this.callGrok(input)
      ]);

      const responses = [
        openaiResponse.status === 'fulfilled' ? openaiResponse.value : null,
        anthropicResponse.status === 'fulfilled' ? anthropicResponse.value : null,
        grokResponse.status === 'fulfilled' ? grokResponse.value : null
      ].filter(Boolean) as AIResponse[];

      if (responses.length === 0) {
        throw new Error('All models failed to respond');
      }

      // Combine responses for consensus
      const combinedContent = responses.map((r, i) => 
        `Model ${i + 1} (${r.model}): ${r.content}`
      ).join('\n\n');

      const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
      
      const allActions = responses.flatMap(r => r.actions || []);
      const uniqueActions = [...new Set(allActions)];

      return {
        content: `Multi-model consensus analysis:\n\n${combinedContent}`,
        reasoning: 'Combined reasoning from multiple AI models for enhanced accuracy',
        actions: uniqueActions,
        confidence: avgConfidence,
        model: 'consensus',
        timestamp: Date.now(),
        contextUsed: this.getContextUsed(input)
      };
    } catch (error) {
      console.error('Consensus error:', error);
      // Fall back to single model
      return this.processQuery(input);
    }
  }
}

export const reasoningEngine = new AdvancedReasoningEngine();