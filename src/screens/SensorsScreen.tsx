import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useAssistantStore } from '../state/assistantStore';
import { sensorManager } from '../api/sensor-manager';
import { cn } from '../utils/cn';

export default function SensorsScreen() {
  const { 
    sensorData, 
    updateSensorData, 
    isCollectingSensors, 
    toggleSensorCollection 
  } = useAssistantStore();
  
  const [contextualInsights, setContextualInsights] = useState<string[]>([]);

  useEffect(() => {
    // Setup sensor data updates
    sensorManager.onDataUpdate = (data) => {
      updateSensorData(data);
      setContextualInsights(sensorManager.getContextualInsights());
    };

    // Get initial insights
    setContextualInsights(sensorManager.getContextualInsights());

    return () => {
      // Cleanup if needed
    };
  }, []);

  const toggleSensors = async () => {
    if (isCollectingSensors) {
      sensorManager.stopCollection();
    } else {
      await sensorManager.startCollection();
    }
    toggleSensorCollection();
  };

  const SensorCard = ({ 
    title, 
    icon, 
    data, 
    unit = '', 
    color = 'blue' 
  }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    data: any;
    unit?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
    };

    return (
      <Animated.View entering={FadeInRight.delay(100)}>
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
          <View className="flex-row items-center mb-3">
            <View className={cn('w-10 h-10 rounded-full items-center justify-center mr-3', colorClasses[color])}>
              <Ionicons name={icon} size={20} color="currentColor" />
            </View>
            <Text className="text-lg font-semibold text-gray-800">{title}</Text>
          </View>
          
          {data ? (
            <View className="space-y-2">
              {typeof data === 'object' ? (
                Object.entries(data).map(([key, value]) => (
                  <View key={key} className="flex-row justify-between items-center">
                    <Text className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</Text>
                    <Text className="text-gray-800 font-medium">
                      {typeof value === 'number' ? value.toFixed(3) : String(value)} {unit}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-800 font-medium">{String(data)} {unit}</Text>
              )}
            </View>
          ) : (
            <Text className="text-gray-500 italic">No data available</Text>
          )}
          
          {data?.timestamp && (
            <Text className="text-xs text-gray-400 mt-2">
              Last updated: {new Date(data.timestamp).toLocaleTimeString()}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Sensor Dashboard</Text>
          <Text className="text-gray-600">Real-time device sensor monitoring and analysis</Text>
        </View>

        {/* Control Panel */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-gray-800">Sensor Collection</Text>
              <Text className="text-gray-600 text-sm">
                {isCollectingSensors ? 'Actively monitoring sensors' : 'Sensors are stopped'}
              </Text>
            </View>
            
            <Pressable
              onPress={toggleSensors}
              className={cn(
                'px-6 py-3 rounded-xl flex-row items-center',
                isCollectingSensors ? 'bg-red-500' : 'bg-blue-500'
              )}
            >
              <Ionicons 
                name={isCollectingSensors ? 'stop' : 'play'} 
                size={20} 
                color="white" 
              />
              <Text className="text-white font-medium ml-2">
                {isCollectingSensors ? 'Stop' : 'Start'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Motion Sensors */}
        <Text className="text-xl font-semibold text-gray-800 mb-4">Motion Sensors</Text>
        
        <SensorCard
          title="Accelerometer"
          icon="speedometer"
          data={sensorData.accelerometer}
          unit="m/s²"
          color="blue"
        />
        
        <SensorCard
          title="Gyroscope"
          icon="sync"
          data={sensorData.gyroscope}
          unit="rad/s"
          color="green"
        />
        
        <SensorCard
          title="Magnetometer"
          icon="compass"
          data={sensorData.magnetometer}
          unit="μT"
          color="purple"
        />

        {/* Location */}
        <Text className="text-xl font-semibold text-gray-800 mb-4 mt-6">Location</Text>
        
        <SensorCard
          title="GPS Location"
          icon="location"
          data={sensorData.location}
          color="orange"
        />

        {/* Device Info */}
        <Text className="text-xl font-semibold text-gray-800 mb-4 mt-6">Device Status</Text>
        
        <SensorCard
          title="Device Information"
          icon="phone-portrait"
          data={sensorData.deviceInfo}
          color="red"
        />

        {/* Motion Analysis */}
        {isCollectingSensors && (
          <>
            <Text className="text-xl font-semibold text-gray-800 mb-4 mt-6">Motion Analysis</Text>
            
            <Animated.View entering={FadeInRight.delay(200)}>
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                    <Ionicons name="analytics" size={20} color="#4F46E5" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-800">Pattern Recognition</Text>
                </View>
                
                <View className="space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Motion Pattern:</Text>
                    <View className="bg-indigo-100 rounded-full px-3 py-1">
                      <Text className="text-indigo-600 font-medium capitalize">
                        {sensorManager.analyzeMotionPattern()}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Device Orientation:</Text>
                    <View className="bg-indigo-100 rounded-full px-3 py-1">
                      <Text className="text-indigo-600 font-medium capitalize">
                        {sensorManager.getDeviceOrientation().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {/* Contextual Insights */}
        {contextualInsights.length > 0 && (
          <>
            <Text className="text-xl font-semibold text-gray-800 mb-4 mt-6">Contextual Insights</Text>
            
            <Animated.View entering={FadeInRight.delay(300)}>
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-3">
                    <Ionicons name="lightbulb" size={20} color="#F59E0B" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-800">AI Observations</Text>
                </View>
                
                <View className="space-y-2">
                  {contextualInsights.map((insight, index) => (
                    <View key={index} className="flex-row items-start">
                      <View className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-3" />
                      <Text className="text-gray-700 flex-1">{insight}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {/* Context Checks */}
        {isCollectingSensors && (
          <>
            <Text className="text-xl font-semibold text-gray-800 mb-4 mt-6">Context Checks</Text>
            
            <Animated.View entering={FadeInRight.delay(400)}>
              <View className="bg-white rounded-xl p-4 mb-8 shadow-sm border border-gray-200">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-teal-100 items-center justify-center mr-3">
                    <Ionicons name="checkmark-circle" size={20} color="#14B8A6" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-800">Status Indicators</Text>
                </View>
                
                <View className="space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">User Movement:</Text>
                    <View className={cn(
                      'rounded-full px-3 py-1',
                      sensorManager.isUserInContext('moving') ? 'bg-green-100' : 'bg-gray-100'
                    )}>
                      <Text className={cn(
                        'font-medium',
                        sensorManager.isUserInContext('moving') ? 'text-green-600' : 'text-gray-600'
                      )}>
                        {sensorManager.isUserInContext('moving') ? 'Moving' : 'Stationary'}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Battery Status:</Text>
                    <View className={cn(
                      'rounded-full px-3 py-1',
                      sensorManager.isUserInContext('low_battery') ? 'bg-red-100' : 'bg-green-100'
                    )}>
                      <Text className={cn(
                        'font-medium',
                        sensorManager.isUserInContext('low_battery') ? 'text-red-600' : 'text-green-600'
                      )}>
                        {sensorManager.isUserInContext('low_battery') ? 'Low Battery' : 'Battery OK'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}