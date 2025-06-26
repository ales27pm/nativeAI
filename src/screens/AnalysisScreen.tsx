import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAssistantStore } from '../state/assistantStore';
import { contextEngine } from '../api/context-engine';
import { reasoningEngine } from '../api/advanced-reasoning';
import { sensorManager } from '../api/sensor-manager';
import { cn } from '../utils/cn';

export default function AnalysisScreen() {
  const [insights, setInsights] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextSummary, setContextSummary] = useState('');
  const [predictions, setPredictions] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const { currentContext, sensorData, conversationHistory } = useAssistantStore();

  useEffect(() => {
    loadInitialData();
    
    // Update analysis every 30 seconds
    const interval = setInterval(() => {
      loadCurrentInsights();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      await loadCurrentInsights();
      setContextSummary(contextEngine.getContextSummary());
    } catch (error) {
      console.error('Initial data load error:', error);
    }
  };

  const loadCurrentInsights = async () => {
    try {
      const currentInsights = await contextEngine.analyzeCurrentContext();
      setInsights(currentInsights);
    } catch (error) {
      console.error('Insights load error:', error);
    }
  };

  const runFullAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      console.log('ARIA: Running comprehensive analysis...');
      
      // Get fresh sensor data
      const currentSensorData = sensorManager.getCurrentData();
      
      // Update context
      const context = await contextEngine.updateContext(currentSensorData);
      
      // Get insights
      const freshInsights = await contextEngine.analyzeCurrentContext();
      setInsights(freshInsights);
      
      // Generate predictions
      const prediction = await contextEngine.predictNextContext(60); // 1 hour ahead
      setPredictions(prediction);
      
      // Get AI-powered recommendations
      const aiRecommendations = await contextEngine.generateProactiveRecommendations(
        context,
        currentSensorData
      );
      setRecommendations(aiRecommendations);
      
      // Update summary
      setContextSummary(contextEngine.getContextSummary());
      
      console.log('ARIA: Comprehensive analysis completed');
    } catch (error) {
      console.error('Full analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAdvancedAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const currentSensorData = sensorManager.getCurrentData();
      const context = await contextEngine.updateContext(currentSensorData);
      
      const analysisQuery = `Perform a comprehensive analysis of my current situation:

Context Summary:
${contextSummary}

Recent Sensor Patterns:
- Motion: ${sensorManager.analyzeMotionPattern()}
- Orientation: ${sensorManager.getDeviceOrientation()}
- Battery: ${currentSensorData.deviceInfo?.battery || 'Unknown'}%
- Connectivity: ${currentSensorData.deviceInfo?.connectivity || 'Unknown'}

Current Insights: ${insights.length} active observations

Please provide:
1. Deep analysis of my current patterns and behavior
2. Potential risks or opportunities I should be aware of
3. Optimization suggestions for my daily routine
4. Health and wellness recommendations
5. Productivity insights and improvements

Be thorough and actionable in your analysis.`;

      const response = await reasoningEngine.processQuery({
        query: analysisQuery,
        context,
        sensorData: currentSensorData,
      });

      // Create a special analysis insight
      const analysisInsight = {
        id: `advanced_analysis_${Date.now()}`,
        type: 'analysis',
        priority: 'high',
        title: 'Advanced AI Analysis',
        description: response.content,
        confidence: response.confidence,
        timestamp: new Date(),
        actions: response.actions || [],
        contextSources: response.contextUsed || [],
        reasoning: response.reasoning,
      };

      setInsights(prev => [analysisInsight, ...prev]);
    } catch (error) {
      console.error('Advanced analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const InsightCard = ({ insight }: { insight: any }) => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    };

    const typeIcons = {
      observation: 'eye',
      prediction: 'trending-up',
      recommendation: 'lightbulb',
      alert: 'warning',
      analysis: 'analytics',
    };

    return (
      <Animated.View entering={FadeInUp.delay(100)}>
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Ionicons 
                  name={typeIcons[insight.type as keyof typeof typeIcons] as any} 
                  size={20} 
                  color="#3B82F6" 
                />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">{insight.title}</Text>
                <Text className="text-sm text-gray-500">
                  {insight.timestamp.toLocaleString()}
                </Text>
              </View>
            </View>
            
            <View className={cn('rounded-full px-3 py-1', priorityColors[insight.priority])}>
              <Text className="text-xs font-medium uppercase">{insight.priority}</Text>
            </View>
          </View>
          
          <Text className="text-gray-700 leading-6 mb-3">{insight.description}</Text>
          
          {insight.reasoning && (
            <View className="bg-gray-50 rounded-xl p-3 mb-3">
              <Text className="text-sm text-gray-600 font-medium mb-1">AI Reasoning:</Text>
              <Text className="text-sm text-gray-700 italic">{insight.reasoning}</Text>
            </View>
          )}
          
          {insight.actions && insight.actions.length > 0 && (
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-600 mb-2">Suggested Actions:</Text>
              {insight.actions.slice(0, 3).map((action: string, index: number) => (
                <View key={index} className="flex-row items-center mb-1">
                  <View className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                  <Text className="text-sm text-gray-700 flex-1">{action}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 mr-2">Confidence:</Text>
              <View className="bg-green-100 rounded-full px-2 py-1">
                <Text className="text-xs text-green-600 font-medium">
                  {Math.round(insight.confidence * 100)}%
                </Text>
              </View>
            </View>
            
            {insight.contextSources && insight.contextSources.length > 0 && (
              <Text className="text-xs text-gray-500">
                Sources: {insight.contextSources.join(', ')}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Analysis Dashboard</Text>
          <Text className="text-gray-600">AI-powered insights and contextual analysis</Text>
        </View>

        {/* Analysis Controls */}
        <View className="flex-row space-x-3 mb-6">
          <Pressable
            onPress={runFullAnalysis}
            disabled={isAnalyzing}
            className={cn(
              'flex-1 rounded-xl py-4 px-4 flex-row items-center justify-center',
              isAnalyzing ? 'bg-gray-300' : 'bg-blue-500'
            )}
          >
            <Ionicons 
              name={isAnalyzing ? 'hourglass' : 'refresh'} 
              size={20} 
              color="white" 
            />
            <Text className="text-white font-medium ml-2">
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Text>
          </Pressable>
          
          <Pressable
            onPress={getAdvancedAnalysis}
            disabled={isAnalyzing}
            className={cn(
              'flex-1 rounded-xl py-4 px-4 flex-row items-center justify-center',
              isAnalyzing ? 'bg-gray-300' : 'bg-purple-500'
            )}
          >
            <Ionicons name="hardware-chip" size={20} color="white" />
            <Text className="text-white font-medium ml-2">AI Analysis</Text>
          </Pressable>
        </View>

        {/* Context Summary */}
        <Animated.View entering={FadeInDown.delay(100)} className="mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-lg font-semibold text-gray-800 ml-2">Context Summary</Text>
            </View>
            <Text className="text-gray-700 leading-6">{contextSummary}</Text>
          </View>
        </Animated.View>

        {/* Predictions */}
        {predictions && (
          <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text className="text-lg font-semibold text-gray-800 ml-2">Predictions</Text>
                <View className="ml-auto bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-600 text-xs font-medium">
                    {Math.round(predictions.confidence * 100)}% Confidence
                  </Text>
                </View>
              </View>
              
              <Text className="text-gray-700 leading-6 mb-3">{predictions.reasoning}</Text>
              
              {predictions.predictedContext.deviceState && (
                <View className="bg-gray-50 rounded-xl p-3">
                  <Text className="text-sm font-medium text-gray-600 mb-2">Predicted in 1 hour:</Text>
                  <Text className="text-sm text-gray-700">
                    Battery: ~{Math.round(predictions.predictedContext.deviceState.battery)}%
                  </Text>
                  {predictions.predictedContext.timeOfDay && (
                    <Text className="text-sm text-gray-700">
                      Time context: {predictions.predictedContext.timeOfDay.replace('_', ' ')}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text className="text-lg font-semibold text-gray-800 ml-2">
                  AI Recommendations
                </Text>
              </View>
              
              <View className="space-y-2">
                {recommendations.slice(0, 5).map((rec, index) => (
                  <View key={index} className="flex-row items-start">
                    <View className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-3" />
                    <Text className="text-gray-700 flex-1">{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Insights */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-gray-800">Active Insights</Text>
            <View className="bg-blue-100 rounded-full px-3 py-1">
              <Text className="text-blue-600 text-sm font-medium">{insights.length} insights</Text>
            </View>
          </View>

          {insights.length > 0 ? (
            insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          ) : (
            <View className="bg-white rounded-xl p-8 items-center shadow-sm border border-gray-200">
              <Ionicons name="analytics-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                No insights available yet.{'\n'}Run analysis to generate AI-powered observations.
              </Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        <Animated.View entering={FadeInDown.delay(400)} className="mb-8">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="stats-chart" size={20} color="#8B5CF6" />
              <Text className="text-lg font-semibold text-gray-800 ml-2">Analysis Statistics</Text>
            </View>
            
            <View className="grid grid-cols-2 gap-4">
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-600">
                  {contextEngine.getHighPriorityInsights().length}
                </Text>
                <Text className="text-sm text-gray-600">High Priority</Text>
              </View>
              
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {contextEngine.getContextHistory().length}
                </Text>
                <Text className="text-sm text-gray-600">Context Records</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}