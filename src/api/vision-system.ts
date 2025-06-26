import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { openai } from './openai';
import { anthropic } from './anthropic';
import { VisionAnalysis } from '../types/assistant';

export class VisionSystem {
  private currentModel: 'openai' | 'anthropic' = 'openai';

  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }

  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Media library permission error:', error);
      return false;
    }
  }

  async capturePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Photo capture error:', error);
      return null;
    }
  }

  async selectFromLibrary(): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error('Media library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Library selection error:', error);
      return null;
    }
  }

  private async convertImageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw error;
    }
  }

  async analyzeWithOpenAI(imageUri: string, prompt?: string): Promise<VisionAnalysis> {
    try {
      const base64 = await this.convertImageToBase64(imageUri);
      
      const analysisPrompt = prompt || `Analyze this image comprehensively. Provide:
1. A detailed description of what you see
2. List of objects and people identified
3. Any text present in the image
4. Emotional context or mood if applicable
5. Scene classification (indoor/outdoor, setting type)
6. Notable details or interesting observations
7. Your confidence level in this analysis

Be thorough and specific in your analysis.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      
      return this.parseAnalysis(analysisText, 'openai');
    } catch (error) {
      console.error('OpenAI vision analysis error:', error);
      throw error;
    }
  }

  async analyzeWithAnthropic(imageUri: string, prompt?: string): Promise<VisionAnalysis> {
    try {
      const base64 = await this.convertImageToBase64(imageUri);
      
      const analysisPrompt = prompt || `Analyze this image comprehensively. Provide:
1. A detailed description of what you see
2. List of objects and people identified  
3. Any text present in the image
4. Emotional context or mood if applicable
5. Scene classification (indoor/outdoor, setting type)
6. Notable details or interesting observations
7. Your confidence level in this analysis

Be thorough and specific in your analysis.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt,
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64,
                },
              },
            ],
          },
        ],
      });

      const analysisText = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      return this.parseAnalysis(analysisText, 'anthropic');
    } catch (error) {
      console.error('Anthropic vision analysis error:', error);
      throw error;
    }
  }

  private parseAnalysis(analysisText: string, model: string): VisionAnalysis {
    // Extract objects mentioned in the analysis
    const objectMatches = analysisText.match(/(?:objects?|items?|things?).*?:(.*?)(?=\\n|\\.|$)/gi);
    const objects = objectMatches 
      ? objectMatches.flatMap(match => 
          match.split(/[,;]/).map(obj => obj.replace(/^.*?:/, '').trim()).filter(Boolean)
        )
      : [];

    // Extract text if mentioned
    const textMatch = analysisText.match(/(?:text|writing|words?).*?:([^\\n]*)/i);
    const extractedText = textMatch ? textMatch[1].trim() : undefined;

    // Extract emotions if mentioned
    const emotionMatches = analysisText.match(/(?:emotion|mood|feeling).*?:([^\\n]*)/i);
    const emotions = emotionMatches 
      ? emotionMatches[1].split(/[,;]/).map(e => e.trim()).filter(Boolean)
      : [];

    // Extract scene classification
    const sceneMatch = analysisText.match(/(?:scene|setting|location|environment).*?:([^\\n]*)/i);
    const scene = sceneMatch ? sceneMatch[1].trim() : 'unclassified';

    // Extract confidence level
    const confidenceMatch = analysisText.match(/confidence.*?(\d+)%/i);
    let confidence = 0.8; // Default confidence
    if (confidenceMatch) {
      confidence = parseInt(confidenceMatch[1]) / 100;
    } else {
      // Assess confidence based on language used
      if (analysisText.includes('clearly') || analysisText.includes('definitely')) {
        confidence = 0.9;
      } else if (analysisText.includes('appears') || analysisText.includes('seems')) {
        confidence = 0.7;
      } else if (analysisText.includes('might') || analysisText.includes('possibly')) {
        confidence = 0.6;
      }
    }

    return {
      description: analysisText,
      objects: objects.slice(0, 10), // Limit to top 10 objects
      text: extractedText,
      emotions: emotions.length > 0 ? emotions : undefined,
      scene,
      confidence,
      timestamp: Date.now(),
    };
  }

  async analyzeImage(imageUri: string, prompt?: string, preferredModel?: 'openai' | 'anthropic'): Promise<VisionAnalysis> {
    const model = preferredModel || this.currentModel;
    
    try {
      console.log(`ARIA: Analyzing image with ${model}...`);
      
      if (model === 'anthropic') {
        return await this.analyzeWithAnthropic(imageUri, prompt);
      } else {
        return await this.analyzeWithOpenAI(imageUri, prompt);
      }
    } catch (error) {
      console.error(`${model} analysis failed, trying fallback:`, error);
      
      // Try the other model as fallback
      const fallbackModel = model === 'openai' ? 'anthropic' : 'openai';
      try {
        if (fallbackModel === 'anthropic') {
          return await this.analyzeWithAnthropic(imageUri, prompt);
        } else {
          return await this.analyzeWithOpenAI(imageUri, prompt);
        }
      } catch (fallbackError) {
        console.error('Both vision models failed:', fallbackError);
        throw new Error('Vision analysis failed with all available models');
      }
    }
  }

  // Specialized analysis methods
  async identifyObjects(imageUri: string): Promise<string[]> {
    const analysis = await this.analyzeImage(imageUri, 
      'List all objects, items, and things you can identify in this image. Be specific and comprehensive.'
    );
    return analysis.objects;
  }

  async readText(imageUri: string): Promise<string | null> {
    const analysis = await this.analyzeImage(imageUri, 
      'Extract and transcribe all text visible in this image. Include any handwritten text, signs, labels, or printed text you can see.'
    );
    return analysis.text || null;
  }

  async analyzeMood(imageUri: string): Promise<string[]> {
    const analysis = await this.analyzeImage(imageUri, 
      'Analyze the emotional context and mood of this image. Consider facial expressions, body language, setting, and overall atmosphere.'
    );
    return analysis.emotions || [];
  }

  async classifyScene(imageUri: string): Promise<string> {
    const analysis = await this.analyzeImage(imageUri, 
      'Classify the scene and setting of this image. Determine if it is indoor/outdoor, the type of location, and the general context.'
    );
    return analysis.scene;
  }

  // Real-time analysis for camera stream (placeholder for future implementation)
  async analyzeFrame(frameData: any): Promise<VisionAnalysis> {
    // This would be implemented with react-native-vision-camera frame processors
    // For now, return a placeholder
    throw new Error('Real-time frame analysis not yet implemented');
  }

  setModel(model: 'openai' | 'anthropic'): void {
    this.currentModel = model;
    console.log(`ARIA: Vision system switched to ${model}`);
  }

  getCurrentModel(): string {
    return this.currentModel;
  }
}

export const visionSystem = new VisionSystem();