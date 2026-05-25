import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';

export default function App() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    initDatabase().then(() => setReady(true)).catch(e => setErr(e.message));
  }, []);

  if (err) return <View style={s.center}><Text style={{ color: '#ea4335' }}>≥ı ºªØ ß∞‹: {err}</Text></View>;
  if (!ready) return <View style={s.center}><ActivityIndicator size="large" color="#1a73e8" /></View>;

  return <><StatusBar style="light" /><AppNavigator /></>;
}

const s = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f4f7' } });
