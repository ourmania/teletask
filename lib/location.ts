import * as Location from 'expo-location';
import { supabase } from './supabase';

export type LocationCoordinate = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

class LocationTracker {
  private isTracking = false;
  private locations: LocationCoordinate[] = [];
  private taskId: string | null = null;
  private watchId: string | null = null;

  async startTracking(taskId: string) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return false;
      }

      this.taskId = taskId;
      this.locations = [];
      this.isTracking = true;

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (location) => {
          const coordinate: LocationCoordinate = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
          };

          this.locations.push(coordinate);
          this.saveLocationToDatabase(coordinate);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopTracking() {
    if (this.watchId) {
      await Location.removeWatchAsync(this.watchId);
    }

    this.isTracking = false;
    return this.locations;
  }

  private async saveLocationToDatabase(coordinate: LocationCoordinate) {
    if (!this.taskId) return;

    try {
      await supabase.from('tracking_locations').insert({
        task_id: this.taskId,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        accuracy: coordinate.accuracy,
        timestamp: new Date(coordinate.timestamp).toISOString(),
      });
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }

  isCurrentlyTracking() {
    return this.isTracking;
  }

  getLocations() {
    return this.locations;
  }

  async getTaskTrack(taskId: string): Promise<LocationCoordinate[]> {
    try {
      const { data, error } = await supabase
        .from('tracking_locations')
        .select('latitude, longitude, accuracy, timestamp')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching track:', error);
        return [];
      }

      return (data || []).map((loc) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: new Date(loc.timestamp).getTime(),
      }));
    } catch (error) {
      console.error('Error fetching track:', error);
      return [];
    }
  }
}

export const locationTracker = new LocationTracker();
