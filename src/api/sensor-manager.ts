import { DeviceMotion } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as Brightness from 'expo-brightness';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { SensorData } from '../types/assistant';

export class SensorManager {
  private accelerometerSubscription: any = null;
  private gyroscopeSubscription: any = null;
  private magnetometerSubscription: any = null;
  private locationSubscription: any = null;
  private isCollecting = false;
  private onDataUpdate?: (data: SensorData) => void;
  private sensorData: SensorData = {};

  constructor(onDataUpdate?: (data: SensorData) => void) {
    this.onDataUpdate = onDataUpdate;
  }

  async startCollection(): Promise<void> {
    if (this.isCollecting) return;
    
    console.log('ARIA: Starting sensor collection...');
    this.isCollecting = true;

    try {
      // Start accelerometer
      await this.startAccelerometer();
      
      // Start gyroscope  
      await this.startGyroscope();
      
      // Start magnetometer
      await this.startMagnetometer();
      
      // Start location tracking
      await this.startLocationTracking();
      
      // Start device info monitoring
      await this.startDeviceMonitoring();
      
      console.log('ARIA: All sensors activated');
    } catch (error) {
      console.error('Sensor collection error:', error);
    }
  }

  private async startAccelerometer(): Promise<void> {
    try {
      const { status } = await DeviceMotion.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Motion permission not granted');
        return;
      }

      Accelerometer.setUpdateInterval(1000); // Update every second
      
      this.accelerometerSubscription = Accelerometer.addListener((accelerometerData) => {
        this.sensorData.accelerometer = {
          x: accelerometerData.x,
          y: accelerometerData.y,
          z: accelerometerData.z,
          timestamp: Date.now()
        };
        this.emitUpdate();
      });
    } catch (error) {
      console.error('Accelerometer error:', error);
    }
  }

  private async startGyroscope(): Promise<void> {
    try {
      Gyroscope.setUpdateInterval(1000);
      
      this.gyroscopeSubscription = Gyroscope.addListener((gyroscopeData) => {
        this.sensorData.gyroscope = {
          x: gyroscopeData.x,
          y: gyroscopeData.y,
          z: gyroscopeData.z,
          timestamp: Date.now()
        };
        this.emitUpdate();
      });
    } catch (error) {
      console.error('Gyroscope error:', error);
    }
  }

  private async startMagnetometer(): Promise<void> {
    try {
      Magnetometer.setUpdateInterval(2000); // Less frequent updates
      
      this.magnetometerSubscription = Magnetometer.addListener((magnetometerData) => {
        this.sensorData.magnetometer = {
          x: magnetometerData.x,
          y: magnetometerData.y,
          z: magnetometerData.z,
          timestamp: Date.now()
        };
        this.emitUpdate();
      });
    } catch (error) {
      console.error('Magnetometer error:', error);
    }
  }

  private async startLocationTracking(): Promise<void> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.sensorData.location = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: Date.now()
      };

      // Try to get address
      try {
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (address[0]) {
          this.sensorData.location.address = 
            `${address[0].street || ''} ${address[0].city || ''} ${address[0].region || ''}`.trim();
        }
      } catch (addressError) {
        console.log('Address lookup failed:', addressError);
      }

      // Watch location changes
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 100, // Or when moved 100 meters
        },
        (newLocation) => {
          this.sensorData.location = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy || 0,
            timestamp: Date.now()
          };
          this.emitUpdate();
        }
      );

      this.emitUpdate();
    } catch (error) {
      console.error('Location tracking error:', error);
    }
  }

  private async startDeviceMonitoring(): Promise<void> {
    try {
      // Get battery level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      
      // Get network state
      const networkState = await Network.getNetworkStateAsync();
      
      // Get brightness (iOS only)
      let brightness;
      try {
        brightness = await Brightness.getBrightnessAsync();
      } catch {
        // Brightness not available on this platform
      }

      this.sensorData.deviceInfo = {
        battery: Math.round(batteryLevel * 100),
        brightness: brightness ? Math.round(brightness * 100) : undefined,
        orientation: 'unknown', // Will be updated by motion sensors
        connectivity: networkState.isConnected 
          ? (networkState.type === Network.NetworkStateType.WIFI ? 'wifi' : 'cellular')
          : 'offline'
      };

      // Monitor battery changes
      Battery.addBatteryLevelListener(({ batteryLevel: newLevel }) => {
        if (this.sensorData.deviceInfo) {
          this.sensorData.deviceInfo.battery = Math.round(newLevel * 100);
          this.emitUpdate();
        }
      });

      this.emitUpdate();
    } catch (error) {
      console.error('Device monitoring error:', error);
    }
  }

  private emitUpdate(): void {
    if (this.onDataUpdate) {
      this.onDataUpdate(this.sensorData);
    }
  }

  stopCollection(): void {
    if (!this.isCollecting) return;
    
    console.log('ARIA: Stopping sensor collection...');
    this.isCollecting = false;

    // Clean up subscriptions
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }

    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }

    if (this.magnetometerSubscription) {
      this.magnetometerSubscription.remove();
      this.magnetometerSubscription = null;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    Battery.removeAllListeners('Battery');
  }

  getCurrentData(): SensorData {
    return { ...this.sensorData };
  }

  // Analyze sensor data for patterns
  analyzeMotionPattern(): string {
    const accel = this.sensorData.accelerometer;
    if (!accel) return 'unknown';

    const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
    
    if (magnitude < 0.5) return 'stationary';
    if (magnitude < 2.0) return 'walking';
    if (magnitude < 5.0) return 'jogging';
    return 'intense_movement';
  }

  getDeviceOrientation(): string {
    const accel = this.sensorData.accelerometer;
    if (!accel) return 'unknown';

    const { x, y, z } = accel;
    
    // Determine primary orientation based on gravity
    if (Math.abs(z) > Math.abs(x) && Math.abs(z) > Math.abs(y)) {
      return z > 0 ? 'face_up' : 'face_down';
    } else if (Math.abs(y) > Math.abs(x)) {
      return y > 0 ? 'portrait' : 'portrait_upside_down';
    } else {
      return x > 0 ? 'landscape_left' : 'landscape_right';
    }
  }

  // Get contextual insights from sensor data
  getContextualInsights(): string[] {
    const insights: string[] = [];
    
    const motion = this.analyzeMotionPattern();
    insights.push(`User appears to be ${motion}`);
    
    const orientation = this.getDeviceOrientation();
    insights.push(`Device is ${orientation}`);
    
    if (this.sensorData.deviceInfo) {
      const battery = this.sensorData.deviceInfo.battery;
      if (battery < 20) {
        insights.push('Device battery is low');
      } else if (battery > 80) {
        insights.push('Device battery is well charged');
      }
      
      insights.push(`Connected via ${this.sensorData.deviceInfo.connectivity}`);
    }
    
    if (this.sensorData.location) {
      insights.push(`Location accuracy: ±${this.sensorData.location.accuracy}m`);
      if (this.sensorData.location.address) {
        insights.push(`Currently at: ${this.sensorData.location.address}`);
      }
    }
    
    return insights;
  }

  // Check if user is in a specific context
  isUserInContext(context: 'moving' | 'stationary' | 'low_battery' | 'home'): boolean {
    switch (context) {
      case 'moving':
        return this.analyzeMotionPattern() !== 'stationary';
      case 'stationary':
        return this.analyzeMotionPattern() === 'stationary';
      case 'low_battery':
        return (this.sensorData.deviceInfo?.battery || 100) < 20;
      case 'home':
        // This would need to be configured with user's home location
        return false; // Placeholder
      default:
        return false;
    }
  }
}

export const sensorManager = new SensorManager();