import { AssistantContext, SensorData, VisionAnalysis, AudioData } from '../types/assistant';
import { sensorManager } from './sensor-manager';
import { reasoningEngine } from './advanced-reasoning';

export interface ContextualInsight {
  id: string;
  type: 'observation' | 'prediction' | 'recommendation' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  confidence: number;
  timestamp: Date;
  actions?: string[];
  contextSources: string[];
}

export class ContextEngine {
  private contextHistory: AssistantContext[] = [];
  private insights: ContextualInsight[] = [];
  private isAnalyzing = false;

  constructor() {
    this.startContextMonitoring();
  }

  private startContextMonitoring(): void {
    // Monitor context changes every 30 seconds
    setInterval(() => {
      this.analyzeCurrentContext();
    }, 30000);
  }

  async updateContext(
    sensorData?: SensorData,
    visionData?: VisionAnalysis,
    audioData?: AudioData
  ): Promise<AssistantContext> {
    const now = new Date();
    const timeOfDay = this.getTimeOfDay(now);
    
    // Get current location from sensor data
    const currentLocation = sensorData?.location ? {
      latitude: sensorData.location.latitude,
      longitude: sensorData.location.longitude,
      address: sensorData.location.address,
    } : undefined;

    // Update recent activity based on inputs
    const recentActivity = this.extractRecentActivity(sensorData, visionData, audioData);

    // Update device state
    const deviceState = {
      battery: sensorData?.deviceInfo?.battery || 100,
      connectivity: sensorData?.deviceInfo?.connectivity || 'unknown',
      brightness: sensorData?.deviceInfo?.brightness,
    };

    const context: AssistantContext = {
      currentLocation,
      timeOfDay,
      recentActivity,
      deviceState,
      userPreferences: {
        preferredModel: 'openai',
        voiceEnabled: true,
        cameraEnabled: true,
        locationEnabled: true,
      },
    };

    // Store in history
    this.contextHistory.push(context);
    if (this.contextHistory.length > 100) {
      this.contextHistory = this.contextHistory.slice(-100);
    }

    return context;
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'late_night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private extractRecentActivity(
    sensorData?: SensorData,
    visionData?: VisionAnalysis,
    audioData?: AudioData
  ): string[] {
    const activities: string[] = [];

    // Motion-based activities
    if (sensorData?.accelerometer) {
      const motion = sensorManager.analyzeMotionPattern();
      if (motion !== 'unknown') {
        activities.push(`user_${motion}`);
      }
    }

    // Device orientation
    if (sensorData?.accelerometer) {
      const orientation = sensorManager.getDeviceOrientation();
      activities.push(`device_${orientation}`);
    }

    // Vision-based activities
    if (visionData) {
      activities.push('camera_used');
      if (visionData.objects.length > 0) {
        activities.push(`observed_${visionData.objects[0]}`);
      }
    }

    // Audio-based activities
    if (audioData) {
      activities.push('voice_interaction');
      if (audioData.transcription.length > 0) {
        activities.push('speech_detected');
      }
    }

    // Location-based activities
    if (sensorData?.location) {
      activities.push('location_tracked');
    }

    return activities.slice(-10); // Keep last 10 activities
  }

