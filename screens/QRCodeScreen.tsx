import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Button } from 'react-native';
import QRCode from 'qrcode';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';


type RootStackParamList = {
  QRCode: { qrValue: string; studentName: string };  
};

type QRCodeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRCode'>;
type QRCodeScreenRouteProp = RouteProp<RootStackParamList, 'QRCode'>;

interface QRCodeScreenProps {
  route: QRCodeScreenRouteProp;
  navigation: QRCodeScreenNavigationProp;
}

export default function QRCodeScreen({ route, navigation }: QRCodeScreenProps) {
  const [qrImage, setQrImage] = useState<string>('');

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCode = await QRCode.toDataURL(route.params.qrValue);
        setQrImage(qrCode);
      } catch (error) {
        console.error('Error generating QR Code:', error);
      }
    };

    generateQRCode();
  }, [route.params.qrValue]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`Código QR de ${route.params.studentName}`}</Text>
      {qrImage ? (
        <Image source={{ uri: qrImage }} style={styles.qrImage} />
      ) : (
        <Text>Cargando QR...</Text>
      )}
      <Button title="Regresar" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  qrImage: { width: 200, height: 200, marginBottom: 20 },
});
