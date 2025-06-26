import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import { useAssistantStore } from '../../state/assistantStore';

// Mock the assistant store
jest.mock('../../state/assistantStore', () => ({
  useAssistantStore: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
};

// Mock sensor manager
jest.mock('../../api/sensor-manager', () => ({
  sensorManager: {
    onDataUpdate: null,
    startCollection: jest.fn(),
    stopCollection: jest.fn(),
  },
}));

// Mock context engine
jest.mock('../../api/context-engine', () => ({
  contextEngine: {
    getContextSummary: jest.fn(() => 'Test context summary'),
  },
}));

// Mock autonomous system
jest.mock('../../api/autonomous-system', () => ({
  autonomousSystem: {
    getSystemStatus: jest.fn(() => ({
      isActive: false,
      activeTasks: 0,
      pendingTasks: 2,
      completedTasks: 5,
      backgroundTaskRegistered: true,
    })),
    startAutonomousMode: jest.fn(),
    stopAutonomousMode: jest.fn(),
  },
}));

const mockStoreState = {
  isActive: false,
  currentMode: 'chat',
  sensorData: {
    deviceInfo: {
      battery: 85,
      connectivity: 'wifi',
    },
  },
  isCollectingSensors: false,
  setActive: jest.fn(),
  setMode: jest.fn(),
  updateSensorData: jest.fn(),
  toggleSensorCollection: jest.fn(),
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAssistantStore as jest.Mock).mockReturnValue(mockStoreState);
  });

  it('renders correctly when ARIA is inactive', () => {
    const { getByText, getByTestId } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    expect(getByText('ARIA')).toBeTruthy();
    expect(getByText('Inactive')).toBeTruthy();
    expect(getByText('Activate ARIA')).toBeTruthy();
  });

  it('renders correctly when ARIA is active', () => {
    const activeStoreState = {
      ...mockStoreState,
      isActive: true,
    };
    (useAssistantStore as jest.Mock).mockReturnValue(activeStoreState);

    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Deactivate ARIA')).toBeTruthy();
  });

  it('displays system status when active', () => {
    const activeStoreState = {
      ...mockStoreState,
      isActive: true,
    };
    (useAssistantStore as jest.Mock).mockReturnValue(activeStoreState);

    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    expect(getByText('System Status')).toBeTruthy();
    expect(getByText('85%')).toBeTruthy(); // Battery level
    expect(getByText('wifi')).toBeTruthy(); // Connectivity
  });

  it('handles ARIA activation', async () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    const activateButton = getByText('Activate ARIA');
    fireEvent.press(activateButton);

    await waitFor(() => {
      expect(mockStoreState.setActive).toHaveBeenCalledWith(true);
    });
  });

  it('handles ARIA deactivation', async () => {
    const activeStoreState = {
      ...mockStoreState,
      isActive: true,
    };
    (useAssistantStore as jest.Mock).mockReturnValue(activeStoreState);

    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    const deactivateButton = getByText('Deactivate ARIA');
    fireEvent.press(deactivateButton);

    await waitFor(() => {
      expect(activeStoreState.setActive).toHaveBeenCalledWith(false);
    });
  });

  it('navigates to different modes correctly', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    // Test Chat Mode navigation
    const chatMode = getByText('Chat Mode');
    fireEvent.press(chatMode);
    expect(mockStoreState.setMode).toHaveBeenCalledWith('chat');
    expect(mockNavigate).toHaveBeenCalledWith('Chat');

    // Test Vision Mode navigation
    const visionMode = getByText('Observation Mode');
    fireEvent.press(visionMode);
    expect(mockStoreState.setMode).toHaveBeenCalledWith('observe');
    expect(mockNavigate).toHaveBeenCalledWith('Vision');

    // Test Analysis Mode navigation
    const analysisMode = getByText('Analysis Mode');
    fireEvent.press(analysisMode);
    expect(mockStoreState.setMode).toHaveBeenCalledWith('analyze');
    expect(mockNavigate).toHaveBeenCalledWith('Analysis');

    // Test Autonomous Mode navigation
    const autonomousMode = getByText('Autonomous Mode');
    fireEvent.press(autonomousMode);
    expect(mockStoreState.setMode).toHaveBeenCalledWith('autonomous');
    expect(mockNavigate).toHaveBeenCalledWith('Autonomous');
  });

  it('displays quick access buttons when active', () => {
    const activeStoreState = {
      ...mockStoreState,
      isActive: true,
    };
    (useAssistantStore as jest.Mock).mockReturnValue(activeStoreState);

    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    expect(getByText('Quick Access')).toBeTruthy();
    expect(getByText('Voice')).toBeTruthy();
    expect(getByText('Camera')).toBeTruthy();
    expect(getByText('Sensors')).toBeTruthy();
  });

  it('handles quick access navigation', () => {
    const activeStoreState = {
      ...mockStoreState,
      isActive: true,
    };
    (useAssistantStore as jest.Mock).mockReturnValue(activeStoreState);

    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    // Test Voice quick access
    const voiceButton = getByText('Voice');
    fireEvent.press(voiceButton);
    expect(mockNavigate).toHaveBeenCalledWith('Audio');

    // Test Camera quick access
    const cameraButton = getByText('Camera');
    fireEvent.press(cameraButton);
    expect(mockNavigate).toHaveBeenCalledWith('Vision');

    // Test Sensors quick access
    const sensorsButton = getByText('Sensors');
    fireEvent.press(sensorsButton);
    expect(mockNavigate).toHaveBeenCalledWith('Sensors');
  });

  it('displays mode selection correctly', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    expect(getByText('Assistant Modes')).toBeTruthy();
    expect(getByText('Interactive conversation with AI reasoning')).toBeTruthy();
    expect(getByText('Visual analysis and environment monitoring')).toBeTruthy();
    expect(getByText('Deep sensor and context analysis')).toBeTruthy();
    expect(getByText('Self-directed actions and monitoring')).toBeTruthy();
  });

  it('shows current mode selection', () => {
    const chatModeState = {
      ...mockStoreState,
      currentMode: 'chat',
    };
    (useAssistantStore as jest.Mock).mockReturnValue(chatModeState);

    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );

    // Chat mode should be highlighted/selected
    expect(getByText('Chat Mode')).toBeTruthy();
  });
});