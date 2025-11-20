/**
 * HERE Maps Services Status Panel
 *
 * Panel emergente responsivo que muestra el estado de todos los servicios
 * HERE Maps implementados, indicando cuáles están funcionando y cuáles no.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/design-system/theme';
import { hereMockConfig, ServiceStatus } from '../services/hereMockConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HereServicesStatusPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HereServicesStatusPanel: React.FC<HereServicesStatusPanelProps> = ({
  isVisible,
  onClose,
}) => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    implemented: 0,
    notImplemented: 0,
    usingMock: 0,
    usingReal: 0,
  });
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    if (isVisible) {
      loadServiceStatus();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  useEffect(() => {
    const unsubscribe = hereMockConfig.addStatusListener(() => {
      loadServiceStatus();
    });
    return unsubscribe;
  }, []);

  const loadServiceStatus = () => {
    setServices(hereMockConfig.getAllServicesStatus());
    setSummary(hereMockConfig.getStatusSummary());
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'core':
        return 'IMPRESCINDIBLE';
      case 'recommended':
        return 'RECOMENDADO';
      case 'advanced':
        return 'AVANZADO';
      default:
        return category.toUpperCase();
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'core':
        return colors.error[500];
      case 'recommended':
        return colors.warning[500];
      case 'advanced':
        return colors.primary[500];
      default:
        return colors.neutral[500];
    }
  };

  const renderServiceItem = (service: ServiceStatus) => (
    <View key={service.name} style={styles.serviceItem}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceTitleRow}>
          <Ionicons
            name={service.implemented ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={service.implemented ? colors.success[500] : colors.error[500]}
          />
          <Text style={styles.serviceName}>{service.displayName}</Text>
        </View>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(service.category) + '20' },
          ]}>
          <Text
            style={[
              styles.categoryText,
              { color: getCategoryColor(service.category) },
            ]}>
            {getCategoryLabel(service.category)}
          </Text>
        </View>
      </View>

      <Text style={styles.serviceDescription}>{service.description}</Text>

      <View style={styles.serviceStatusRow}>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: service.implemented
                  ? service.useMock
                    ? colors.warning[500]
                    : colors.success[500]
                  : colors.error[500],
              },
            ]}
          />
          <Text style={styles.statusText}>
            {service.implemented
              ? service.useMock
                ? 'MOCK ACTIVO'
                : 'API REAL'
              : 'NO IMPLEMENTADO'}
          </Text>
        </View>
        <View style={styles.priorityBadge}>
          <Ionicons name="star" size={12} color={colors.warning[600]} />
          <Text style={styles.priorityText}>{service.priority}/10</Text>
        </View>
      </View>
    </View>
  );

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Resumen de Estado</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.success[500] }]}>
            {summary.implemented}
          </Text>
          <Text style={styles.summaryLabel}>Implementados</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: colors.error[500] }]}>
            {summary.notImplemented}
          </Text>
          <Text style={styles.summaryLabel}>Faltantes</Text>
        </View>
      </View>

      <View style={styles.mockStatusBar}>
        <View style={styles.mockStatusItem}>
          <View
            style={[styles.mockIndicator, { backgroundColor: colors.warning[500] }]}
          />
          <Text style={styles.mockStatusText}>
            {summary.usingMock} usando MOCK
          </Text>
        </View>
        <View style={styles.mockStatusItem}>
          <View
            style={[styles.mockIndicator, { backgroundColor: colors.success[500] }]}
          />
          <Text style={styles.mockStatusText}>
            {summary.usingReal} usando API REAL
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(summary.implemented / summary.total) * 100}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {Math.round((summary.implemented / summary.total) * 100)}% de cobertura
      </Text>
    </View>
  );

  const coreServices = services.filter(s => s.category === 'core');
  const recommendedServices = services.filter(s => s.category === 'recommended');

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerDragHandle} />
            <View style={styles.headerContent}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="server" size={24} color={colors.primary[600]} />
                <Text style={styles.headerTitle}>Estado de Servicios HERE Maps</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>
            {/* Summary */}
            {renderSummaryCard()}

            {/* Core Services */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={colors.error[500]}
                />
                <Text style={styles.sectionTitle}>Servicios Core (Imprescindibles)</Text>
              </View>
              {coreServices.map(renderServiceItem)}
            </View>

            {/* Recommended Services */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={20} color={colors.warning[500]} />
                <Text style={styles.sectionTitle}>
                  Servicios Recomendados (Mejoran UX)
                </Text>
              </View>
              {recommendedServices.map(renderServiceItem)}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Leyenda</Text>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.success[500] }]}
                />
                <Text style={styles.legendText}>Implementado - API Real</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.warning[500] }]}
                />
                <Text style={styles.legendText}>Implementado - Modo Mock</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.error[500] }]}
                />
                <Text style={styles.legendText}>No Implementado</Text>
              </View>
            </View>

            {/* Footer Info */}
            <View style={styles.footer}>
              <Ionicons name="information-circle" size={16} color={colors.primary[600]} />
              <Text style={styles.footerText}>
                Los servicios en modo MOCK utilizan datos simulados para desarrollo y
                testing. Para producción, configure las API Keys reales de HERE Maps.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    paddingTop: spacing[2],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[3],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing[2],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  summaryCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  summaryTitle: {
    ...typography.h5,
    color: colors.primary[700],
    fontWeight: 'bold',
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[3],
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    ...typography.h2,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  mockStatusBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  mockStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  mockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mockStatusText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing[1],
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
  },
  serviceItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  serviceName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: 8,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: 'bold',
    fontSize: 10,
  },
  serviceDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  serviceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.warning[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: 8,
  },
  priorityText: {
    ...typography.caption,
    color: colors.warning[700],
    fontWeight: '600',
  },
  legend: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  legendTitle: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.primary[50],
    padding: spacing[3],
    borderRadius: 12,
  },
  footerText: {
    ...typography.caption,
    color: colors.primary[700],
    flex: 1,
    lineHeight: 18,
  },
});

export default HereServicesStatusPanel;
