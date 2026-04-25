import { View, StyleSheet, Dimensions } from 'react-native';
import { LocationCoordinate } from '@/lib/location';
import { Colors } from '@/lib/theme';

const TILE_URL = 'https://tile.openstreetmap.org';

type TrackMapProps = {
  locations: LocationCoordinate[];
};

function degreesToMeters(lat: number, lng: number) {
  const R = 6371000; // Earth radius in meters
  return {
    x: (lng * Math.PI * R) / 180,
    y: (Math.log(Math.tan((Math.PI * (90 + lat)) / 360)) * R),
  };
}

function projectToCanvas(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  width: number,
  height: number
) {
  const tileSize = 256;
  const scale = tileSize * Math.pow(2, zoom);

  const centerMeters = degreesToMeters(centerLat, centerLng);
  const pointMeters = degreesToMeters(lat, lng);

  const x = ((pointMeters.x - centerMeters.x) / scale) * width + width / 2;
  const y = ((pointMeters.y - centerMeters.y) / scale) * height + height / 2;

  return { x, y };
}

export function TrackMap({ locations }: TrackMapProps) {
  if (locations.length === 0) {
    return (
      <View style={styles.emptyMap}>
        <View style={styles.emptyMapContent} />
      </View>
    );
  }

  // Calculate bounding box
  const lats = locations.map((l) => l.latitude);
  const lngs = locations.map((l) => l.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const width = Dimensions.get('window').width - 32;
  const height = 300;

  // Estimate zoom level based on bounds
  const latDelta = maxLat - minLat;
  const lngDelta = maxLng - minLng;
  const zoom = Math.max(
    0,
    Math.min(
      18,
      Math.floor(
        Math.log2(360 / Math.max(latDelta * 1.2, lngDelta * 1.2))
      )
    )
  );

  // Project points
  const projectedPoints = locations.map((loc) =>
    projectToCanvas(loc.latitude, loc.longitude, centerLat, centerLng, zoom, width, height)
  );

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${Colors.surface}"/>

      <!-- Track line -->
      <polyline
        points="${projectedPoints.map((p) => `${p.x},${p.y}`).join(' ')}"
        fill="none"
        stroke="${Colors.statusEnRoute}"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.8"
      />

      <!-- Start point (green) -->
      <circle cx="${projectedPoints[0].x}" cy="${projectedPoints[0].y}" r="6" fill="${Colors.statusDone}" opacity="0.9"/>
      <circle cx="${projectedPoints[0].x}" cy="${projectedPoints[0].y}" r="10" fill="none" stroke="${Colors.statusDone}" stroke-width="2" opacity="0.4"/>

      <!-- End point (blue) -->
      <circle cx="${projectedPoints[projectedPoints.length - 1].x}" cy="${projectedPoints[projectedPoints.length - 1].y}" r="6" fill="${Colors.statusNew}" opacity="0.9"/>
      <circle cx="${projectedPoints[projectedPoints.length - 1].x}" cy="${projectedPoints[projectedPoints.length - 1].y}" r="10" fill="none" stroke="${Colors.statusNew}" stroke-width="2" opacity="0.4"/>
    </svg>
  `;

  return (
    <View style={styles.mapContainer}>
      <View
        style={[styles.mapCanvas, { width, height }]}
        // Using native SVG would require expo-svg, so we'll show a placeholder with the data
      >
        {/* SVG rendering would go here. For web, we can use a simple SVG */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={styles.svgContainer}
        >
          <rect width={width} height={height} fill={Colors.surface} />
          {/* Track line */}
          <polyline
            points={projectedPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={Colors.statusEnRoute}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
          {/* Start point */}
          <circle
            cx={projectedPoints[0].x}
            cy={projectedPoints[0].y}
            r={6}
            fill={Colors.statusDone}
            opacity={0.9}
          />
          {/* End point */}
          <circle
            cx={projectedPoints[projectedPoints.length - 1].x}
            cy={projectedPoints[projectedPoints.length - 1].y}
            r={6}
            fill={Colors.statusNew}
            opacity={0.9}
          />
        </svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  mapCanvas: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  svgContainer: {
    width: '100%',
    height: '100%',
  },
  emptyMap: {
    height: 300,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMapContent: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.border,
  },
});
