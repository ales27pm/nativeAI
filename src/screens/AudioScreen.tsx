import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAssistantStore } from '../state/assistantStore';
import { audioSystem } from '../api/audio-system';
import { reasoningEngine } from '../api/advanced-reasoning';
import { contextEngine } from '../api/context-engine';
import { cn } from '../utils/cn';

export default function AudioScreen({ navigation }: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<any>(null);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  
  const { updateAudioData, currentContext } = useAssistantStore();

  useEffect(() => {
    loadVoices();
    
    // Update speaking status
    const interval = setInterval(() => {
      setIsSpeaking(audioSystem.getIsPlaying());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const loadVoices = async () => {
    try {
      const voices = await audioSystem.getAvailableVoices();
      setAvailableVoices(voices);
      
      // Select default English voice
      const englishVoice = voices.find(v => v.language.startsWith('en'));
      setSelectedVoice(englishVoice || voices[0]);
    } catch (error) {
      console.error('Load voices error:', error);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await audioSystem.startRecording();
    } catch (error) {
      console.error('Recording start error:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      const audioUri = await audioSystem.stopRecording();
      if (audioUri) {
        await processAudio(audioUri);
      }
    } catch (error) {
      console.error('Recording stop error:', error);
      Alert.alert('Error', 'Failed to process recording.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudio = async (audioUri: string) => {
    try {
      console.log('ARIA: Processing audio...');
      
      // Transcribe audio
      const audioData = await audioSystem.transcribeRecording(audioUri);
      updateAudioData(audioData);
      
      // Analyze audio content
      const analysis = await audioSystem.analyzeAudioContent(audioUri);
      
      // Get AI reasoning about the audio
      const context = await contextEngine.updateContext(undefined, undefined, audioData);
      
      const reasoningQuery = `I just processed audio input with the following analysis:
      
Transcription: "${analysis.transcription}"
Sentiment: ${analysis.sentiment}
Keywords: ${analysis.keywords.join(', ')}
Language: ${analysis.language}
Confidence: ${(analysis.confidence * 100).toFixed(0)}%

Based on this audio input and my current context, provide insights about what the user said, any actions I should take, and relevant observations or recommendations.`;

      const aiResponse = await reasoningEngine.processQuery({
        query: reasoningQuery,
        context,
        audioData,
      });

      setAudioAnalysis({
        audio: analysis,
        reasoning: aiResponse,
      });

      // Speak the AI response
      if (analysis.transcription.trim()) {
        await speak(aiResponse.content.substring(0, 200)); // Limit for speech
      }

      console.log('ARIA: Audio processing completed');
    } catch (error) {
      console.error('Audio processing error:', error);
      Alert.alert('Processing Error', 'Failed to analyze audio. Please try again.');
    }
  };

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      await audioSystem.speak(text, {
        voice: selectedVoice?.identifier,
        rate: 0.8,
        pitch: 1.0,
      });
    } catch (error) {
      console.error('Speech error:', error);
      Alert.alert('Speech Error', 'Failed to synthesize speech.');
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    try {
      await audioSystem.stopSpeaking();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Stop speaking error:', error);
    }
  };

  const testSpeak = () => {
    const testText = "Hello! I am ARIA, your Advanced Reasoning Intelligence Assistant. I can process your voice input, understand what you're saying, and respond with intelligent analysis and recommendations.";
    speak(testText);
  };

  const recordingButton = () => (
    <Animated.View entering={FadeInUp} className="items-center mb-8">
      <Pressable
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={cn(
          'w-32 h-32 rounded-full items-center justify-center shadow-lg',
          isRecording 
            ? 'bg-red-500' 
            : isProcessing 
            ? 'bg-gray-400' 
            : 'bg-blue-500'
        )}
      >
        <Ionicons 
          name={isRecording ? 'stop' : isProcessing ? 'hourglass' : 'mic'} 
          size={48} 
          color="white" 
        />
      </Pressable>
      
      <Text className={cn(
        'text-lg font-semibold mt-4',
        isRecording 
          ? 'text-red-600' 
          : isProcessing 
          ? 'text-gray-600' 
          : 'text-blue-600'
      )}>
        {isRecording 
          ? 'Recording...' 
          : isProcessing 
          ? 'Processing...' 
          : 'Tap to Record'
        }
      </Text>
      
      {isRecording && (
        <View className="flex-row items-center mt-2">
          <View className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
          <Text className="text-red-600 text-sm">Listening to your voice</Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {!audioAnalysis ? (
          /* Initial State */
          <View className="px-6 py-12">
            <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-8">
              <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-6">
                <Ionicons name="mic" size={48} color="#3B82F6" />
              </View>
              
              <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
                Voice Intelligence
              </Text>
              <Text className="text-gray-600 text-center mb-8 leading-6">
                ARIA can transcribe your speech, analyze sentiment and keywords, then provide intelligent responses using advanced AI reasoning.
              </Text>
            </Animated.View>

            {recordingButton()}

            {/* Voice Controls */}
            <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Voice Controls</Text>
              
              <View className="space-y-3">
                <Pressable
                  onPress={testSpeak}
                  disabled={isSpeaking || isProcessing}
                  className="bg-white rounded-xl p-4 flex-row items-center shadow-sm border border-gray-200"
                >
                  <Ionicons name="volume-high" size={24} color="#3B82F6" />
                  <Text className="text-gray-800 font-medium ml-3 flex-1">Test Speech Synthesis</Text>
                  {isSpeaking && (
                    <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </Pressable>
                
                {isSpeaking && (
                  <Pressable
                    onPress={stopSpeaking}
                    className="bg-red-500 rounded-xl p-4 flex-row items-center justify-center"
                  >
                    <Ionicons name="stop" size={24} color="white" />
                    <Text className="text-white font-medium ml-2">Stop Speaking</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* Voice Selection */}
            {selectedVoice && (
              <Animated.View entering={FadeInDown.delay(400)} className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Selected Voice</Text>
                <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <Text className="text-gray-800 font-medium">{selectedVoice.name}</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {selectedVoice.language} • {selectedVoice.quality}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        ) : (
          /* Analysis Results */
          <View className="p-4">
            {/* New Recording Button */}
            <View className="items-center mb-6">
              {recordingButton()}
            </View>

            {/* Audio Analysis */}
            <Animated.View entering={FadeInUp.delay(100)} className="mb-4">
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="waveform" size={20} color="#3B82F6" />
                  <Text className="text-lg font-semibold text-gray-800 ml-2">Audio Analysis</Text>
                  <View className="ml-auto bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-medium">
                      {Math.round(audioAnalysis.audio.confidence * 100)}% Confidence
                    </Text>
                  </View>
                </View>
                
                {/* Transcription */}
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Text className="text-gray-600 text-xs font-medium uppercase tracking-wide mb-2">
                    Transcription
                  </Text>
                  <Text className="text-gray-800 text-base leading-6">
                    "{audioAnalysis.audio.transcription}"
                  </Text>
                </View>
                
                {/* Analysis Details */}
                <View className="flex-row justify-between mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-medium text-gray-600 mb-1">Sentiment</Text>
                    <View className={cn(
                      'rounded-full px-3 py-1',
                      audioAnalysis.audio.sentiment === 'positive' ? 'bg-green-100' :
                      audioAnalysis.audio.sentiment === 'negative' ? 'bg-red-100' :
                      'bg-gray-100'
                    )}>
                      <Text className={cn(
                        'text-sm font-medium capitalize text-center',
                        audioAnalysis.audio.sentiment === 'positive' ? 'text-green-600' :
                        audioAnalysis.audio.sentiment === 'negative' ? 'text-red-600' :
                        'text-gray-600'
                      )}>
                        {audioAnalysis.audio.sentiment}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-medium text-gray-600 mb-1">Language</Text>
                    <View className="bg-blue-100 rounded-full px-3 py-1">
                      <Text className="text-blue-600 text-sm font-medium text-center uppercase">
                        {audioAnalysis.audio.language}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Keywords */}
                {audioAnalysis.audio.keywords.length > 0 && (
                  <View>
                    <Text className="text-sm font-medium text-gray-600 mb-2">Key Topics</Text>
                    <View className="flex-row flex-wrap">
                      {audioAnalysis.audio.keywords.map((keyword: string, index: number) => (
                        <View key={index} className="bg-purple-100 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-purple-600 text-sm">{keyword}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* AI Response */}
            <Animated.View entering={FadeInUp.delay(200)}>
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="hardware-chip" size={20} color="#7C3AED" />
                  <Text className="text-lg font-semibold text-gray-800 ml-2">AI Response</Text>
                  <View className="ml-auto bg-purple-100 px-3 py-1 rounded-full">
                    <Text className="text-purple-600 text-xs font-medium">
                      {audioAnalysis.reasoning.model.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-gray-700 leading-6 mb-4">
                  {audioAnalysis.reasoning.content}
                </Text>
                
                {/* Actions */}
                {audioAnalysis.reasoning.actions && audioAnalysis.reasoning.actions.length > 0 && (
                  <View className="mt-4">
                    <Text className="text-sm font-medium text-gray-600 mb-2">Suggested Actions:</Text>
                    {audioAnalysis.reasoning.actions.slice(0, 3).map((action: string, index: number) => (
                      <View key={index} className="flex-row items-center mb-1">
                        <View className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2" />
                        <Text className="text-gray-700 text-sm flex-1">{action}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Speak Response Button */}
                <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-200">
                  <Pressable
                    onPress={() => speak(audioAnalysis.reasoning.content)}
                    disabled={isSpeaking}
                    className="bg-blue-500 rounded-xl py-3 px-6 flex-row items-center"
                  >
                    <Ionicons name="volume-high" size={20} color="white" />
                    <Text className="text-white font-medium ml-2">Speak Response</Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={() => setAudioAnalysis(null)}
                    className="bg-gray-100 rounded-xl py-3 px-6 flex-row items-center"
                  >
                    <Ionicons name="refresh" size={20} color="#374151" />
                    <Text className="text-gray-700 font-medium ml-2">New Recording</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}