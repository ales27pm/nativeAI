import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import VisionScreen from '../screens/VisionScreen';
import AudioScreen from '../screens/AudioScreen';
import SensorsScreen from '../screens/SensorsScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import AutonomousScreen from '../screens/AutonomousScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Vision') {
            iconName = focused ? 'eye' : 'eye-outline';
          } else if (route.name === 'Audio') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'Analysis') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'ARIA' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Tab.Screen 
        name="Vision" 
        component={VisionScreen}
        options={{ title: 'Vision' }}
      />
      <Tab.Screen 
        name="Audio" 
        component={AudioScreen}
        options={{ title: 'Voice' }}
      />
      <Tab.Screen 
        name="Analysis" 
        component={AnalysisScreen}
        options={{ title: 'Analysis' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="Sensors" 
          component={SensorsScreen}
          options={{
            headerShown: true,
            title: 'Sensor Data',
            headerStyle: { backgroundColor: 'white' },
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen 
          name="Autonomous" 
          component={AutonomousScreen}
          options={{
            headerShown: true,
            title: 'Autonomous Mode',
            headerStyle: { backgroundColor: 'white' },
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}