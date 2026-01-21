
import { Platform } from '../types';

export const detectPlatform = (): Platform => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // 1. Check for injected "window.x5NativePlatform" (most reliable if script injected)
  if ((window as any).x5NativePlatform === 'ios') return 'ios';
  if ((window as any).x5NativePlatform === 'android') return 'android';

  // 2. Check for custom User Agent tokens
  if (/X5IOSClient/i.test(userAgent) || /X5_IOS_CLIENT/i.test(userAgent)) {
    return 'ios';
  }

  if (/X5AndroidClient/i.test(userAgent) || /X5_ANDROID_CLIENT/i.test(userAgent)) {
    return 'android';
  }

  // 3. Fallback: Capcitor/Ionic checks if relevant in future

  return 'web';
};
