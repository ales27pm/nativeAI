import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useAssistantStore } from '../state/assistantStore';
import { reasoningEngine } from '../api/advanced-reasoning';
import { sensorManager } from '../api/sensor-manager';
import { contextEngine } from '../api/context-engine';
import { audioSystem } from '../api/audio-system';
import { cn } from '../utils/cn';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  reasoning?: string;
  confidence?: number;
  model?: string;
  contextUsed?: string[];
}

export default function ChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    isProcessing,
    setProcessing,
    sensorData,
    currentContext,
    lastResponse,
    setLastResponse,
    addMessage,
  } = useAssistantStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'ARIA (Advanced Reasoning Intelligence Assistant) is now active. I can see your sensor data, analyze your context, and provide intelligent responses. How can I assist you?',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async (text: string, isVoiceInput = false) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setProcessing(true);

    try {
      // Get current context and sensor data
      const currentSensorData = sensorManager.getCurrentData();
      const context = await contextEngine.updateContext(currentSensorData);

      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      // Process with reasoning engine
      const response = await reasoningEngine.processQuery({
        query: text,
        context,
        sensorData: currentSensorData,
        conversationHistory,
      });

      setLastResponse(response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        reasoning: response.reasoning,
        confidence: response.confidence,
        model: response.model,
        contextUsed: response.contextUsed,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Store in persistent conversation history
      addMessage({
        id: assistantMessage.id,
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          sensorData: currentSensorData,
          context,
        },
      });

      // Speak response if voice was used for input
      if (isVoiceInput) {
        try {
          await audioSystem.speak(response.content.substring(0, 200)); // Limit length for speech
        } catch (speechError) {
          console.error('Speech synthesis error:', speechError);
        }
      }

    } catch (error) {
      console.error('Chat processing error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setProcessing(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      try {
        setIsRecording(false);
        const audioUri = await audioSystem.stopRecording();
        
        if (audioUri) {
          setProcessing(true);
          const audioData = await audioSystem.transcribeRecording(audioUri);
          
          if (audioData.transcription.trim()) {
            await sendMessage(audioData.transcription, true);
          } else {
            setProcessing(false);
          }
        }
      } catch (error) {
        console.error('Voice input error:', error);
        setIsRecording(false);
        setProcessing(false);
      }
    } else {
      // Start recording
      try {
        setIsRecording(true);
        await audioSystem.startRecording();
      } catch (error) {
        console.error('Voice recording start error:', error);
        setIsRecording(false);
      }
    }
  };

  const getConsensusResponse = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `${inputText} [CONSENSUS MODE]`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setProcessing(true);

    try {
      const currentSensorData = sensorManager.getCurrentData();
      const context = await contextEngine.updateContext(currentSensorData);

      const response = await reasoningEngine.getConsensus({
        query: inputText,
        context,
        sensorData: currentSensorData,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        reasoning: response.reasoning,
        confidence: response.confidence,
        model: response.model,
        contextUsed: response.contextUsed,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Consensus processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <Animated.View 
      entering={message.type === 'user' ? FadeInRight : FadeInUp}
      className={cn(
        'mb-4 mx-4',
        message.type === 'user' ? 'items-end' : 'items-start'
      )}
    >
      <View className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3',
        message.type === 'user' 
          ? 'bg-blue-500' 
          : message.type === 'system'
          ? 'bg-gray-100 border border-gray-200'
          : 'bg-white border border-gray-200'
      )}>
        <Text className={cn(
          'text-base leading-6',
          message.type === 'user' 
            ? 'text-white' 
            : 'text-gray-800'
        )}>
          {message.content}
        </Text>
        
        {/* Debug info for assistant messages */}
        {message.type === 'assistant' && showDebugInfo && (
          <View className="mt-3 pt-3 border-t border-gray-200">
            <Text className="text-xs text-gray-500 mb-1">
              Model: {message.model} | Confidence: {(message.confidence || 0 * 100).toFixed(0)}%
            </Text>
            {message.contextUsed && message.contextUsed.length > 0 && (
              <Text className="text-xs text-gray-500 mb-1">
                Context: {message.contextUsed.join(', ')}
              </Text>
            )}
            {message.reasoning && (
              <Text className="text-xs text-gray-500 italic">
                Reasoning: {message.reasoning}
              </Text>
            )}
          </View>
        )}
      </View>
      
      <Text className="text-xs text-gray-500 mt-1 mx-2">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={() => navigation.goBack()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </Pressable>
            <View>
              <Text className="text-lg font-semibold text-gray-800">ARIA Chat</Text>
              <Text className="text-sm text-gray-600">
                {isProcessing ? 'Thinking...' : 'Ready to assist'}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <Pressable 
              onPress={() => setShowDebugInfo(!showDebugInfo)}
              className="mr-3"
            >
              <Ionicons 
                name="bug" 
                size={20} 
                color={showDebugInfo ? '#3B82F6' : '#9CA3AF'} 
              />
            </Pressable>
            <View className={cn(
              'w-2 h-2 rounded-full',
              isProcessing ? 'bg-yellow-500' : 'bg-green-500'
            )} />
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          <View className="py-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Processing indicator */}
            {isProcessing && (
              <Animated.View entering={FadeInUp} className="mx-4 mb-4">
                <View className="bg-white rounded-2xl px-4 py-3 border border-gray-200 max-w-[80%]">
                  <View className="flex-row items-center">
                    <View className="flex-row space-x-1">
                      <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                      <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </View>
                    <Text className="text-gray-600 text-sm ml-2">
                      ARIA is analyzing...
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Input Area */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row items-end">
            <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3 max-h-32">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask ARIA anything..."
                multiline
                className="text-base text-gray-800 min-h-[24px]"
                editable={!isProcessing}
              />
            </View>
            
            {/* Voice Input Button */}
            <Pressable
              onPress={handleVoiceInput}
              disabled={isProcessing}
              className={cn(
                'w-12 h-12 rounded-full items-center justify-center mr-2',
                isRecording 
                  ? 'bg-red-500' 
                  : isProcessing 
                  ? 'bg-gray-300' 
                  : 'bg-gray-200'
              )}
            >
              <Ionicons 
                name={isRecording ? 'stop' : 'mic'} 
                size={24} 
                color={isRecording ? 'white' : '#374151'}
              />
            </Pressable>
            
            {/* Send Button */}
            <Pressable
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isProcessing}
              className={cn(
                'w-12 h-12 rounded-full items-center justify-center',
                inputText.trim() && !isProcessing ? 'bg-blue-500' : 'bg-gray-300'
              )}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() && !isProcessing ? 'white' : '#9CA3AF'}
              />
            </Pressable>
          </View>
          
          {/* Consensus Button */}
          {inputText.trim() && !isProcessing && (
            <Animated.View entering={FadeInUp} className="mt-2">
              <Pressable
                onPress={getConsensusResponse}
                className="bg-purple-100 rounded-full px-4 py-2 flex-row items-center justify-center"
              >
                <Ionicons name="git-network" size={16} color="#7C3AED" />
                <Text className="text-purple-700 text-sm font-medium ml-2">
                  Get Multi-Model Consensus
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}