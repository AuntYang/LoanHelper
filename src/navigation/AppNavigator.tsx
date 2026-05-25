import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../models/types';
import { Colors } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import CaseDetailScreen from '../screens/CaseDetailScreen';
import DocumentManagerScreen from '../screens/DocumentManagerScreen';
import InfoExtractorScreen from '../screens/InfoExtractorScreen';
import PdfCompilerScreen from '../screens/PdfCompilerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.background },
      }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '贷款助手' }} />
        <Stack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: '案件详情' }} />
        <Stack.Screen name="DocumentManager" component={DocumentManagerScreen} options={{ title: '资料管理' }} />
        <Stack.Screen name="InfoExtractor" component={InfoExtractorScreen} options={{ title: '信息提取' }} />
        <Stack.Screen name="PdfCompiler" component={PdfCompilerScreen} options={{ title: '编译PDF' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
