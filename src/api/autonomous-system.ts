import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { AutonomousTask, AssistantContext, SensorData } from '../types/assistant';
import { contextEngine } from './context-engine';
import { reasoningEngine } from './advanced-reasoning';
import { audioSystem } from './audio-system';
import { visionSystem } from './vision-system';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BACKGROUND_TASK = 'ARIA_BACKGROUND_TASK';

export class AutonomousSystem {
  private activeTasks: Map<string, AutonomousTask> = new Map();
  private isActive = false;
  private backgroundTaskRegistered = false;

  constructor() {
    this.setupNotifications();
    this.setupBackgroundTasks();
  }

  private async setupNotifications(): Promise<void> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      console.log('ARIA: Notifications configured');
    } catch (error) {
      console.error('Notification setup error:', error);
    }
  }

  private async setupBackgroundTasks(): Promise<void> {
    try {
      // Define background task
      TaskManager.defineTask(BACKGROUND_TASK, async () => {
        try {
          console.log('ARIA: Background task executing...');
          await this.executeBackgroundAnalysis();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background task error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register background fetch
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.backgroundTaskRegistered = true;
      console.log('ARIA: Background tasks configured');
    } catch (error) {
      console.error('Background task setup error:', error);
    }
  }

  async startAutonomousMode(): Promise<void> {
    if (this.isActive) {
      console.log('ARIA: Autonomous mode already active');
      return;
    }

    console.log('ARIA: Starting autonomous mode...');
    this.isActive = true;

    // Create initial autonomous tasks
    await this.createInitialTasks();

    // Start continuous monitoring
    this.startContinuousMonitoring();

    // Send activation notification
    await this.sendNotification(
      'ARIA Activated',
      'Autonomous reasoning and assistance is now active',
      { priority: 'normal' }
    );
  }

  async stopAutonomousMode(): Promise<void> {
    if (!this.isActive) return;

    console.log('ARIA: Stopping autonomous mode...');
    this.isActive = false;

    // Cancel all pending tasks
    for (const task of this.activeTasks.values()) {
      if (task.status === 'pending') {
        await this.updateTaskStatus(task.id, 'cancelled');
      }
    }

    await this.sendNotification(
      'ARIA Deactivated',
      'Autonomous mode has been stopped',
      { priority: 'normal' }
    );
  }

  private async createInitialTasks(): Promise<void> {
    const now = new Date();
    
    // Context monitoring task
    const contextTask: AutonomousTask = {
      id: `context_monitor_${Date.now()}`,
      type: 'observation',
      title: 'Context Monitoring',
      description: 'Continuously monitor user context and environment for insights',
      context: await contextEngine.updateContext(),
      status: 'active',
      priority: 'medium',
      createdAt: now,
    };

    // Daily summary task
    const summaryTime = new Date();
    summaryTime.setHours(20, 0, 0, 0); // 8 PM daily summary
    if (summaryTime <= now) {
      summaryTime.setDate(summaryTime.getDate() + 1);
    }

    const summaryTask: AutonomousTask = {
      id: `daily_summary_${Date.now()}`,
      type: 'analysis',
      title: 'Daily Summary',
      description: 'Generate daily activity and insights summary',
      scheduledFor: summaryTime,
      context: await contextEngine.updateContext(),
      status: 'pending',
      priority: 'low',
      createdAt: now,
    };

    // Proactive wellness check
    const wellnessTask: AutonomousTask = {
      id: `wellness_check_${Date.now()}`,
      type: 'reminder',
      title: 'Wellness Check',
      description: 'Proactive wellness and activity recommendations',
      context: await contextEngine.updateContext(),
      status: 'pending',
      priority: 'medium',
      createdAt: now,
    };

    this.activeTasks.set(contextTask.id, contextTask);
    this.activeTasks.set(summaryTask.id, summaryTask);
    this.activeTasks.set(wellnessTask.id, wellnessTask);

    console.log('ARIA: Initial autonomous tasks created');
  }

  private startContinuousMonitoring(): void {
    // Monitor every 5 minutes when active
    const monitoringInterval = setInterval(async () => {
      if (!this.isActive) {
        clearInterval(monitoringInterval);
        return;
      }

      await this.executeAutonomousAnalysis();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async executeAutonomousAnalysis(): Promise<void> {
    try {
      console.log('ARIA: Executing autonomous analysis...');

      // Get current context and insights
      const insights = await contextEngine.analyzeCurrentContext();
      
      // Process high-priority insights
      const urgentInsights = insights.filter(i => i.priority === 'urgent' || i.priority === 'high');
      
      for (const insight of urgentInsights) {
        await this.handleUrgentInsight(insight);
      }

      // Generate proactive recommendations
      const context = contextEngine.getContextHistory().slice(-1)[0];
      if (context) {
        const recommendations = await contextEngine.generateProactiveRecommendations(
          context,
          {} // Would pass actual sensor data
        );

        if (recommendations.length > 0) {
          await this.createRecommendationTask(recommendations, context);
        }
      }

      // Check scheduled tasks
      await this.processScheduledTasks();

    } catch (error) {
      console.error('Autonomous analysis error:', error);
    }
  }

  private async executeBackgroundAnalysis(): Promise<void> {
    try {
      console.log('ARIA: Background analysis executing...');
      
      // Lightweight background analysis
      const insights = await contextEngine.analyzeCurrentContext();
      const urgentInsights = insights.filter(i => i.priority === 'urgent');
      
      // Only send notifications for urgent insights in background
      for (const insight of urgentInsights) {
        await this.sendNotification(
          insight.title,
          insight.description,
          { priority: 'high', data: insight }
        );
      }
    } catch (error) {
      console.error('Background analysis error:', error);
    }
  }

  private async handleUrgentInsight(insight: any): Promise<void> {
    console.log('ARIA: Handling urgent insight:', insight.title);

    // Send immediate notification
    await this.sendNotification(
      `⚠️ ${insight.title}`,
      insight.description,
      { 
        priority: 'high',
        data: insight,
        actions: insight.actions?.slice(0, 2).map((action: string, index: number) => ({
          id: `action_${index}`,
          title: action,
        }))
      }
    );

    // Create autonomous task to handle this insight
    const task: AutonomousTask = {
      id: `urgent_${insight.id}`,
      type: 'action',
      title: `Handle: ${insight.title}`,
      description: `Autonomous response to urgent insight: ${insight.description}`,
      context: contextEngine.getContextHistory().slice(-1)[0],
      status: 'active',
      priority: 'urgent',
      createdAt: new Date(),
    };

    this.activeTasks.set(task.id, task);

    // Execute immediate autonomous actions if safe
    if (insight.actions && insight.actions.length > 0) {
      await this.executeAutonomousActions(insight.actions, insight);
    }
  }

  private async createRecommendationTask(
    recommendations: string[],
    context: AssistantContext
  ): Promise<void> {
    const task: AutonomousTask = {
      id: `recommendations_${Date.now()}`,
      type: 'reminder',
      title: 'AI Recommendations',
      description: `Based on your current context, I have ${recommendations.length} suggestions for you.`,
      context,
      status: 'pending',
      priority: 'low',
      createdAt: new Date(),
    };

    this.activeTasks.set(task.id, task);

    // Send recommendation notification
    await this.sendNotification(
      '🤖 ARIA Recommendations',
      `I have ${recommendations.length} personalized suggestions based on your current context.`,
      {
        priority: 'normal',
        data: { recommendations, taskId: task.id }
      }
    );
  }

  private async processScheduledTasks(): Promise<void> {
    const now = new Date();
    
    for (const task of this.activeTasks.values()) {
      if (task.status === 'pending' && task.scheduledFor && task.scheduledFor <= now) {
        console.log('ARIA: Processing scheduled task:', task.title);
        await this.executeTask(task);
      }
    }
  }

  private async executeTask(task: AutonomousTask): Promise<void> {
    try {
      await this.updateTaskStatus(task.id, 'active');

      switch (task.type) {
        case 'analysis':
          await this.executeAnalysisTask(task);
          break;
        case 'reminder':
          await this.executeReminderTask(task);
          break;
        case 'action':
          await this.executeActionTask(task);
          break;
        case 'observation':
          await this.executeObservationTask(task);
          break;
      }

      await this.updateTaskStatus(task.id, 'completed');
    } catch (error) {
      console.error('Task execution error:', error);
      await this.updateTaskStatus(task.id, 'failed');
    }
  }

  private async executeAnalysisTask(task: AutonomousTask): Promise<void> {
    if (task.title.includes('Daily Summary')) {
      const summary = await this.generateDailySummary();
      
      await this.sendNotification(
        '📊 Daily Summary Ready',
        'Your personalized daily analysis and insights are ready.',
        {
          priority: 'normal',
          data: { summary, type: 'daily_summary' }
        }
      );
    }
  }

  private async executeReminderTask(task: AutonomousTask): Promise<void> {
    await this.sendNotification(
      `⏰ ${task.title}`,
      task.description,
      { priority: 'normal', data: task }
    );
  }

  private async executeActionTask(task: AutonomousTask): Promise<void> {
    // Execute autonomous actions based on task context
    console.log('ARIA: Executing autonomous action task:', task.title);
    
    // This would implement specific autonomous actions
    // For now, just notify about the action
    await this.sendNotification(
      `🔄 ${task.title}`,
      `Autonomous action completed: ${task.description}`,
      { priority: 'normal' }
    );
  }

  private async executeObservationTask(task: AutonomousTask): Promise<void> {
    // Continuous observation tasks
    if (task.title.includes('Context Monitoring')) {
      // This task runs continuously, just update status
      console.log('ARIA: Context monitoring active');
    }
  }

  private async executeAutonomousActions(actions: string[], context: any): Promise<void> {
    for (const action of actions.slice(0, 2)) { // Limit to 2 actions for safety
      try {
        console.log('ARIA: Executing autonomous action:', action);

        // Safe autonomous actions only
        if (action.toLowerCase().includes('reminder')) {
          await this.createReminder(action, context);
        } else if (action.toLowerCase().includes('notification')) {
          await this.sendContextualNotification(action, context);
        } else if (action.toLowerCase().includes('analyze')) {
          await this.scheduleAnalysis(action);
        }
        // Add more safe autonomous actions as needed
        
      } catch (error) {
        console.error('Autonomous action error:', error);
      }
    }
  }

  private async createReminder(action: string, context: any): Promise<void> {
    const reminderTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 ARIA Reminder',
        body: action,
        data: { type: 'autonomous_reminder', context },
      },
      trigger: { seconds: 30 * 60 }, // 30 minutes
    });
  }

  private async sendContextualNotification(action: string, context: any): Promise<void> {
    await this.sendNotification(
      '🤖 ARIA Alert',
      action,
      { priority: 'normal', data: context }
    );
  }

  private async scheduleAnalysis(action: string): Promise<void> {
    const analysisTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    const task: AutonomousTask = {
      id: `scheduled_analysis_${Date.now()}`,
      type: 'analysis',
      title: 'Scheduled Analysis',
      description: action,
      scheduledFor: analysisTime,
      context: contextEngine.getContextHistory().slice(-1)[0],
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(),
    };

    this.activeTasks.set(task.id, task);
  }

  private async generateDailySummary(): Promise<string> {
    try {
      const contextHistory = contextEngine.getContextHistory();
      const insights = contextEngine.getCurrentInsights();
      
      const query = `Generate a comprehensive daily summary based on the user's context and activity patterns:

Context Data:
- Total context changes: ${contextHistory.length}
- Insights generated: ${insights.length}
- High priority insights: ${insights.filter(i => i.priority === 'high').length}

Recent patterns from context history and provide a meaningful daily summary with:
1. Activity patterns observed
2. Notable insights and observations  
3. Recommendations for tomorrow
4. Any areas of concern or positive trends

Keep the summary concise but informative.`;

      const response = await reasoningEngine.processQuery({
        query,
        context: contextHistory[contextHistory.length - 1],
      });

      return response.content;
    } catch (error) {
      console.error('Daily summary generation error:', error);
      return 'Daily summary generation failed. Please check system logs.';
    }
  }

  private async sendNotification(
    title: string,
    body: string,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      data?: any;
      actions?: Array<{ id: string; title: string }>;
    }
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: options?.data || {},
          categoryIdentifier: options?.actions ? 'ARIA_ACTIONS' : undefined,
        },
        trigger: null, // Send immediately
      });

      console.log('ARIA: Notification sent:', title);
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  async updateTaskStatus(taskId: string, status: AutonomousTask['status']): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = status;
      this.activeTasks.set(taskId, task);
      console.log(`ARIA: Task ${taskId} status updated to ${status}`);
    }
  }

  // Public interface methods
  async createCustomTask(
    type: AutonomousTask['type'],
    title: string,
    description: string,
    scheduledFor?: Date,
    priority: AutonomousTask['priority'] = 'medium'
  ): Promise<string> {
    const task: AutonomousTask = {
      id: `custom_${Date.now()}`,
      type,
      title,
      description,
      scheduledFor,
      context: contextEngine.getContextHistory().slice(-1)[0],
      status: 'pending',
      priority,
      createdAt: new Date(),
    };

    this.activeTasks.set(task.id, task);
    
    await this.sendNotification(
      'New Task Created',
      `${title} has been scheduled`,
      { priority: 'normal', data: task }
    );

    return task.id;
  }

  getActiveTasks(): AutonomousTask[] {
    return Array.from(this.activeTasks.values());
  }

  getTask(taskId: string): AutonomousTask | undefined {
    return this.activeTasks.get(taskId);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'pending') {
      await this.updateTaskStatus(taskId, 'cancelled');
      return true;
    }
    return false;
  }

  isAutonomousModeActive(): boolean {
    return this.isActive;
  }

  getSystemStatus(): {
    isActive: boolean;
    activeTasks: number;
    pendingTasks: number;
    completedTasks: number;
    backgroundTaskRegistered: boolean;
  } {
    const tasks = Array.from(this.activeTasks.values());
    
    return {
      isActive: this.isActive,
      activeTasks: tasks.filter(t => t.status === 'active').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      backgroundTaskRegistered: this.backgroundTaskRegistered,
    };
  }
}

export const autonomousSystem = new AutonomousSystem();