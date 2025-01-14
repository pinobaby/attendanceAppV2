// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, StyleSheet } from 'react-native';
// import { collection, getDocs } from 'firebase/firestore';
// import { getFirestore } from 'firebase/firestore';

// const StudentListScreen = () => {
//   const [students, setStudents] = useState([]);
//   const db = getFirestore();

//   useEffect(() => {
//     const fetchStudents = async () => {
//       const querySnapshot = await getDocs(collection(db, 'students'));
//       const studentData = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setStudents(studentData);
//     };

//     fetchStudents();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Student List</Text>
//       <FlatList
//         data={students}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.studentCard}>
//             <Text style={styles.name}>{item.name}</Text>
//             <Text style={styles.email}>{item.email}</Text>
//           </View>
//         )}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20 },
//   title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
//   studentCard: { padding: 15, borderBottomWidth: 1, borderColor: '#ccc' },
//   name: { fontSize: 18, fontWeight: 'bold' },
//   email: { fontSize: 16, color: '#666' },
// });
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function StudentListScreen() {
  const [students, setStudents] = useState([]);
  const navigation = useNavigation();

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
    navigation.navigate('QrCodeScreen', { qrValue, studentName });
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
