

// import React, { useEffect, useState, useRef } from 'react'; 
// import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity, Modal } from 'react-native';
// import { db } from '../firebase/config';
// import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
// import QRCode from 'react-native-qrcode-svg';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';

// export default function CourseDetailsScreen({ route }: any) {
//   const { courseId } = route.params;
//   const [students, setStudents] = useState<{ name: string; email: string }[]>([]);
//   const [studentName, setStudentName] = useState('');
//   const [studentEmail, setStudentEmail] = useState('');
//   const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const qrRef = useRef<any>(null); 

//   useEffect(() => {
//     const fetchCourseData = async () => {
//       try {
//         const courseDoc = await getDoc(doc(db, 'courses', courseId));
//         if (courseDoc.exists()) {
//           const data = courseDoc.data();
//           setStudents(data.students || []);
//         }
//       } catch (error) {
//         console.error('Error al obtener datos del curso:', error);
//         Alert.alert('Error', 'No se pudo cargar la información del curso.');
//       }
//     };

//     fetchCourseData();
//   }, [courseId]);

//   const addStudent = async () => {
//     if (!studentName || !studentEmail) {
//       Alert.alert('Error', 'Por favor, llena todos los campos.');
//       return;
//     }

//     const newStudent = { name: studentName, email: studentEmail };
//     try {
//       const courseRef = doc(db, 'courses', courseId);
//       await updateDoc(courseRef, {
//         students: arrayUnion(newStudent),
//       });
//       setStudents((prev) => [...prev, newStudent]);
//       setStudentName('');
//       setStudentEmail('');
//       Alert.alert('Éxito', 'Alumno agregado correctamente.');
//     } catch (error) {
//       console.error('Error al agregar alumno:', error);
//       Alert.alert('Error', 'No se pudo agregar el alumno.');
//     }
//   };

//   const handleStudentPress = (studentName: string) => {
//     setSelectedStudent(studentName);
//     setModalVisible(true);
//   };

//   const downloadQRCode = async () => {
//     if (!qrRef.current) {
//       Alert.alert('Error', 'El QR no está disponible.');
//       return;
//     }

//     try {
//       // Generar el QR como Data URL
//       qrRef.current.toDataURL(async (data: string) => {
//         const fileName = selectedStudent?.replace(/[^a-zA-Z0-9]/g, '_') || 'student';
//         const fileUri = `${FileSystem.documentDirectory}${fileName}_QR.png`; // Usamos documentDirectory

//         // Guardar el archivo como PNG en la ruta seleccionada
//         await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });

//         // Verificar si el dispositivo permite compartir
//         if (await Sharing.isAvailableAsync()) {
//           await Sharing.shareAsync(fileUri); // Compartir el archivo
//         } else {
//           Alert.alert('Error', 'Compartir no está disponible en este dispositivo.');
//         }
//       });
//     } catch (error) {
//       console.error('Error al generar el QR:', error);
//       Alert.alert('Error', 'Hubo un problema al generar o compartir el QR.');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Gestionar alumnos</Text>
//       <FlatList
//         data={students}
//         keyExtractor={(item) => item.name}
//         renderItem={({ item }) => (
//           <TouchableOpacity onPress={() => handleStudentPress(item.name)}>
//             <Text style={styles.studentItem}>{item.name}</Text>
//           </TouchableOpacity>
//         )}
//         ListEmptyComponent={<Text>No hay alumnos registrados.</Text>}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Nombre del alumno"
//         value={studentName}
//         onChangeText={setStudentName}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Correo del alumno"
//         value={studentEmail}
//         onChangeText={setStudentEmail}
//         keyboardType="email-address"
//       />
//       <Button title="Agregar alumno" onPress={addStudent} />

//       {modalVisible && (
//         <Modal transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalContent}>
//               <Text style={styles.modalTitle}>Código QR de {selectedStudent}</Text>
//               <QRCode
//                 value={selectedStudent || ''}
//                 size={200}
//                 getRef={(ref) => (qrRef.current = ref)} // Asignamos la referencia correcta
//               />
//               <Button title="Descargar QR" onPress={downloadQRCode} />
//               <Button title="Cerrar" onPress={() => setModalVisible(false)} />
//             </View>
//           </View>
//         </Modal>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20 },
//   title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 10,
//     marginVertical: 10,
//     borderRadius: 5,
//   },
//   studentItem: { fontSize: 16, padding: 10, backgroundColor: '#f9f9f9', marginBottom: 5 },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     width: 300,
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
// });






import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeViewerProps {
  qrValue: string;
  studentName: string;
}

const QRCodeViewer: React.FC<QRCodeViewerProps> = ({ qrValue, studentName }) => {
  const qrRef = React.useRef(null);

  const handleDownloadAndShareQR = async () => {
    try {
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      const fileUri = `${FileSystem.cacheDirectory}${studentName}_QR.png`;
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert('El compartir no está disponible en este dispositivo.');
      }
    } catch (error) {
      console.error('Error al compartir el código QR:', error);
      alert('Hubo un error al compartir el código QR.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Código QR de {studentName}</Text>
      <View ref={qrRef} style={styles.qrContainer}>
        <QRCode value={qrValue} size={200} />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleDownloadAndShareQR}>
        <Text style={styles.buttonText}>Descargar y Compartir QR</Text>
      </TouchableOpacity>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  qrContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      marginVertical: 10,
      borderRadius: 5,
    },
    studentItem: { fontSize: 16, padding: 10, backgroundColor: '#f9f9f9', marginBottom: 5 },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: 300,
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
});

export default QRCodeViewer;