  async analyzeCurrentContext(): Promise<ContextualInsight[]> {
    if (this.isAnalyzing) return this.insights;
    
    this.isAnalyzing = true;
    
    try {
      const currentSensorData = sensorManager.getCurrentData();
      const currentContext = await this.updateContext(currentSensorData);
      
      const newInsights = await this.generateInsights(currentContext, currentSensorData);
      
      // Add new insights and keep only recent ones
      this.insights.push(...newInsights);
      this.insights = this.insights
        .filter(insight => Date.now() - insight.timestamp.getTime() < 3600000) // Keep insights for 1 hour
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50); // Keep max 50 insights

      return newInsights;
    } catch (error) {
      console.error('Context analysis error:', error);
      return [];
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async generateInsights(
    context: AssistantContext,
    sensorData: SensorData
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];

    // Battery level insights
    if (context.deviceState.battery < 20) {
      insights.push({
        id: `battery_low_${Date.now()}`,
        type: 'alert',
        priority: 'high',
        title: 'Low Battery Detected',
        description: `Device battery is at ${context.deviceState.battery}%. Consider charging soon.`,
        confidence: 0.95,
        timestamp: new Date(),
        actions: ['Find nearest charging location', 'Enable battery saver mode'],
        contextSources: ['device_state'],
      });
    }

    // Motion pattern insights
    const motionPattern = sensorManager.analyzeMotionPattern();
    if (motionPattern === 'stationary' && context.timeOfDay === 'afternoon') {
      insights.push({
        id: `stationary_afternoon_${Date.now()}`,
        type: 'recommendation',
        priority: 'medium',
        title: 'Afternoon Activity Suggestion',
        description: 'You have been stationary for a while during the afternoon. Consider taking a short walk or stretch break.',
        confidence: 0.7,
        timestamp: new Date(),
        actions: ['Take a 5-minute walk', 'Do desk stretches', 'Set movement reminder'],
        contextSources: ['motion', 'time'],
      });
    }

    // Location-based insights
    if (sensorData.location && context.timeOfDay === 'evening') {
      insights.push({
        id: `location_evening_${Date.now()}`,
        type: 'observation',
        priority: 'low',
        title: 'Evening Location Check',
        description: `Currently located at coordinates ${sensorData.location.latitude.toFixed(4)}, ${sensorData.location.longitude.toFixed(4)} in the evening.`,
        confidence: 0.9,
        timestamp: new Date(),
        contextSources: ['location', 'time'],
      });
    }

    // Connectivity insights
    if (context.deviceState.connectivity === 'offline') {
      insights.push({
        id: `offline_${Date.now()}`,
        type: 'alert',
        priority: 'medium',
        title: 'Device Offline',
        description: 'No network connectivity detected. Some features may be limited.',
        confidence: 0.95,
        timestamp: new Date(),
        actions: ['Check WiFi settings', 'Enable mobile data', 'Find network'],
        contextSources: ['connectivity'],
      });
    }

    // Pattern recognition from history
    const patterns = this.analyzeContextPatterns();
    insights.push(...patterns);

    return insights;
  }

  private analyzeContextPatterns(): ContextualInsight[] {
    const insights: ContextualInsight[] = [];
    
    if (this.contextHistory.length < 10) return insights;

    // Analyze recent battery drain pattern
    const recentContexts = this.contextHistory.slice(-10);
    const batteryLevels = recentContexts.map(c => c.deviceState.battery);
    const batteryDrain = batteryLevels[0] - batteryLevels[batteryLevels.length - 1];
    
    if (batteryDrain > 20) {
      insights.push({
        id: `battery_drain_pattern_${Date.now()}`,
        type: 'observation',
        priority: 'medium',
        title: 'High Battery Drain Detected',
        description: `Battery drained ${batteryDrain}% in recent activity. Consider checking for power-hungry apps.`,
        confidence: 0.8,
        timestamp: new Date(),
        actions: ['Check battery usage', 'Close background apps', 'Enable power saving'],
        contextSources: ['battery_history'],
      });
    }

    // Analyze location stability pattern
    const locations = recentContexts
      .map(c => c.currentLocation)
      .filter(Boolean);
    
    if (locations.length > 5) {
      const locationChanges = locations.length - 1;
      if (locationChanges === 0) {
        insights.push({
          id: `location_stable_${Date.now()}`,
          type: 'observation',
          priority: 'low',
          title: 'Stable Location Detected',
          description: 'You have been in the same location for an extended period.',
          confidence: 0.9,
          timestamp: new Date(),
          contextSources: ['location_history'],
        });
      }
    }

    return insights;
  }

