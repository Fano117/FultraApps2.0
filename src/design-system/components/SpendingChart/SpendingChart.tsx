import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface ChartData {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface SpendingChartProps {
  data: ChartData[];
  total?: number;
  title?: string;
  type?: 'bar' | 'donut' | 'line';
  style?: ViewStyle;
  height?: number;
}

export const SpendingChart: React.FC<SpendingChartProps> = ({
  data,
  total,
  title,
  type = 'bar',
  style,
  height = 200,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const calculatedTotal = total || data.reduce((sum, item) => sum + item.value, 0);

  const defaultColors = [
    colors.primary[600],
    colors.secondary[600],
    colors.success[600],
    colors.warning[600],
    colors.error[600],
    colors.info[600],
  ];

  const enrichedData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
    percentage: item.percentage || (item.value / calculatedTotal) * 100,
  }));

  if (type === 'donut') {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.donutContainer}>
          <DonutChart data={enrichedData} size={height} />
          <View style={styles.legend}>
            {enrichedData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>
                  {item.percentage?.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (type === 'line') {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <LineChart data={enrichedData} height={height} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.barChartContainer, { height }]}>
        {enrichedData.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${barHeight}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.barValue}>
                ${item.value.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const DonutChart: React.FC<{ data: ChartData[]; size: number }> = ({ data, size }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  return (
    <View style={[styles.donutChart, { width: size, height: size }]}>
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const angle = (percentage / 100) * 360;
        const slice = (
          <View
            key={index}
            style={[
              styles.donutSlice,
              {
                backgroundColor: item.color,
                transform: [{ rotate: `${currentAngle}deg` }],
              },
            ]}
          />
        );
        currentAngle += angle;
        return slice;
      })}
      <View style={styles.donutHole}>
        <Text style={styles.donutTotal}>${total.toLocaleString()}</Text>
        <Text style={styles.donutLabel}>Total</Text>
      </View>
    </View>
  );
};

const LineChart: React.FC<{ data: ChartData[]; height: number }> = ({ data, height }) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <View style={[styles.lineChartContainer, { height }]}>
      <View style={styles.lineChart}>
        {data.map((item, index) => {
          const y = height - (item.value / maxValue) * height;
          const x = (index / (data.length - 1)) * 100;

          return (
            <View key={index}>
              {index > 0 && (
                <View
                  style={[
                    styles.line,
                    {
                      position: 'absolute',
                      left: `${((index - 1) / (data.length - 1)) * 100}%`,
                      top: height - (data[index - 1].value / maxValue) * height,
                    },
                  ]}
                />
              )}
              <View
                style={[
                  styles.linePoint,
                  {
                    position: 'absolute',
                    left: `${x}%`,
                    top: y,
                    backgroundColor: item.color || colors.primary[600],
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.lineLabels}>
        {data.map((item, index) => (
          <Text key={index} style={styles.lineLabel}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  barChartContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    minHeight: 4,
  },
  barLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    textAlign: 'center',
  },
  barValue: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  donutContainer: {
    gap: spacing[4],
  },
  donutChart: {
    borderRadius: 1000,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
  },
  donutSlice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  donutHole: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    borderRadius: 1000,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutTotal: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  donutLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  legend: {
    gap: spacing[2],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  legendValue: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  lineChartContainer: {
    gap: spacing[2],
  },
  lineChart: {
    position: 'relative',
    flex: 1,
  },
  line: {
    height: 2,
    backgroundColor: colors.primary[600],
  },
  linePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  lineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
});
