/**
 * @format
 */

import {AppRegistry} from 'react-native';
import 'react-native-get-random-values';
import App from './App';
import {name as appName} from './app.json';
import crashlytics from '@react-native-firebase/crashlytics';

// ✅ Global Error Handler - Catch all unhandled errors
const errorHandler = (error, isFatal) => {
  console.error('🚨 [CRASHLYTICS] Global Error Handler:', error, 'isFatal:', isFatal);
  
  try {
    // Log to Crashlytics
    if (error instanceof Error) {
      crashlytics().recordError(error);
    } else {
      crashlytics().recordError(new Error(String(error)));
    }
    
    // Log additional context
    crashlytics().log(`Unhandled Error: ${error?.message || 'Unknown error'}`);
    if (error?.stack) {
      crashlytics().log(`Stack: ${error.stack}`);
    }
    crashlytics().setAttribute('error_fatal', isFatal ? 'true' : 'false');
  } catch (crashlyticsError) {
    console.error('❌ [CRASHLYTICS] Error in error handler:', crashlyticsError);
  }
};

// ✅ Set global error handler - check if ErrorUtils is available
try {
  if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
    global.ErrorUtils.setGlobalHandler(errorHandler);
    // console.log('✅ [CRASHLYTICS] Global error handler set');
  } else {
    console.warn('⚠️ [CRASHLYTICS] ErrorUtils not available, skipping global error handler');
  }
} catch (error) {
  console.warn('⚠️ [CRASHLYTICS] Could not set global error handler:', error);
}

AppRegistry.registerComponent(appName, () => App);
