import { sensorManager } from '../../api/sensor-manager';

// Mock Expo sensors
jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  },
  Accelerometer: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    setUpdateInterval: jest.fn(),
  },
  Gyroscope: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    setUpdateInterval: jest.fn(),
  },
  Magnetometer: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    setUpdateInterval: jest.fn(),
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      },
    })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        street: 'Market St',
        city: 'San Francisco',
        region: 'CA',
      },
    ])
  ),
  watchPositionAsync: jest.fn(() => 
    Promise.resolve({ remove: jest.fn() })
  ),
}));

jest.mock('expo-battery', () => ({
  getBatteryLevelAsync: jest.fn(() => Promise.resolve(0.85)),
  addBatteryLevelListener: jest.fn(),
  removeAllListeners: jest.fn(),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      type: 'WIFI',
    })
  ),
}));

describe('Sensor Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Motion Analysis', () => {
    it('should analyze motion patterns correctly', () => {
      // Test stationary motion
      sensorManager.sensorData = {
        accelerometer: { x: 0.01, y: 0.02, z: 9.81, timestamp: Date.now() },
      };
      
      expect(sensorManager.analyzeMotionPattern()).toBe('stationary');

      // Test walking motion
      sensorManager.sensorData = {
        accelerometer: { x: 1.5, y: 0.8, z: 9.5, timestamp: Date.now() },
      };
      
      expect(sensorManager.analyzeMotionPattern()).toBe('walking');

      // Test intense movement
      sensorManager.sensorData = {
        accelerometer: { x: 6.0, y: 4.0, z: 8.0, timestamp: Date.now() },
      };
      
      expect(sensorManager.analyzeMotionPattern()).toBe('intense_movement');
    });

    it('should determine device orientation correctly', () => {
      // Test face up orientation
      sensorManager.sensorData = {
        accelerometer: { x: 0.1, y: 0.1, z: 9.8, timestamp: Date.now() },
      };
      
      expect(sensorManager.getDeviceOrientation()).toBe('face_up');

      // Test portrait orientation
      sensorManager.sensorData = {
        accelerometer: { x: 0.1, y: 9.8, z: 0.1, timestamp: Date.now() },
      };
      
      expect(sensorManager.getDeviceOrientation()).toBe('portrait');

      // Test landscape orientation
      sensorManager.sensorData = {
        accelerometer: { x: 9.8, y: 0.1, z: 0.1, timestamp: Date.now() },
      };
      
      expect(sensorManager.getDeviceOrientation()).toBe('landscape_left');
    });
  });

  describe('Context Analysis', () => {
    beforeEach(() => {
      sensorManager.sensorData = {
        accelerometer: { x: 0.1, y: 0.2, z: 9.8, timestamp: Date.now() },
        location: { 
          latitude: 37.7749, 
          longitude: -122.4194, 
          accuracy: 10, 
          timestamp: Date.now(),
          address: 'San Francisco, CA'
        },
        deviceInfo: {
          battery: 85,
          connectivity: 'wifi',
          orientation: 'portrait',
        },
      };
    });

    it('should generate contextual insights', () => {
      const insights = sensorManager.getContextualInsights();
      
      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(insight => insight.includes('stationary'))).toBe(true);
      expect(insights.some(insight => insight.includes('San Francisco'))).toBe(true);
      expect(insights.some(insight => insight.includes('wifi'))).toBe(true);
    });

    it('should check user context correctly', () => {
      expect(sensorManager.isUserInContext('stationary')).toBe(true);
      expect(sensorManager.isUserInContext('moving')).toBe(false);
      expect(sensorManager.isUserInContext('low_battery')).toBe(false);
    });

    it('should detect low battery context', () => {
      sensorManager.sensorData.deviceInfo = {
        battery: 15,
        connectivity: 'wifi',
        orientation: 'portrait',
      };
      
      expect(sensorManager.isUserInContext('low_battery')).toBe(true);
    });
  });

  describe('Sensor Collection', () => {
    it('should start sensor collection successfully', async () => {
      await sensorManager.startCollection();
      
      // Verify that sensor listeners are set up
      const { Accelerometer, Gyroscope, Magnetometer } = require('expo-sensors');
      expect(Accelerometer.addListener).toHaveBeenCalled();
      expect(Gyroscope.addListener).toHaveBeenCalled();
      expect(Magnetometer.addListener).toHaveBeenCalled();
    });

    it('should stop sensor collection and cleanup', () => {
      sensorManager.stopCollection();
      
      // Verify cleanup
      expect(sensorManager.isCollecting).toBe(false);
    });

    it('should handle permission denials gracefully', async () => {
      // Mock permission denial
      require('expo-sensors').DeviceMotion.requestPermissionsAsync.mockResolvedValueOnce({
        status: 'denied'
      });

      await sensorManager.startCollection();
      
      // Should not throw error, should handle gracefully
      expect(true).toBe(true); // Test passes if no error thrown
    });
  });

  describe('Data Processing', () => {
    it('should get current data snapshot', () => {
      const testData = {
        accelerometer: { x: 1.0, y: 2.0, z: 9.8, timestamp: Date.now() },
        location: { latitude: 37.7749, longitude: -122.4194, accuracy: 10, timestamp: Date.now() },
      };
      
      sensorManager.sensorData = testData;
      const currentData = sensorManager.getCurrentData();
      
      expect(currentData).toEqual(testData);
      expect(currentData).not.toBe(testData); // Should be a copy
    });

    it('should handle missing sensor data gracefully', () => {
      sensorManager.sensorData = {};
      
      expect(sensorManager.analyzeMotionPattern()).toBe('unknown');
      expect(sensorManager.getDeviceOrientation()).toBe('unknown');
      expect(sensorManager.getContextualInsights()).toBeInstanceOf(Array);
    });
  });
});