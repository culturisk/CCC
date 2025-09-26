import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

export const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false
  });

  useEffect(() => {
    const setupCapacitor = async () => {
      const platform = Capacitor.getPlatform();
      setIsNative(platform !== 'web');

      if (platform !== 'web') {
        // Configure status bar
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f0f23' });

        // Hide splash screen
        await SplashScreen.hide();

        // Request permissions
        await requestPermissions();

        // Set up app listeners
        App.addListener('appStateChange', ({ isActive }) => {
          console.log('App state changed. Is active?', isActive);
        });
      }
    };

    const requestPermissions = async () => {
      try {
        // Request location permission
        const locationPermission = await Geolocation.requestPermissions();
        
        // Request notification permission
        const notificationPermission = await LocalNotifications.requestPermissions();
        
        setPermissions({
          location: locationPermission.location === 'granted',
          notifications: notificationPermission.display === 'granted'
        });
      } catch (error) {
        console.error('Permission request failed:', error);
      }
    };

    setupCapacitor();
  }, []);

  const getCurrentPosition = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      return position;
    } catch (error) {
      console.error('Geolocation error:', error);
      return null;
    }
  };

  const scheduleNotification = async (title, body, date) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: date },
            actionTypeId: 'TASK_REMINDER',
            extra: null
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Notification scheduling failed:', error);
      return false;
    }
  };

  const exitApp = () => {
    if (isNative) {
      App.exitApp();
    }
  };

  return {
    isNative,
    permissions,
    getCurrentPosition,
    scheduleNotification,
    exitApp
  };
};

export default useCapacitor;