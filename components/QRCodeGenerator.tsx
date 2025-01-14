import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size = 100 }) => {
  const [pathData, setPathData] = React.useState<string | null>(null);

  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const data = await QRCode.toString(value, { type: 'svg' });
        const path = data.match(/d="([^"]+)"/)?.[1]; // Extrae la ruta del SVG
        setPathData(path || '');
      } catch (error) {
        console.error('Error generando QR:', error);
      }
    };

    generateQRCode();
  }, [value]);

  if (!pathData) {
    return null; 
  }

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 100 100`}>
        <Path d={pathData} fill="black" />
      </Svg>
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