  async generateProactiveRecommendations(
    context: AssistantContext,
    sensorData: SensorData
  ): Promise<string[]> {
    try {
      const query = `Based on the current context and sensor data, provide 3 proactive recommendations for the user:
      
Context:
- Time: ${context.timeOfDay}
- Location: ${context.currentLocation ? 'Available' : 'Unknown'}
- Recent Activity: ${context.recentActivity.join(', ')}
- Battery: ${context.deviceState.battery}%
- Motion: ${sensorManager.analyzeMotionPattern()}
- Device Orientation: ${sensorManager.getDeviceOrientation()}

Provide practical, actionable recommendations based on this context.`;

      const response = await reasoningEngine.processQuery({
        query,
        context,
        sensorData,
      });

      return response.actions || [];
    } catch (error) {
      console.error('Proactive recommendations error:', error);
      return [];
    }
  }

  // Context prediction
  async predictNextContext(timeMinutes: number = 30): Promise<{
    predictedContext: Partial<AssistantContext>;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const query = `Based on the context history and current patterns, predict what the user's context might be in ${timeMinutes} minutes:

Recent patterns:
${this.contextHistory.slice(-5).map((c, i) => `
${i + 1}. Time: ${c.timeOfDay}, Activity: ${c.recentActivity.join(', ')}, Battery: ${c.deviceState.battery}%
`).join('')}

Provide a prediction with reasoning.`;

      const currentContext = this.contextHistory[this.contextHistory.length - 1];
      const response = await reasoningEngine.processQuery({
        query,
        context: currentContext,
      });

      // Extract prediction from response
      const batteryPrediction = Math.max(0, currentContext.deviceState.battery - (timeMinutes / 60) * 5); // Rough battery drain estimate
      
      return {
        predictedContext: {
          deviceState: {
            ...currentContext.deviceState,
            battery: batteryPrediction,
          },
          timeOfDay: this.predictTimeOfDay(timeMinutes),
        },
        confidence: response.confidence,
        reasoning: response.reasoning,
      };
    } catch (error) {
      console.error('Context prediction error:', error);
      return {
        predictedContext: {},
        confidence: 0.1,
        reasoning: 'Prediction failed due to error',
      };
    }
  }

  private predictTimeOfDay(minutesFromNow: number): string {
    const futureTime = new Date(Date.now() + minutesFromNow * 60000);
    return this.getTimeOfDay(futureTime);
  }

  // Getters
  getCurrentInsights(): ContextualInsight[] {
    return this.insights;
  }

  getContextHistory(): AssistantContext[] {
    return this.contextHistory;
  }

  getHighPriorityInsights(): ContextualInsight[] {
    return this.insights.filter(insight => 
      insight.priority === 'high' || insight.priority === 'urgent'
    );
  }

  // Context querying
  hasRecentActivity(activity: string, minutesBack: number = 30): boolean {
    const recentContexts = this.contextHistory.filter(context => 
      Date.now() - new Date().getTime() < minutesBack * 60000
    );
    
    return recentContexts.some(context => 
      context.recentActivity.includes(activity)
    );
  }

  getContextSummary(): string {
    const current = this.contextHistory[this.contextHistory.length - 1];
    if (!current) return 'No context available';

    const highPriorityInsights = this.getHighPriorityInsights();
    const motionPattern = sensorManager.analyzeMotionPattern();
    
    return `Current Context Summary:
- Time: ${current.timeOfDay}
- Motion: ${motionPattern}
- Battery: ${current.deviceState.battery}%
- Connectivity: ${current.deviceState.connectivity}
- Recent Activity: ${current.recentActivity.slice(-3).join(', ')}
- High Priority Alerts: ${highPriorityInsights.length}
${highPriorityInsights.length > 0 ? '- Alert: ' + highPriorityInsights[0].title : ''}`;
  }
}

export const contextEngine = new ContextEngine();