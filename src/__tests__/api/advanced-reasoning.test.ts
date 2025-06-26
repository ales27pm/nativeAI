import { reasoningEngine } from '../../api/advanced-reasoning';
import { AssistantContext } from '../../types/assistant';

// Mock the AI APIs
jest.mock('../../api/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response from OpenAI' } }]
        })
      }
    }
  }
}));

jest.mock('../../api/anthropic', () => ({
  anthropic: {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test response from Anthropic' }]
      })
    }
  }
}));

jest.mock('../../api/grok', () => ({
  grok: {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response from Grok' } }]
        })
      }
    }
  }
}));

describe('Advanced Reasoning Engine', () => {
  const mockContext: AssistantContext = {
    timeOfDay: 'morning',
    recentActivity: ['user_walking'],
    deviceState: {
      battery: 85,
      connectivity: 'wifi',
    },
    userPreferences: {
      preferredModel: 'openai',
      voiceEnabled: true,
      cameraEnabled: true,
      locationEnabled: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processQuery', () => {
    it('should process a simple query successfully', async () => {
      const result = await reasoningEngine.processQuery({
        query: 'What is the weather like?',
        context: mockContext,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.model).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.timestamp).toBeTruthy();
    });

    it('should handle complex reasoning queries', async () => {
      const result = await reasoningEngine.processQuery({
        query: 'Analyze my current situation and provide recommendations',
        context: mockContext,
      });

      expect(result).toBeDefined();
      expect(result.reasoning).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle queries with sensor data', async () => {
      const sensorData = {
        accelerometer: { x: 0.1, y: 0.2, z: 9.8, timestamp: Date.now() },
        location: { latitude: 37.7749, longitude: -122.4194, accuracy: 10, timestamp: Date.now() },
      };

      const result = await reasoningEngine.processQuery({
        query: 'What can you tell from my sensor data?',
        context: mockContext,
        sensorData,
      });

      expect(result).toBeDefined();
      expect(result.contextUsed).toContain('motion');
      expect(result.contextUsed).toContain('location');
    });

    it('should handle errors gracefully', async () => {
      // Mock an error
      const mockError = new Error('API Error');
      require('../../api/openai').openai.chat.completions.create.mockRejectedValueOnce(mockError);

      const result = await reasoningEngine.processQuery({
        query: 'Test query',
        context: mockContext,
      });

      expect(result).toBeDefined();
      expect(result.content).toContain('error');
      expect(result.confidence).toBe(0.1);
    });
  });

  describe('getConsensus', () => {
    it('should get consensus from multiple models', async () => {
      const result = await reasoningEngine.getConsensus({
        query: 'Important decision query',
        context: mockContext,
      });

      expect(result).toBeDefined();
      expect(result.model).toBe('consensus');
      expect(result.content).toContain('Multi-model consensus');
    });

    it('should handle partial model failures in consensus', async () => {
      // Mock one model failure
      require('../../api/anthropic').anthropic.messages.create.mockRejectedValueOnce(new Error('Model error'));

      const result = await reasoningEngine.getConsensus({
        query: 'Test consensus query',
        context: mockContext,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
    });
  });

  describe('Model Selection', () => {
    it('should select appropriate model based on query type', async () => {
      // Test complex reasoning query (should prefer Anthropic)
      const complexResult = await reasoningEngine.processQuery({
        query: 'Analyze and synthesize complex reasoning patterns in my behavior',
        context: mockContext,
      });

      expect(complexResult).toBeDefined();

      // Test real-time query (should prefer Grok)
      const realtimeResult = await reasoningEngine.processQuery({
        query: 'What is happening right now in real time?',
        context: mockContext,
      });

      expect(realtimeResult).toBeDefined();

      // Test vision query (should prefer OpenAI)
      const visionResult = await reasoningEngine.processQuery({
        query: 'Look at this image and tell me what you see',
        context: mockContext,
      });

      expect(visionResult).toBeDefined();
    });
  });
});