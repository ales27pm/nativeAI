import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions, CameraViewRef } from 'expo-camera';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAssistantStore } from '../state/assistantStore';
import { visionSystem } from '../api/vision-system';
import { reasoningEngine } from '../api/advanced-reasoning';
import { contextEngine } from '../api/context-engine';
import { cn } from '../utils/cn';

export default function VisionScreen({ navigation }: any) {
  const cameraRef = useRef<CameraViewRef>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { updateVisionAnalysis, currentContext } = useAssistantStore();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-6">
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-semibold text-gray-800 mt-4 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-gray-600 text-center mt-2 mb-6">
          ARIA needs camera access to provide visual analysis and computer vision capabilities.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-blue-500 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Grant Camera Access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setShowCamera(false);
        await analyzeImage(photo.uri);
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const selectFromLibrary = async () => {
    try {
      const imageUri = await visionSystem.selectFromLibrary();
      if (imageUri) {
        setCapturedImage(imageUri);
        setShowCamera(false);
        await analyzeImage(imageUri);
      }
    } catch (error) {
      console.error('Library selection error:', error);
      Alert.alert('Error', 'Failed to select image from library.');
    }
  };

  const analyzeImage = async (imageUri: string, customPrompt?: string) => {
    setIsAnalyzing(true);
    
    try {
      console.log('ARIA: Starting image analysis...');
      
      // Perform vision analysis
      const visionAnalysis = await visionSystem.analyzeImage(imageUri, customPrompt);
      updateVisionAnalysis(visionAnalysis);
      
      // Get AI reasoning about the image
      const context = await contextEngine.updateContext(undefined, visionAnalysis);
      
      const reasoningQuery = customPrompt || `I've just analyzed an image and found: ${visionAnalysis.description}. 
      
Objects detected: ${visionAnalysis.objects.join(', ')}
Scene: ${visionAnalysis.scene}
${visionAnalysis.text ? `Text found: ${visionAnalysis.text}` : ''}
${visionAnalysis.emotions ? `Emotional context: ${visionAnalysis.emotions.join(', ')}` : ''}

Based on this visual information and my current context, provide insights, observations, and any recommendations or actions I should consider.`;

      const aiResponse = await reasoningEngine.processQuery({
        query: reasoningQuery,
        context,
        visionData: visionAnalysis,
      });

      setAnalysisResult({
        vision: visionAnalysis,
        reasoning: aiResponse,
      });

      console.log('ARIA: Image analysis completed');
    } catch (error) {
      console.error('Image analysis error:', error);
      Alert.alert('Analysis Error', 'Failed to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeWithCustomPrompt = () => {
    Alert.prompt(
      'Custom Analysis',
      'What would you like me to analyze about this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Analyze',
          onPress: (prompt) => {
            if (prompt && capturedImage) {
              analyzeImage(capturedImage, prompt);
            }
          },
        },
      ],
      'plain-text',
      'Tell me about the colors and mood in this image'
    );
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
          enableTorch={flash}
        />
        
        {/* Camera Overlay */}
        <View className="absolute top-0 left-0 right-0 bottom-0 z-10">
          {/* Header */}
          <SafeAreaView>
            <View className="flex-row items-center justify-between px-4 py-2">
              <Pressable
                onPress={() => setShowCamera(false)}
                className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
              
              <Text className="text-white font-semibold">ARIA Vision</Text>
              
              <Pressable
                onPress={() => setFlash(!flash)}
                className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
              >
                <Ionicons 
                  name={flash ? 'flash' : 'flash-off'} 
                  size={20} 
                  color="white" 
                />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Bottom Controls */}
          <View className="absolute bottom-0 left-0 right-0">
            <SafeAreaView>
              <View className="flex-row items-center justify-between px-8 py-6">
                <Pressable
                  onPress={selectFromLibrary}
                  className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center"
                >
                  <Ionicons name="images" size={24} color="white" />
                </Pressable>
                
                <Pressable
                  onPress={takePicture}
                  className="w-20 h-20 rounded-full bg-white items-center justify-center"
                >
                  <View className="w-16 h-16 rounded-full bg-white border-4 border-gray-300" />
                </Pressable>
                
                <Pressable
                  onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                  className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center"
                >
                  <Ionicons name="camera-reverse" size={24} color="white" />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <View>
            <Text className="text-lg font-semibold text-gray-800">ARIA Vision</Text>
            <Text className="text-sm text-gray-600">Computer Vision Analysis</Text>
          </View>
        </View>
        
        <View className={cn(
          'w-2 h-2 rounded-full',
          isAnalyzing ? 'bg-yellow-500' : 'bg-green-500'
        )} />
      </View>

      <ScrollView className="flex-1">
        {!capturedImage ? (
          /* Initial State */
          <View className="flex-1 justify-center items-center px-6 py-12">
            <Animated.View entering={FadeInDown.delay(100)} className="items-center">
              <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-6">
                <Ionicons name="eye" size={48} color="#3B82F6" />
              </View>
              
              <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
                Visual Intelligence
              </Text>
              <Text className="text-gray-600 text-center mb-8 leading-6">
                Use ARIA's computer vision to analyze images, detect objects, read text, and understand scenes with AI reasoning.
              </Text>
              
              <View className="w-full space-y-3">
                <Pressable
                  onPress={() => setShowCamera(true)}
                  className="bg-blue-500 rounded-xl py-4 px-6 flex-row items-center justify-center"
                >
                  <Ionicons name="camera" size={24} color="white" />
                  <Text className="text-white font-semibold text-lg ml-3">Take Photo</Text>
                </Pressable>
                
                <Pressable
                  onPress={selectFromLibrary}
                  className="bg-white border-2 border-blue-500 rounded-xl py-4 px-6 flex-row items-center justify-center"
                >
                  <Ionicons name="images" size={24} color="#3B82F6" />
                  <Text className="text-blue-500 font-semibold text-lg ml-3">Choose from Library</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        ) : (
          /* Analysis Results */
          <View className="p-4">
            {/* Captured Image */}
            <Animated.View entering={FadeInUp.delay(100)} className="mb-4">
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <Image
                  source={{ uri: capturedImage }}
                  className="w-full h-64 rounded-xl"
                  resizeMode="cover"
                />
                
                <View className="flex-row justify-between mt-4">
                  <Pressable
                    onPress={retakePhoto}
                    className="bg-gray-100 rounded-xl py-3 px-6 flex-row items-center"
                  >
                    <Ionicons name="camera" size={20} color="#374151" />
                    <Text className="text-gray-700 font-medium ml-2">Retake</Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={analyzeWithCustomPrompt}
                    disabled={isAnalyzing}
                    className="bg-blue-500 rounded-xl py-3 px-6 flex-row items-center"
                  >
                    <Ionicons name="search" size={20} color="white" />
                    <Text className="text-white font-medium ml-2">Custom Analysis</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            {/* Analysis Loading */}
            {isAnalyzing && (
              <Animated.View entering={FadeInUp} className="mb-4">
                <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <View className="flex-row items-center justify-center">
                    <View className="flex-row space-x-1 mr-3">
                      <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </View>
                    <Text className="text-gray-600 font-medium">ARIA is analyzing the image...</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Vision Analysis Results */}
            {analysisResult && (
              <Animated.View entering={FadeInUp.delay(200)}>
                <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="eye" size={20} color="#3B82F6" />
                    <Text className="text-lg font-semibold text-gray-800 ml-2">Vision Analysis</Text>
                    <View className="ml-auto bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-green-600 text-xs font-medium">
                        {Math.round(analysisResult.vision.confidence * 100)}% Confidence
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-gray-700 leading-6 mb-4">
                    {analysisResult.vision.description}
                  </Text>
                  
                  {/* Objects */}
                  {analysisResult.vision.objects.length > 0 && (
                    <View className="mb-3">
                      <Text className="text-sm font-medium text-gray-600 mb-2">Objects Detected:</Text>
                      <View className="flex-row flex-wrap">
                        {analysisResult.vision.objects.slice(0, 6).map((obj: string, index: number) => (
                          <View key={index} className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2">
                            <Text className="text-blue-600 text-sm">{obj}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Text if found */}
                  {analysisResult.vision.text && (
                    <View className="mb-3">
                      <Text className="text-sm font-medium text-gray-600 mb-2">Text Found:</Text>
                      <View className="bg-gray-100 rounded-xl p-3">
                        <Text className="text-gray-700 italic">"{analysisResult.vision.text}"</Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Scene Classification */}
                  <View className="flex-row items-center">
                    <Text className="text-sm font-medium text-gray-600 mr-2">Scene:</Text>
                    <View className="bg-purple-100 rounded-full px-3 py-1">
                      <Text className="text-purple-600 text-sm capitalize">{analysisResult.vision.scene}</Text>
                    </View>
                  </View>
                </View>

                {/* AI Reasoning */}
                <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="hardware-chip" size={20} color="#7C3AED" />
                    <Text className="text-lg font-semibold text-gray-800 ml-2">AI Insights</Text>
                    <View className="ml-auto bg-purple-100 px-3 py-1 rounded-full">
                      <Text className="text-purple-600 text-xs font-medium">
                        {analysisResult.reasoning.model.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-gray-700 leading-6">
                    {analysisResult.reasoning.content}
                  </Text>
                  
                  {/* Actions */}
                  {analysisResult.reasoning.actions && analysisResult.reasoning.actions.length > 0 && (
                    <View className="mt-4">
                      <Text className="text-sm font-medium text-gray-600 mb-2">Suggested Actions:</Text>
                      {analysisResult.reasoning.actions.slice(0, 3).map((action: string, index: number) => (
                        <View key={index} className="flex-row items-center mb-1">
                          <View className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2" />
                          <Text className="text-gray-700 text-sm flex-1">{action}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}