import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAssistantStore } from '../state/assistantStore';
import { sensorManager } from '../api/sensor-manager';
import { contextEngine } from '../api/context-engine';
import { autonomousSystem } from '../api/autonomous-system';
import { cn } from '../utils/cn';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    isActive,
    currentMode,
    setActive,
    setMode,
    sensorData,
    updateSensorData,
    isCollectingSensors,
    toggleSensorCollection,
  } = useAssistantStore();

  const [systemStatus, setSystemStatus] = useState(autonomousSystem.getSystemStatus());
  const [contextSummary, setContextSummary] = useState('Loading context...');

  useEffect(() => {
    // Setup sensor data updates
    sensorManager.onDataUpdate = (data) => {
      updateSensorData(data);
    };

    // Update context summary
    const updateContext = () => {
      setContextSummary(contextEngine.getContextSummary());
      setSystemStatus(autonomousSystem.getSystemStatus());
    };

    updateContext();
    const interval = setInterval(updateContext, 10000); // Update every 10 seconds

    return () => {
      clearInterval(interval);
      sensorManager.stopCollection();
    };
  }, []);

  const handleActivateARIA = async () => {
    try {
      if (!isActive) {
        setActive(true);
        await sensorManager.startCollection();
        await autonomousSystem.startAutonomousMode();
        Alert.alert(
          'ARIA Activated',
          'Advanced Reasoning Intelligence Assistant is now active and monitoring your context.',
          [{ text: 'OK' }]
        );
      } else {
        setActive(false);
        sensorManager.stopCollection();
        await autonomousSystem.stopAutonomousMode();
        Alert.alert('ARIA Deactivated', 'Assistant has been deactivated.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('ARIA activation error:', error);
      Alert.alert('Error', 'Failed to activate ARIA. Check permissions.', [{ text: 'OK' }]);
    }
  };

  const ModeCard = ({ 
    mode, 
    title, 
    description, 
    icon, 
    onPress 
  }: {
    mode: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }) => (
    <Animated.View entering={FadeInRight.delay(200)}>
      <Pressable
        onPress={onPress}
        className={cn(
          'bg-white rounded-2xl p-4 mb-3 border-2 shadow-sm',
          currentMode === mode ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        )}
      >
        <View className="flex-row items-center">
          <View className={cn(
            'w-12 h-12 rounded-full items-center justify-center mr-4',
            currentMode === mode ? 'bg-blue-500' : 'bg-gray-100'
          )}>
            <Ionicons 
              name={icon} 
              size={24} 
              color={currentMode === mode ? 'white' : '#666'}
            />
          </View>
          <View className="flex-1">
            <Text className={cn(
              'text-lg font-semibold',
              currentMode === mode ? 'text-blue-600' : 'text-gray-800'
            )}>
              {title}
            </Text>
            <Text className="text-gray-600 text-sm">{description}</Text>
          </View>
          {currentMode === mode && (
            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );

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
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-600 text-sm">{title}</Text>
            <Text className="text-xl font-bold text-gray-800">{value}</Text>
          </View>
          <View className={cn('w-10 h-10 rounded-full items-center justify-center', colorClasses[color])}>
            <Ionicons name={icon} size={20} color="currentColor" />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View style={{ paddingTop: insets.top }}>
        <ScrollView className="flex-1 px-4">
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-3xl font-bold text-gray-800">ARIA</Text>
              <View className="flex-row items-center">
                <View className={cn(
                  'w-3 h-3 rounded-full mr-2',
                  isActive ? 'bg-green-500' : 'bg-gray-400'
                )} />
                <Text className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-green-600' : 'text-gray-500'
                )}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <Text className="text-gray-600">Advanced Reasoning Intelligence Assistant</Text>
          </Animated.View>

          {/* Main Activation Button */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
            <Pressable
              onPress={handleActivateARIA}
              className={cn(
                'rounded-2xl p-6 items-center shadow-lg',
                isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
              )}
              style={{
                backgroundColor: isActive ? '#3B82F6' : '#6B7280',
              }}
            >
              <Ionicons 
                name={isActive ? 'pause-circle' : 'play-circle'} 
                size={48} 
                color="white" 
              />
              <Text className="text-white text-xl font-bold mt-2">
                {isActive ? 'Deactivate ARIA' : 'Activate ARIA'}
              </Text>
              <Text className="text-white/80 text-center text-sm mt-1">
                {isActive 
                  ? 'Monitoring your context and environment' 
                  : 'Tap to start advanced AI assistance'
                }
              </Text>
            </Pressable>
          </Animated.View>

          {/* System Status */}
          {isActive && (
            <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
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
                  title="Battery Level"
                  value={`${sensorData.deviceInfo?.battery || 100}%`}
                  icon="battery-half"
                  color={sensorData.deviceInfo?.battery && sensorData.deviceInfo.battery < 20 ? 'red' : 'green'}
                />
                <StatusCard
                  title="Connectivity"
                  value={sensorData.deviceInfo?.connectivity || 'Unknown'}
                  icon="wifi"
                  color="green"
                />
              </View>
            </Animated.View>
          )}

          {/* Context Summary */}
          {isActive && (
            <Animated.View entering={FadeInDown.delay(400)} className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Context Summary</Text>
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <Text className="text-gray-700 text-sm leading-5">{contextSummary}</Text>
              </View>
            </Animated.View>
          )}

          {/* Mode Selection */}
          <Animated.View entering={FadeInDown.delay(500)} className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Assistant Modes</Text>
            
            <ModeCard
              mode="chat"
              title="Chat Mode"
              description="Interactive conversation with AI reasoning"
              icon="chatbubbles"
              onPress={() => {
                setMode('chat');
                navigation.navigate('Chat');
              }}
            />
            
            <ModeCard
              mode="observe"
              title="Observation Mode"
              description="Visual analysis and environment monitoring"
              icon="eye"
              onPress={() => {
                setMode('observe');
                navigation.navigate('Vision');
              }}
            />
            
            <ModeCard
              mode="analyze"
              title="Analysis Mode"
              description="Deep sensor and context analysis"
              icon="analytics"
              onPress={() => {
                setMode('analyze');
                navigation.navigate('Analysis');
              }}
            />
            
            <ModeCard
              mode="autonomous"
              title="Autonomous Mode"
              description="Self-directed actions and monitoring"
              icon="hardware-chip"
              onPress={() => {
                setMode('autonomous');
                navigation.navigate('Autonomous');
              }}
            />
          </Animated.View>

          {/* Feature Access */}
          {isActive && (
            <Animated.View entering={FadeInDown.delay(600)} className="mb-8">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Quick Access</Text>
              
              <View className="flex-row justify-between">
                <Pressable
                  onPress={() => navigation.navigate('Audio')}
                  className="bg-white rounded-xl p-4 items-center flex-1 mr-2 shadow-sm border border-gray-200"
                >
                  <Ionicons name="mic" size={24} color="#3B82F6" />
                  <Text className="text-sm font-medium text-gray-700 mt-1">Voice</Text>
                </Pressable>
                
                <Pressable
                  onPress={() => navigation.navigate('Vision')}
                  className="bg-white rounded-xl p-4 items-center flex-1 mx-1 shadow-sm border border-gray-200"
                >
                  <Ionicons name="camera" size={24} color="#3B82F6" />
                  <Text className="text-sm font-medium text-gray-700 mt-1">Camera</Text>
                </Pressable>
                
                <Pressable
                  onPress={() => navigation.navigate('Sensors')}
                  className="bg-white rounded-xl p-4 items-center flex-1 ml-2 shadow-sm border border-gray-200"
                >
                  <Ionicons name="hardware-chip" size={24} color="#3B82F6" />
                  <Text className="text-sm font-medium text-gray-700 mt-1">Sensors</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}