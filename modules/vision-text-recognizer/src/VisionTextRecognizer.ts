import { requireNativeModule } from 'expo-modules-core';

const VisionTextRecognizer = requireNativeModule('VisionTextRecognizer');

export async function recognizeText(imageUri: string): Promise<string[]> {
  try {
    const lines = await VisionTextRecognizer.recognize(imageUri);
    return lines;
  } catch (error) {
    console.warn('Vision OCR error:', error);
    return [];
  }
}
