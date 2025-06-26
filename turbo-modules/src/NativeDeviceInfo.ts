import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface DeviceInfo {
  deviceModel: string;
  systemVersion: string;
  appVersion: string;
  buildNumber: string;
  bundleId: string;
  deviceId: string;
  isSimulator: boolean;
  deviceType: string;
  screenWidth: number;
  screenHeight: number;
  batteryLevel: number;
  isCharging: boolean;
  networkType: string;
  availableStorage: number;
  totalStorage: number;
  usedMemory: number;
  totalMemory: number;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: number;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: string;
}

export interface Spec extends TurboModule {
  // Device Information
  getDeviceInfo(): Promise<DeviceInfo>;
  
  // Battery & Power
  getBatteryLevel(): Promise<number>;
  isBatteryCharging(): Promise<boolean>;
  
  // Network Information
  getNetworkType(): Promise<string>;
  isNetworkReachable(): Promise<boolean>;
  
  // Storage Information
  getAvailableStorage(): Promise<number>;
  getTotalStorage(): Promise<number>;
  
  // Memory Information
  getUsedMemory(): Promise<number>;
  getTotalMemory(): Promise<number>;
  
  // Location Services
  requestLocationPermission(): Promise<boolean>;
  getCurrentLocation(): Promise<LocationInfo>;
  startLocationUpdates(distanceFilter: number): void;
  stopLocationUpdates(): void;
  
  // Biometric Authentication
  isBiometricAvailable(): Promise<boolean>;
  getBiometricType(): Promise<string>;
  authenticateWithBiometrics(reason: string): Promise<BiometricResult>;
  
  // System Services
  openSettings(): void;
  openURL(url: string): Promise<boolean>;
  shareContent(content: string, title?: string): Promise<boolean>;
  
  // Haptic Feedback
  triggerHapticFeedback(type: string): void;
  
  // Device Capabilities
  hasCamera(): Promise<boolean>;
  hasTorch(): Promise<boolean>;
  setTorchMode(enabled: boolean): Promise<boolean>;
  
  // System Alerts
  showAlert(title: string, message: string, buttons: string[]): Promise<number>;
  
  // Synchronous methods for immediate access
  getDeviceModelSync(): string;
  getSystemVersionSync(): string;
  getBatteryLevelSync(): number;
  
  // Event listeners
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeDeviceInfo');