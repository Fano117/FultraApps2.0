/**
 * HERE Maps WebView Wrapper Component
 *
 * Este componente proporciona una integración de HERE Maps usando WebView
 * como alternativa al proveedor nativo de Google Maps.
 *
 * Características:
 * - Renderizado de mapas HERE usando JavaScript API
 * - Comunicación bidireccional con React Native
 * - Soporte para marcadores, polilíneas y círculos
 * - Control de cámara y animaciones
 * - Estilos de mapa personalizables
 */

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { config } from '@/shared/config/environments';

export interface HereMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  icon?: 'car' | 'location' | 'flag' | 'default';
  color?: string;
}

export interface HereMapPolyline {
  id: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  color?: string;
  width?: number;
}

export interface HereMapCircle {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface HereMapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface HereMapWebViewProps {
  apiKey?: string;
  initialRegion?: HereMapRegion;
  markers?: HereMapMarker[];
  polylines?: HereMapPolyline[];
  circles?: HereMapCircle[];
  showTraffic?: boolean;
  mapStyle?: 'normal' | 'satellite' | 'terrain' | 'traffic' | 'logistics';
  onMapReady?: () => void;
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  style?: any;
}

export interface HereMapWebViewRef {
  animateToRegion: (region: HereMapRegion, duration?: number) => void;
  addMarker: (marker: HereMapMarker) => void;
  removeMarker: (markerId: string) => void;
  addPolyline: (polyline: HereMapPolyline) => void;
  removePolyline: (polylineId: string) => void;
  addCircle: (circle: HereMapCircle) => void;
  removeCircle: (circleId: string) => void;
  setMapStyle: (style: string) => void;
  setTrafficVisible: (visible: boolean) => void;
  clearAll: () => void;
}

const HereMapWebViewComponent = forwardRef<HereMapWebViewRef, HereMapWebViewProps>(
  (
    {
      apiKey = config.hereMapsApiKey,
      initialRegion = {
        latitude: 19.4326,
        longitude: -99.1332,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      markers = [],
      polylines = [],
      circles = [],
      showTraffic = false,
      mapStyle = 'normal',
      onMapReady,
      onMarkerPress,
      onMapPress,
      style,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);
    const [isReady, setIsReady] = useState(false);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      animateToRegion: (region: HereMapRegion, duration = 500) => {
        sendMessage('animateToRegion', { region, duration });
      },
      addMarker: (marker: HereMapMarker) => {
        sendMessage('addMarker', marker);
      },
      removeMarker: (markerId: string) => {
        sendMessage('removeMarker', { id: markerId });
      },
      addPolyline: (polyline: HereMapPolyline) => {
        sendMessage('addPolyline', polyline);
      },
      removePolyline: (polylineId: string) => {
        sendMessage('removePolyline', { id: polylineId });
      },
      addCircle: (circle: HereMapCircle) => {
        sendMessage('addCircle', circle);
      },
      removeCircle: (circleId: string) => {
        sendMessage('removeCircle', { id: circleId });
      },
      setMapStyle: (style: string) => {
        sendMessage('setMapStyle', { style });
      },
      setTrafficVisible: (visible: boolean) => {
        sendMessage('setTrafficVisible', { visible });
      },
      clearAll: () => {
        sendMessage('clearAll', {});
      },
    }));

    // Send message to WebView
    const sendMessage = (type: string, payload: any) => {
      if (webViewRef.current && isReady) {
        webViewRef.current.injectJavaScript(`
          window.postMessage(${JSON.stringify({ type, payload })}, '*');
          true;
        `);
      }
    };

