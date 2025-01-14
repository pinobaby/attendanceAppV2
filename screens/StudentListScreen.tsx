
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function StudentListScreen() {
  const [students, setStudents] = useState([]);
  const navigation = useNavigation();

  type RootStackParamList = {
  QRCode: { qrValue: string; studentName: string };
};
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentsData);
      } catch (error) {
        console.error('Error al obtener estudiantes:', error);
      }
    };

    fetchStudents();
  }, []);

  const handleViewQRCode = (qrValue: string, studentName: string) => {
    // Navegar a la pantalla del código QR
    navigation.navigate('QRCode', { qrValue, studentName });
  };

  const renderStudent = ({ item }) => (
    <View style={styles.studentContainer}>
      <TouchableOpacity onPress={() => handleViewQRCode(item.qrCode, item.name)}>
        <Text style={styles.name}>Nombre: {item.name}</Text>
      </TouchableOpacity>
      <Text>Correo: {item.email}</Text>
      <Text>ID: {item.qrCode}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Estudiantes</Text>
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        renderItem={renderStudent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  studentContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  name: { fontSize: 18, fontWeight: 'bold' },
});

// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, Image, Button } from 'react-native';
// import QRCode from 'qrcode';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { RouteProp } from '@react-navigation/native';

// type RootStackParamList = {
//   QRCode: { qrValue: string; studentName: string };
// };

// type QRCodeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRCode'>;
// type QRCodeScreenRouteProp = RouteProp<RootStackParamList, 'QRCode'>;

// interface QRCodeScreenProps {
//   route: QRCodeScreenRouteProp;
//   navigation: QRCodeScreenNavigationProp;
// }

// const QRCodeScreen: React.FC<QRCodeScreenProps> = ({ route, navigation }) => {
//   const [qrImage, setQrImage] = useState<string>('');

//   useEffect(() => {
//     // Verificamos que route.params existe antes de acceder a sus propiedades
//     if (route.params) {
//       const { qrValue, studentName } = route.params;
//       console.log('QR Value:', qrValue);
//       console.log('Student Name:', studentName);

//       const generateQRCode = async () => {
//         try {
//           if (!qrValue) {
//             throw new Error('No input text');
//           }
//           const qrCode = await QRCode.toDataURL(qrValue);
//           setQrImage(qrCode);
//         } catch (error) {
//           console.error('Error generating QR Code:', error);
//         }
//       };

//       generateQRCode();
//     } else {
//       console.error('No parameters passed to QRCodeScreen');
//     }
//   }, [route.params]);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>{`Código QR de ${route.params?.studentName || ''}`}</Text>
//       {qrImage ? (
//         <Image source={{ uri: qrImage }} style={styles.qrImage} />
//       ) : (
//         <Text>Cargando QR...</Text>
//       )}
//       <Button title="Regresar" onPress={() => navigation.goBack()} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
//   qrImage: { width: 200, height: 200, marginBottom: 20 },
// });

// export default QRCodeScreen;
