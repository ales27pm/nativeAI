import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  SensorData, 
  VisionAnalysis, 
  AudioData, 
  AssistantContext, 
  AIResponse, 
  AutonomousTask, 
  ConversationMessage 
} from '../types/assistant';

interface AssistantState {
  // Core state
  isActive: boolean;
  currentMode: 'chat' | 'observe' | 'analyze' | 'autonomous';
  
  // Sensor data
  sensorData: SensorData;
  isCollectingSensors: boolean;
  
  // Vision and audio
  lastVisionAnalysis?: VisionAnalysis;
  lastAudioData?: AudioData;
  
  // Context and reasoning
  currentContext: AssistantContext;
  conversationHistory: ConversationMessage[];
  autonomousTasks: AutonomousTask[];
  
  // AI responses
  lastResponse?: AIResponse;
  isProcessing: boolean;
  
  // Actions
  setActive: (active: boolean) => void;
  setMode: (mode: 'chat' | 'observe' | 'analyze' | 'autonomous') => void;
  updateSensorData: (data: Partial<SensorData>) => void;
  toggleSensorCollection: () => void;
  updateVisionAnalysis: (analysis: VisionAnalysis) => void;
  updateAudioData: (audio: AudioData) => void;
  updateContext: (context: Partial<AssistantContext>) => void;
  addMessage: (message: ConversationMessage) => void;
  setProcessing: (processing: boolean) => void;
  setLastResponse: (response: AIResponse) => void;
  addAutonomousTask: (task: AutonomousTask) => void;
  updateTaskStatus: (taskId: string, status: AutonomousTask['status']) => void;
  clearOldMessages: () => void;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      currentMode: 'chat',
      sensorData: {},
      isCollectingSensors: false,
      currentContext: {
        timeOfDay: 'day',
        recentActivity: [],
        deviceState: {
          battery: 100,
          connectivity: 'wifi',
        },
        userPreferences: {
          preferredModel: 'openai',
          voiceEnabled: true,
          cameraEnabled: true,
          locationEnabled: true,
        },
      },
      conversationHistory: [],
      autonomousTasks: [],
      isProcessing: false,

      // Actions
      setActive: (active) => set({ isActive: active }),
      
      setMode: (mode) => set({ currentMode: mode }),
      
      updateSensorData: (data) => set((state) => ({
        sensorData: { ...state.sensorData, ...data }
      })),
      
      toggleSensorCollection: () => set((state) => ({
        isCollectingSensors: !state.isCollectingSensors
      })),
      
      updateVisionAnalysis: (analysis) => set({ lastVisionAnalysis: analysis }),
      
      updateAudioData: (audio) => set({ lastAudioData: audio }),
      
      updateContext: (context) => set((state) => ({
        currentContext: { ...state.currentContext, ...context }
      })),
      
      addMessage: (message) => set((state) => ({
        conversationHistory: [...state.conversationHistory.slice(-50), message]
      })),
      
      setProcessing: (processing) => set({ isProcessing: processing }),
      
      setLastResponse: (response) => set({ lastResponse: response }),
      
      addAutonomousTask: (task) => set((state) => ({
        autonomousTasks: [...state.autonomousTasks, task]
      })),
      
      updateTaskStatus: (taskId, status) => set((state) => ({
        autonomousTasks: state.autonomousTasks.map(task => 
          task.id === taskId ? { ...task, status } : task
        )
      })),
      
      clearOldMessages: () => set((state) => ({
        conversationHistory: state.conversationHistory.slice(-20)
      })),
    }),
    {
      name: 'assistant-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentContext: state.currentContext,
        conversationHistory: state.conversationHistory.slice(-10),
        autonomousTasks: state.autonomousTasks.filter(t => t.status !== 'completed'),
      }),
    }
  )
);