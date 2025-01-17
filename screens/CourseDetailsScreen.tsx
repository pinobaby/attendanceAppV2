// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, TextInput, Button, Alert, StyleSheet } from 'react-native';
// import { RouteProp, useNavigation } from '@react-navigation/native';
// import { db } from '../firebase/config';
// import { collection, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// type RootStackParamList = {
//   CourseDetails: { courseId: string };
// };

// type CourseDetailsScreenRouteProp = RouteProp<RootStackParamList, 'CourseDetails'>;

// interface Props {
//   route: CourseDetailsScreenRouteProp;
// }

// export default function CourseDetailsScreen({ route }: Props) {
//   const { courseId } = route.params;
//   const [courseName, setCourseName] = useState('');
//   const [students, setStudents] = useState<string[]>([]);
//   const [newStudent, setNewStudent] = useState('');
//   const navigation = useNavigation();

//   useEffect(() => {
//     const fetchCourseDetails = async () => {
//       try {
//         const courseDoc = await getDoc(doc(db, 'courses', courseId));
//         if (courseDoc.exists()) {
//           const data = courseDoc.data();
//           setCourseName(data.name);
//           setStudents(data.students || []);
//         } else {
//           Alert.alert('Error', 'El curso no existe.');
//           navigation.goBack();
//         }
//       } catch (error) {
//         console.error('Error al obtener detalles del curso:', error);
//         Alert.alert('Error', 'Hubo un problema al cargar los detalles del curso.');
//       }
//     };

//     fetchCourseDetails();
//   }, [courseId]);

//   const handleAddStudent = async () => {
//     if (!newStudent.trim()) {
//       Alert.alert('Error', 'El nombre del alumno no puede estar vacío.');
//       return;
//     }

//     try {
//       const courseRef = doc(db, 'courses', courseId);
//       await updateDoc(courseRef, {
//         students: arrayUnion(newStudent),
//       });

//       setStudents((prevStudents) => [...prevStudents, newStudent]);
//       setNewStudent('');
//       Alert.alert('Éxito', 'Alumno agregado correctamente.');
//     } catch (error) {
//       console.error('Error al agregar alumno:', error);
//       Alert.alert('Error', 'Hubo un problema al agregar el alumno.');
//     }
//   };

//   const handleRemoveStudent = async (student: string) => {
//     try {
//       const courseRef = doc(db, 'courses', courseId);
//       await updateDoc(courseRef, {
//         students: arrayRemove(student),
//       });

//       setStudents((prevStudents) => prevStudents.filter((s) => s !== student));
//       Alert.alert('Éxito', 'Alumno eliminado correctamente.');
//     } catch (error) {
//       console.error('Error al eliminar alumno:', error);
//       Alert.alert('Error', 'Hubo un problema al eliminar el alumno.');
//     }
//   };

//   const renderStudent = ({ item }: { item: string }) => (
//     <View style={styles.studentContainer}>
//       <Text style={styles.studentName}>{item}</Text>
//       <Button title="Eliminar" onPress={() => handleRemoveStudent(item)} color="red" />
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>{`Curso: ${courseName}`}</Text>
//       <Text style={styles.subtitle}>Lista de Alumnos:</Text>
//       <FlatList
//         data={students}
//         keyExtractor={(item, index) => index.toString()}
//         renderItem={renderStudent}
//         ListEmptyComponent={<Text style={styles.emptyList}>No hay alumnos registrados.</Text>}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Nombre del alumno"
//         value={newStudent}
//         onChangeText={setNewStudent}
//       />
//       <Button title="Agregar Alumno" onPress={handleAddStudent} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20 },
//   title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
//   subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
//   studentContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
//   studentName: { fontSize: 16 },
//   input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
//   emptyList: { textAlign: 'center', color: '#999', marginVertical: 20 },
// });


import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { db } from '../firebase/config';
import { collection, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function CourseDetailsScreen({ route }: any) {
  const { courseId } = route.params;
  const [students, setStudents] = useState<{ name: string; email: string }[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          const data = courseDoc.data();
          setStudents(data.students || []);
        }
      } catch (error) {
        console.error('Error al obtener datos del curso:', error);
        Alert.alert('Error', 'No se pudo cargar la información del curso.');
      }
    };

    fetchCourseData();
  }, [courseId]);

  const addStudent = async () => {
    if (!studentName || !studentEmail) {
      Alert.alert('Error', 'Por favor, llena todos los campos.');
      return;
    }

    const newStudent = { name: studentName, email: studentEmail };
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        students: arrayUnion(newStudent),
      });
      setStudents((prev) => [...prev, newStudent]);
      setStudentName('');
      setStudentEmail('');
      Alert.alert('Éxito', 'Alumno agregado correctamente.');
    } catch (error) {
      console.error('Error al agregar alumno:', error);
      Alert.alert('Error', 'No se pudo agregar el alumno.');
    }
  };

  const handleStudentPress = (studentName: string) => {
    setSelectedStudent(studentName);
    setModalVisible(true);
  };

  const downloadQRCode = (svgRef: any, studentName: string) => {
    svgRef.toDataURL(async (data: string) => {
      const path = `${FileSystem.cacheDirectory}${studentName}.png`;
      await FileSystem.writeAsStringAsync(path, data, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo.');
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestionar alumnos</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleStudentPress(item.name)}>
            <Text style={styles.studentItem}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No hay alumnos registrados.</Text>}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre del alumno"
        value={studentName}
        onChangeText={setStudentName}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo del alumno"
        value={studentEmail}
        onChangeText={setStudentEmail}
        keyboardType="email-address"
      />
      <Button title="Agregar alumno" onPress={addStudent} />

    
      {modalVisible && (
        <Modal transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Código QR de {selectedStudent}</Text>
              <QRCode
                value={selectedStudent || ''}
                size={200}
                getRef={(ref) => (this.svgRef = ref)}
              />
              <Button
                title="Descargar QR"
                onPress={() => downloadQRCode(this.svgRef, selectedStudent || 'student')}
              />
              <Button title="Cerrar" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
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
