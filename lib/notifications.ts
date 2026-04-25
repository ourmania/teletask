import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save token to database
    await saveDeviceToken(userId, token);

    // Listen for notifications
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { taskId } = response.notification.request.content.data;
      if (taskId) {
        // Navigate to task detail if needed
        console.log('Notification tapped for task:', taskId);
      }
    });

    return () => subscription.remove();
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
}

async function saveDeviceToken(userId: string, token: string) {
  try {
    await supabase.from('device_tokens').upsert(
      {
        user_id: userId,
        token,
      },
      {
        onConflict: 'token',
      }
    );
  } catch (error) {
    console.error('Error saving device token:', error);
  }
}

export async function sendPushNotification(deviceToken: string, title: string, body: string, taskId?: string) {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_token: deviceToken,
        title,
        body,
        data: taskId ? { taskId } : undefined,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}
