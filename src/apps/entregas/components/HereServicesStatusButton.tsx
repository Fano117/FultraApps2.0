/**
 * HERE Maps Services Status Button
 *
 * Botón flotante que permite abrir el panel de estado de servicios HERE Maps.
 * Se puede posicionar en cualquier pantalla de la aplicación.
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/design-system/theme';
import { hereMockConfig } from '../services/hereMockConfig';
import HereServicesStatusPanel from './HereServicesStatusPanel';

interface HereServicesStatusButtonProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showBadge?: boolean;
}

export const HereServicesStatusButton: React.FC<HereServicesStatusButtonProps> = ({
  position = 'top-right',
  showBadge = true,
}) => {
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const summary = hereMockConfig.getStatusSummary();

  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: spacing[4], left: spacing[4] };
      case 'top-right':
        return { top: spacing[4], right: spacing[4] };
      case 'bottom-left':
        return { bottom: spacing[4], left: spacing[4] };
      case 'bottom-right':
        return { bottom: spacing[4], right: spacing[4] };
      default:
        return { top: spacing[4], right: spacing[4] };
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, getPositionStyle()]}
        onPress={() => setIsPanelVisible(true)}
        activeOpacity={0.8}>
        <Ionicons name="server-outline" size={22} color="white" />
        {showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{summary.implemented}</Text>
          </View>
        )}
      </TouchableOpacity>

      <HereServicesStatusPanel
        isVisible={isPanelVisible}
        onClose={() => setIsPanelVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.success[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
});

export default HereServicesStatusButton;