    // Handle messages from WebView
    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'mapReady':
            setIsReady(true);
            onMapReady?.();
            // Send initial data
            markers.forEach(marker => sendMessage('addMarker', marker));
            polylines.forEach(polyline => sendMessage('addPolyline', polyline));
            circles.forEach(circle => sendMessage('addCircle', circle));
            break;
          case 'markerPress':
            onMarkerPress?.(data.markerId);
            break;
          case 'mapPress':
            onMapPress?.(data.coordinate);
            break;
        }
      } catch (error) {
        console.error('[HereMapWebView] Error parsing message:', error);
      }
    };

    // Update markers when props change
    useEffect(() => {
      if (isReady) {
        sendMessage('clearMarkers', {});
        markers.forEach(marker => sendMessage('addMarker', marker));
      }
    }, [markers, isReady]);

    // Update polylines when props change
    useEffect(() => {
      if (isReady) {
        sendMessage('clearPolylines', {});
        polylines.forEach(polyline => sendMessage('addPolyline', polyline));
      }
    }, [polylines, isReady]);

    // Update circles when props change
    useEffect(() => {
      if (isReady) {
        sendMessage('clearCircles', {});
        circles.forEach(circle => sendMessage('addCircle', circle));
      }
    }, [circles, isReady]);

    // Generate HTML content for HERE Maps
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>HERE Maps</title>
          <script src="https://js.api.here.com/v3/3.1/mapsjs-core.js"></script>
          <script src="https://js.api.here.com/v3/3.1/mapsjs-service.js"></script>
          <script src="https://js.api.here.com/v3/3.1/mapsjs-ui.js"></script>
          <script src="https://js.api.here.com/v3/3.1/mapsjs-mapevents.js"></script>
          <link rel="stylesheet" type="text/css" href="https://js.api.here.com/v3/3.1/mapsjs-ui.css" />
          <style>
            html, body, #map {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            // Initialize HERE platform
            const platform = new H.service.Platform({
              apikey: '${apiKey}'
            });

            // Create default layers
            const defaultLayers = platform.createDefaultLayers();

            // Calculate zoom from delta
            const latDelta = ${initialRegion.latitudeDelta};
            const zoom = Math.round(Math.log2(360 / latDelta));

            // Initialize map
            const map = new H.Map(
              document.getElementById('map'),
              defaultLayers.vector.normal.map,
              {
                zoom: zoom,
                center: { lat: ${initialRegion.latitude}, lng: ${initialRegion.longitude} }
              }
            );

            // Add behavior (panning, zooming)
            const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

            // Add UI controls
            const ui = H.ui.UI.createDefault(map, defaultLayers);

            // Storage for map objects
            const markers = new Map();
            const polylines = new Map();
            const circles = new Map();

            // Notify React Native that map is ready
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));

            // Handle tap on map
            map.addEventListener('tap', (evt) => {
              const coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapPress',
                coordinate: { latitude: coord.lat, longitude: coord.lng }
              }));
            });

            // Message handler from React Native
            window.addEventListener('message', (event) => {
              try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                switch (data.type) {
                  case 'animateToRegion':
                    const region = data.payload.region;
                    const newZoom = Math.round(Math.log2(360 / region.latitudeDelta));
                    map.setCenter({ lat: region.latitude, lng: region.longitude }, true);
                    map.setZoom(newZoom, true);
                    break;

                  case 'addMarker':
                    const markerData = data.payload;
                    const marker = new H.map.Marker({ lat: markerData.latitude, lng: markerData.longitude });
                    map.addObject(marker);
                    markers.set(markerData.id, marker);

                    // Add tap listener for marker
                    marker.addEventListener('tap', () => {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'markerPress',
                        markerId: markerData.id
                      }));
                    });
                    break;

                  case 'removeMarker':
                    const markerId = data.payload.id;
                    if (markers.has(markerId)) {
                      map.removeObject(markers.get(markerId));
                      markers.delete(markerId);
                    }
                    break;

                  case 'clearMarkers':
                    markers.forEach(m => map.removeObject(m));
                    markers.clear();
                    break;

                  case 'addPolyline':
                    const polylineData = data.payload;
                    const lineString = new H.geo.LineString();
                    polylineData.coordinates.forEach(coord => {
                      lineString.pushPoint({ lat: coord.latitude, lng: coord.longitude });
                    });
                    const polyline = new H.map.Polyline(lineString, {
                      style: {
                        strokeColor: polylineData.color || '#2563EB',
                        lineWidth: polylineData.width || 5
                      }
                    });
                    map.addObject(polyline);
                    polylines.set(polylineData.id, polyline);
                    break;

                  case 'removePolyline':
                    const polylineId = data.payload.id;
                    if (polylines.has(polylineId)) {
                      map.removeObject(polylines.get(polylineId));
                      polylines.delete(polylineId);
                    }
                    break;

                  case 'clearPolylines':
                    polylines.forEach(p => map.removeObject(p));
                    polylines.clear();
                    break;

                  case 'addCircle':
                    const circleData = data.payload;
                    const circle = new H.map.Circle(
                      { lat: circleData.latitude, lng: circleData.longitude },
                      circleData.radius,
                      {
                        style: {
                          fillColor: circleData.fillColor || 'rgba(34, 197, 94, 0.2)',
                          strokeColor: circleData.strokeColor || 'rgba(34, 197, 94, 0.8)',
                          lineWidth: circleData.strokeWidth || 2
                        }
                      }
                    );
                    map.addObject(circle);
                    circles.set(circleData.id, circle);
                    break;

                  case 'removeCircle':
                    const circleId = data.payload.id;
                    if (circles.has(circleId)) {
                      map.removeObject(circles.get(circleId));
                      circles.delete(circleId);
                    }
                    break;

                  case 'clearCircles':
                    circles.forEach(c => map.removeObject(c));
                    circles.clear();
                    break;

                  case 'setMapStyle':
                    const style = data.payload.style;
                    switch (style) {
                      case 'satellite':
                        map.setBaseLayer(defaultLayers.raster.satellite.map);
                        break;
                      case 'terrain':
                        map.setBaseLayer(defaultLayers.raster.terrain.map);
                        break;
                      case 'traffic':
                        map.setBaseLayer(defaultLayers.vector.normal.traffic);
                        break;
                      default:
                        map.setBaseLayer(defaultLayers.vector.normal.map);
                    }
                    break;

                  case 'setTrafficVisible':
                    if (data.payload.visible) {
                      map.addLayer(defaultLayers.vector.normal.traffic);
                    } else {
                      map.removeLayer(defaultLayers.vector.normal.traffic);
                    }
                    break;

                  case 'clearAll':
                    markers.forEach(m => map.removeObject(m));
                    markers.clear();
                    polylines.forEach(p => map.removeObject(p));
                    polylines.clear();
                    circles.forEach(c => map.removeObject(c));
                    circles.clear();
                    break;
                }
              } catch (error) {
                console.error('Error handling message:', error);
              }
            });

            // Resize handler
            window.addEventListener('resize', () => map.getViewPort().resize());
          </script>
        </body>
      </html>
    `;

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          allowFileAccess={true}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});

export const HereMapWebView = HereMapWebViewComponent;
export default HereMapWebView;
