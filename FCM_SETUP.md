# Firebase Cloud Messaging (FCM) Setup

This app is configured to send push notifications to technicians when new tasks are assigned.

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name it something like "Task Manager App"
4. Enable Google Analytics if desired
5. Create the project

### 2. Get FCM Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click the **Cloud Messaging** tab
3. Copy your **Server Key** (also called "Server API Key")
4. Copy your **Sender ID**

### 3. Configure Supabase Edge Function

You need to add your Firebase Server Key as a secret to your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **send-push-notification**
3. Add a new secret named `FCM_SERVER_KEY` with your Firebase Server Key value

The Edge Function will automatically use this secret to send notifications.

### 4. Client-Side Setup

When a user logs in, the app automatically:
- Requests push notification permissions
- Gets an Expo push token (for development/testing)
- Or gets an FCM token (for production with native build)
- Saves the token to the `device_tokens` table in the database

### 5. Send Notifications When Tasks Change

The notification system is triggered when:
- A new task is created with status `'new'` → notification sent to assigned technician
- Task status changes to any other status → optional notification to tracking team

### 6. Testing

To test push notifications locally:

```typescript
// In your code, you can test sending:
import { sendPushNotification } from '@/lib/notifications';

// Get a device token from the device_tokens table
// Then send a test notification:
await sendPushNotification(
  'device_token_here',
  'Test Title',
  'Test Message',
  'task_id_here'
);
```

## How Tracking Works

### Location Tracking
- **Start**: When status changes from `accepted` → `en_route`
- **Recording**: GPS coordinates are recorded every 5 seconds or 10 meters
- **Stop**: When status changes from `in_progress` → `done`
- **Storage**: All coordinates are saved to the `tracking_locations` table

### Track Visualization
- The track map shows:
  - Green circle: Starting point
  - Blue circle: Ending point
  - Purple line: The path taken
  - Location count: Total number of points recorded

### Permissions Required
- **Location**: `expo-location` permissions are requested when starting a task
- Must grant "Allow While Using App" or "Allow Always" permissions

## Database Tables

### `device_tokens`
Stores FCM device tokens per user for sending notifications.

```sql
- id: uuid
- user_id: uuid (references auth.users)
- token: text (unique)
- created_at: timestamptz
```

### `tracking_locations`
Stores GPS coordinates for task tracking.

```sql
- id: uuid
- task_id: uuid (references tasks)
- latitude: float
- longitude: float
- accuracy: float (in meters)
- timestamp: timestamptz
- created_at: timestamptz
```

## Troubleshooting

### Push notifications not received
- Check that `FCM_SERVER_KEY` is set in Edge Function secrets
- Verify device token is saved in `device_tokens` table
- Check browser/device notification permissions

### No location data recorded
- Ensure location permissions are granted to the app
- Check that tracking started (status changed to `en_route`)
- Verify `tracking_locations` table has data

### Track not showing on map
- Need at least 2 location points to draw a line
- Check browser console for any coordinate projection errors

## Production Considerations

1. **Native Build**: Use Expo Dev Client or EAS Build to generate native APK/IPA with native location support
2. **Background Location**: For true background tracking, requires native build with background task permissions
3. **Battery**: Implement adaptive tracking intervals based on battery level
4. **Privacy**: Inform users that location is being tracked during task execution
