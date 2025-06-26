import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { autonomousSystem } from '../api/autonomous-system';
import { AutonomousTask } from '../types/assistant';
import { cn } from '../utils/cn';

export default function AutonomousScreen() {
  const [isActive, setIsActive] = useState(false);
  const [tasks, setTasks] = useState<AutonomousTask[]>([]);
  const [systemStatus, setSystemStatus] = useState(autonomousSystem.getSystemStatus());

  useEffect(() => {
    loadSystemData();
    
    // Update system status every 10 seconds
    const interval = setInterval(() => {
      loadSystemData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadSystemData = () => {
    const status = autonomousSystem.getSystemStatus();
    const currentTasks = autonomousSystem.getActiveTasks();
    
    setSystemStatus(status);
    setTasks(currentTasks);
    setIsActive(status.isActive);
  };

  const toggleAutonomousMode = async () => {
    try {
      if (isActive) {
        await autonomousSystem.stopAutonomousMode();
        Alert.alert('Autonomous Mode Stopped', 'ARIA is no longer operating autonomously.');
      } else {
        await autonomousSystem.startAutonomousMode();
        Alert.alert(
          'Autonomous Mode Activated', 
          'ARIA is now operating autonomously and will proactively monitor your context, send notifications, and take appropriate actions.'
        );
      }
      loadSystemData();
    } catch (error) {
      console.error('Autonomous mode toggle error:', error);
      Alert.alert('Error', 'Failed to toggle autonomous mode.');
    }
  };

  const createCustomTask = () => {
    Alert.prompt(
      'Create Custom Task',
      'What would you like ARIA to do autonomously?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (taskDescription) => {
            if (taskDescription) {
              try {
                await autonomousSystem.createCustomTask(
                  'reminder',
                  'Custom Task',
                  taskDescription,
                  undefined,
                  'medium'
                );
                loadSystemData();
                Alert.alert('Task Created', 'Your custom autonomous task has been scheduled.');
              } catch (error) {
                Alert.alert('Error', 'Failed to create task.');
              }
            }
          },
        },
      ],
      'plain-text',
      'Remind me to take a break every hour'
    );
  };

  const cancelTask = async (taskId: string) => {
    Alert.alert(
      'Cancel Task',
      'Are you sure you want to cancel this autonomous task?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const success = await autonomousSystem.cancelTask(taskId);
            if (success) {
              loadSystemData();
              Alert.alert('Task Cancelled', 'The autonomous task has been cancelled.');
            } else {
              Alert.alert('Error', 'Failed to cancel task.');
            }
          },
        },
      ]
    );
  };

  const TaskCard = ({ task }: { task: AutonomousTask }) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-600',
      active: 'bg-blue-100 text-blue-600',
      completed: 'bg-green-100 text-green-600',
      failed: 'bg-red-100 text-red-600',
      cancelled: 'bg-gray-100 text-gray-600',
    };

    const priorityColors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    };

    const typeIcons = {
      observation: 'eye',
      analysis: 'analytics',
      reminder: 'alarm',
      action: 'flash',
    };

    return (
      <Animated.View entering={FadeInUp.delay(100)}>
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                <Ionicons 
                  name={typeIcons[task.type as keyof typeof typeIcons] as any} 
                  size={20} 
                  color="#7C3AED" 
                />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">{task.title}</Text>
                <Text className="text-sm text-gray-500">
                  Created: {task.createdAt.toLocaleString()}
                </Text>
                {task.scheduledFor && (
                  <Text className="text-sm text-gray-500">
                    Scheduled: {task.scheduledFor.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
            
            <View className="flex-row space-x-2">
              <View className={cn('rounded-full px-2 py-1', priorityColors[task.priority])}>
                <Text className="text-xs font-medium uppercase">{task.priority}</Text>
              </View>
              <View className={cn('rounded-full px-2 py-1', statusColors[task.status])}>
                <Text className="text-xs font-medium uppercase">{task.status}</Text>
              </View>
            </View>
          </View>
          
          <Text className="text-gray-700 leading-6 mb-3">{task.description}</Text>
          
          {task.status === 'pending' && (
            <View className="flex-row justify-end pt-3 border-t border-gray-200">
              <Pressable
                onPress={() => cancelTask(task.id)}
                className="bg-red-100 rounded-xl py-2 px-4 flex-row items-center"
              >
                <Ionicons name="close" size={16} color="#EF4444" />
                <Text className="text-red-500 font-medium ml-1 text-sm">Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const StatusCard = ({ 
    title, 
    value, 
    icon, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color?: 'blue' | 'green' | 'yellow' | 'red';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
    };

    return (
      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-600 text-sm">{title}</Text>
            <Text className="text-2xl font-bold text-gray-800">{value}</Text>
          </View>
          <View className={cn('w-12 h-12 rounded-full items-center justify-center', colorClasses[color])}>
            <Ionicons name={icon} size={24} color="currentColor" />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Autonomous Mode</Text>
          <Text className="text-gray-600">Self-directed AI assistance and monitoring</Text>
        </View>

        {/* Main Control */}
        <Animated.View entering={FadeInDown.delay(100)} className="mb-6">
          <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className={cn(
                  'w-12 h-12 rounded-full items-center justify-center mr-4',
                  isActive ? 'bg-green-100' : 'bg-gray-100'
                )}>
                  <Ionicons 
                    name="hardware-chip" 
                    size={24} 
                    color={isActive ? '#10B981' : '#6B7280'}
                  />
                </View>
                <View>
                  <Text className="text-xl font-semibold text-gray-800">Autonomous Mode</Text>
                  <Text className="text-gray-600">
                    {isActive 
                      ? 'ARIA is operating autonomously' 
                      : 'ARIA is in manual mode'
                    }
                  </Text>
                </View>
              </View>
              
              <View className={cn(
                'w-4 h-4 rounded-full',
                isActive ? 'bg-green-500' : 'bg-gray-400'
              )} />
            </View>
            
            <Pressable
              onPress={toggleAutonomousMode}
              className={cn(
                'rounded-xl py-4 px-6 flex-row items-center justify-center',
                isActive ? 'bg-red-500' : 'bg-green-500'
              )}
            >
              <Ionicons 
                name={isActive ? 'stop' : 'play'} 
                size={24} 
                color="white" 
              />
              <Text className="text-white font-semibold text-lg ml-3">
                {isActive ? 'Stop Autonomous Mode' : 'Start Autonomous Mode'}
              </Text>
            </Pressable>
            
            {isActive && (
              <Text className="text-sm text-gray-600 mt-3 text-center">
                ARIA will proactively monitor your context, send notifications, and perform autonomous actions based on your patterns and needs.
              </Text>
            )}
          </View>
        </Animated.View>

        {/* System Status */}
        {isActive && (
          <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">System Status</Text>
            <View className="grid grid-cols-2 gap-3">
              <StatusCard
                title="Active Tasks"
                value={systemStatus.activeTasks}
                icon="flash"
                color="blue"
              />
              <StatusCard
                title="Pending Tasks"
                value={systemStatus.pendingTasks}
                icon="hourglass"
                color="yellow"
              />
              <StatusCard
                title="Completed"
                value={systemStatus.completedTasks}
                icon="checkmark-circle"
                color="green"
              />
              <StatusCard
                title="Background Active"
                value={systemStatus.backgroundTaskRegistered ? 'Yes' : 'No'}
                icon="sync"
                color={systemStatus.backgroundTaskRegistered ? 'green' : 'red'}
              />
            </View>
          </Animated.View>
        )}

        {/* Task Management */}
        <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-800">Autonomous Tasks</Text>
            <Pressable
              onPress={createCustomTask}
              className="bg-purple-500 rounded-xl py-2 px-4 flex-row items-center"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-medium ml-1">Create Task</Text>
            </Pressable>
          </View>

          {tasks.length > 0 ? (
            tasks
              .sort((a, b) => {
                // Sort by status priority, then by creation date
                const statusPriority = { active: 0, pending: 1, completed: 2, failed: 3, cancelled: 4 };
                const aStatusPriority = statusPriority[a.status as keyof typeof statusPriority] || 5;
                const bStatusPriority = statusPriority[b.status as keyof typeof statusPriority] || 5;
                
                if (aStatusPriority !== bStatusPriority) {
                  return aStatusPriority - bStatusPriority;
                }
                
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
          ) : (
            <View className="bg-white rounded-xl p-8 items-center shadow-sm border border-gray-200">
              <Ionicons name="list-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                No autonomous tasks yet.{'\n'}
                {isActive 
                  ? 'ARIA will create tasks automatically based on your context.' 
                  : 'Activate autonomous mode to enable automatic task creation.'
                }
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Autonomous Features Info */}
        <Animated.View entering={FadeInDown.delay(400)} className="mb-8">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-lg font-semibold text-gray-800 ml-2">Autonomous Features</Text>
            </View>
            
            <View className="space-y-3">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                <Text className="text-gray-700 flex-1">Contextual monitoring and insights</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                <Text className="text-gray-700 flex-1">Proactive notifications and alerts</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                <Text className="text-gray-700 flex-1">Background analysis and predictions</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                <Text className="text-gray-700 flex-1">Automated reminders and scheduling</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                <Text className="text-gray-700 flex-1">Daily summaries and wellness checks</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}