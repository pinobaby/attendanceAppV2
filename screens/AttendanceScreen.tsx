// import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
// import { useState } from 'react';
// import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// import { addDoc, collection } from 'firebase/firestore';
// import { getFirestore } from 'firebase/firestore';

// const AttendanceScreen = () => {
//     const [facing, setFacing] = useState<CameraType>('back');
//     const [permission, requestPermission] = useCameraPermissions();

  

//     if (!permission) {

//         return <View />;
//       }
    
//       if (!permission.granted) {
     
//         return (
//           <View style={styles.container}>
//             <Text style={styles.message}>We need your permission to show the camera</Text>
//             <Button onPress={requestPermission} title="grant permission" />
//           </View>
//         );
//       }
    
//       function toggleCameraFacing() {
//         setFacing(current => (current === 'back' ? 'front' : 'back'));
//       }
//   return (
//     <View style={styles.container}>
//       <CameraView style={styles.camera} facing={facing}>
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
//             <Text style={styles.text}>Flip Camera</Text>
//           </TouchableOpacity>
//         </View>
//       </CameraView>
//     </View>
//   );

// };
// const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       justifyContent: 'center',
//     },
//     message: {
//       textAlign: 'center',
//       paddingBottom: 10,
//     },
//     camera: {
//       flex: 1,
//     },
//     buttonContainer: {
//       flex: 1,
//       flexDirection: 'row',
//       backgroundColor: 'transparent',
//       margin: 64,
//     },
//     button: {
//       flex: 1,
//       alignSelf: 'flex-end',
//       alignItems: 'center',
//     },
//     text: {
//       fontSize: 24,
//       fontWeight: 'bold',
//       color: 'white',
//     },
//   });
// export default AttendanceScreen;
// function setFacing(arg0: (current: any) => "back" | "front") {
//     throw new Error('Function not implemented.');
// }

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { collection, getDocs, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AttendanceScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [students, setStudents] = useState<{ id: string; name: string; course: string; qrCode: string; }[]>([]);
  const [attendedStudents, setAttendedStudents] = useState(new Set());
  const [scanning, setScanning] = useState(false);
  const [course, setCourse] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        course: doc.data().course,
        qrCode: doc.data().qrCode,
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    setScanning(true);

    const student = students.find(student => student.qrCode === data);

    if (student && student.course === course) {
      setAttendedStudents(prev => new Set([...prev, student.id]));
      await setDoc(doc(db, 'attendance', `${student.id}-${Date.now()}`), {
        studentId: student.id,
        studentName: student.name,
        course: student.course,
        timestamp: Timestamp.now(),
      });
      Alert.alert('Éxito', `Asistencia registrada para ${student.name}`);
    } else {
      Alert.alert('Error', 'Estudiante no encontrado o no pertenece al curso seleccionado');
    }

    setScanning(false);
  };

  const renderStudent = ({ item }: { item: { id: string; name: string; course: string; qrCode: string; } }) => (
    <View style={styles.studentContainer}>
      <Text style={styles.name}>
        {item.name} - {attendedStudents.has(item.id) ? 'Presente' : 'Ausente'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asistencia para el Curso: {course || 'Selecciona un curso'}</Text>
      <FlatList
        data={students.filter(student => student.course === course)}
        keyExtractor={item => item.id}
        renderItem={renderStudent}
        ListEmptyComponent={<Text>No hay estudiantes registrados en este curso.</Text>}
      />
      {hasPermission ? (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      ) : (
        <Text>Permiso para usar la cámara no concedido</Text>
      )}
      <Button title="Cambiar Curso" onPress={() => {
        const courseName = prompt('Ingresa el nombre del curso');
        if (courseName !== null) {
          setCourse(courseName);
        }
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  studentContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  name: { fontSize: 18 },
  camera: {
    flex: 1,
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
