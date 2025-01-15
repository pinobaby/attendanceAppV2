import React from 'react';
import { View, StyleSheet } from 'react-native';
import SvgQRCode from 'react-native-qrcode-svg';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size = 100 }) => {
  return (
    <View style={styles.container}>
      <SvgQRCode value={value} size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QRCodeGenerator;
