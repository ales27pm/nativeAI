import { Audio, AVPlaybackSource } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { transcribeAudio } from './transcribe-audio';
import { AudioData } from '../types/assistant';

export class AudioSystem {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isRecording = false;
  private isPlaying = false;

  constructor() {
    this.setupAudio();
  }

  private async setupAudio(): Promise<void> {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Audio setup error:', error);
    }
  }

  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        console.warn('Already recording');
        return;
      }

      console.log('ARIA: Starting audio recording...');
      
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      this.recording = recording;
      this.isRecording = true;
      
      console.log('ARIA: Recording started');
    } catch (error) {
      console.error('Start recording error:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.isRecording || !this.recording) {
        console.warn('Not currently recording');
        return null;
      }

      console.log('ARIA: Stopping recording...');
      
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.recording = null;
      this.isRecording = false;
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      console.log('ARIA: Recording stopped, file:', uri);
      return uri;
    } catch (error) {
      console.error('Stop recording error:', error);
      throw error;
    }
  }

  async transcribeRecording(audioUri: string): Promise<AudioData> {
    try {
      console.log('ARIA: Transcribing audio...');
      
      const startTime = Date.now();
      const result = await transcribeAudio(audioUri);
      const duration = Date.now() - startTime;

      // Extract transcription from result
      let transcription = '';
      let confidence = 0.8; // Default confidence
      
      if (typeof result === 'string') {
        transcription = result;
      } else if (result && typeof result === 'object') {
        // Handle different response formats
        transcription = result.text || result.transcription || JSON.stringify(result);
        confidence = result.confidence || 0.8;
      }

      const audioData: AudioData = {
        transcription,
        confidence,
        duration: duration / 1000, // Convert to seconds
        timestamp: Date.now(),
        language: 'en', // Could be detected from the transcription service
      };

      console.log('ARIA: Transcription completed:', transcription.substring(0, 100) + '...');
      return audioData;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  async speak(text: string, options?: {
    language?: string;
    pitch?: number;
    rate?: number;
    voice?: string;
  }): Promise<void> {
    try {
      if (this.isPlaying) {
        await Speech.stop();
      }

      console.log('ARIA: Speaking:', text.substring(0, 50) + '...');
      
      const speechOptions: Speech.SpeechOptions = {
        language: options?.language || 'en-US',
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 0.8,
        voice: options?.voice || undefined,
        onStart: () => {
          this.isPlaying = true;
        },
        onDone: () => {
          this.isPlaying = false;
        },
        onStopped: () => {
          this.isPlaying = false;
        },
        onError: (error) => {
          console.error('Speech error:', error);
          this.isPlaying = false;
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
      this.isPlaying = false;
      console.log('ARIA: Speech stopped');
    } catch (error) {
      console.error('Stop speech error:', error);
    }
  }

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Get voices error:', error);
      return [];
    }
  }

  async playAudio(uri: string): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      console.log('ARIA: Playing audio file:', uri);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri } as AVPlaybackSource,
        { shouldPlay: true }
      );
      
      this.sound = sound;
      this.isPlaying = true;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.isPlaying = false;
        }
      });
    } catch (error) {
      console.error('Play audio error:', error);
      throw error;
    }
  }

  async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
      console.log('ARIA: Audio playback stopped');
    } catch (error) {
      console.error('Stop audio error:', error);
    }
  }

  // Voice command processing
  async processVoiceCommand(): Promise<AudioData | null> {
    try {
      console.log('ARIA: Processing voice command...');
      
      await this.startRecording();
      
      // Record for a maximum of 30 seconds, or until manually stopped
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(async () => {
          try {
            const uri = await this.stopRecording();
            if (uri) {
              const audioData = await this.transcribeRecording(uri);
              resolve(audioData);
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        }, 30000); // 30 second timeout

        // Allow manual stopping
        this.recording?.setOnRecordingStatusUpdate((status) => {
          if (!status.isRecording && status.isDoneRecording) {
            clearTimeout(timeout);
          }
        });
      });
    } catch (error) {
      console.error('Voice command processing error:', error);
      return null;
    }
  }

  // Continuous listening mode (for wake word detection, etc.)
  async startContinuousListening(onTranscription: (text: string) => void): Promise<void> {
    // This would implement continuous speech recognition
    // For now, we'll use interval-based recording as a placeholder
    console.log('ARIA: Starting continuous listening mode...');
    
    // Implementation would depend on platform-specific continuous speech recognition
    // This is a simplified version
  }

  async stopContinuousListening(): Promise<void> {
    console.log('ARIA: Stopping continuous listening...');
    await this.stopRecording();
  }

  // Audio analysis
  async analyzeAudioContent(audioUri: string): Promise<{
    transcription: string;
    sentiment: string;
    keywords: string[];
    language: string;
    confidence: number;
  }> {
    try {
      const audioData = await this.transcribeRecording(audioUri);
      
      // Basic analysis - in a real implementation, this would use more sophisticated NLP
      const text = audioData.transcription.toLowerCase();
      
      // Simple sentiment analysis
      const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'wonderful'];
      const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'hate', 'horrible'];
      
      const positiveCount = positiveWords.reduce((count, word) => 
        count + (text.match(new RegExp(word, 'g')) || []).length, 0
      );
      const negativeCount = negativeWords.reduce((count, word) => 
        count + (text.match(new RegExp(word, 'g')) || []).length, 0
      );
      
      let sentiment = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      else if (negativeCount > positiveCount) sentiment = 'negative';
      
      // Extract keywords (simple implementation)
      const words = text.split(/\s+/).filter(word => word.length > 3);
      const wordCount: { [key: string]: number } = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      const keywords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

      return {
        transcription: audioData.transcription,
        sentiment,
        keywords,
        language: audioData.language || 'en',
        confidence: audioData.confidence,
      };
    } catch (error) {
      console.error('Audio analysis error:', error);
      throw error;
    }
  }

  // Status getters
  getIsRecording(): boolean {
    return this.isRecording;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      if (this.sound) {
        await this.stopAudio();
      }
      await Speech.stop();
      console.log('ARIA: Audio system cleaned up');
    } catch (error) {
      console.error('Audio cleanup error:', error);
    }
  }
}

export const audioSystem = new AudioSystem();