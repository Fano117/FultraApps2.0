import React, { useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { colors } from '@/design-system';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear }) => {
  const signatureRef = useRef<any>(null);

  const handleSignature = (signature: string) => {
    onSave(signature);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    onClear?.();
  };

  const handleEnd = () => {
    signatureRef.current?.readSignature();
  };

  const webStyle = `.m-signature-pad {
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body,html {
    width: 100%;
    height: 100%;
  }`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firma del receptor</Text>
        <Text style={styles.instruction}>Firme en el recuadro abajo</Text>
      </View>
      <View style={styles.signatureContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleSignature}
          onEnd={handleEnd}
          onClear={handleClear}
          autoClear={false}
          descriptionText=""
          webStyle={webStyle}
          penColor={colors.neutral[900]}
          backgroundColor="white"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: colors.neutral[50],
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  instruction: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  signatureContainer: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
  },
});
