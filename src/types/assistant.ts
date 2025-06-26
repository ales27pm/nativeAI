export interface SensorData {
  accelerometer?: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  gyroscope?: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  magnetometer?: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    address?: string;
  };
  deviceInfo?: {
    battery: number;
    brightness?: number;
    orientation: string;
    connectivity: string;
  };
}

export interface VisionAnalysis {
  description: string;
  objects: string[];
  text?: string;
  emotions?: string[];
  scene: string;
  confidence: number;
  timestamp: number;
}

export interface AudioData {
  transcription: string;
  confidence: number;
  duration: number;
  timestamp: number;
  language?: string;
}

export interface AssistantContext {
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timeOfDay: string;
  recentActivity: string[];
  deviceState: {
    battery: number;
    connectivity: string;
    brightness?: number;
  };
  userPreferences: {
    preferredModel: 'openai' | 'anthropic' | 'grok';
    voiceEnabled: boolean;
    cameraEnabled: boolean;
    locationEnabled: boolean;
  };
}

export interface AIResponse {
  content: string;
  reasoning: string;
  actions?: string[];
  confidence: number;
  model: string;
  timestamp: number;
  contextUsed: string[];
}

export interface AutonomousTask {
  id: string;
  type: 'reminder' | 'analysis' | 'action' | 'observation';
  title: string;
  description: string;
  scheduledFor?: Date;
  context: AssistantContext;
  status: 'pending' | 'active' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sensorData?: SensorData;
    visionData?: VisionAnalysis;
    audioData?: AudioData;
    context?: AssistantContext;
  };
}