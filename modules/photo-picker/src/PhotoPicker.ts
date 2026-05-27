import { requireNativeModule } from "expo-modules-core";

const PhotoPicker = requireNativeModule("PhotoPicker");

export async function pickPhotoFromLibrary(): Promise<string | null> {
  try {
    const uri = await PhotoPicker.pickFromLibrary();
    return uri as string;
  } catch (error: any) {
    if (error?.message === "CANCELLED" || error?.code === "CANCELLED") {
      return null;
    }
    console.warn("PhotoPicker error:", error);
    return null;
  }
}

export function isPhotoPickerAvailable(): boolean {
  try {
    return PhotoPicker.isAvailable() as boolean;
  } catch {
    return false;
  }
}
