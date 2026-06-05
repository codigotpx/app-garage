import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { AntDesign } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'dark',
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Control',
          tabBarIcon: ({ color }) => <AntDesign name="control" size={25} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <AntDesign size={25} name="menu" color={color} />,
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color }) => <FontAwesome5 size={25} name="tools" color={color} />,
        }}
      />
    </Tabs>
  );
}
