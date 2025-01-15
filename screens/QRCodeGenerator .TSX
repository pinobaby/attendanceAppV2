import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCodeGenerator from '../components/QRCodeGenerator';

const QRCodeTestScreen = () => {
  return (
    <View style={styles.container}>
      <QRCodeGenerator value="https://example.com" size={200} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default QRCodeTestScreen;
