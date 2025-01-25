import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator
} from 'react-native';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

interface Student {
  name: string;
  email: string;
}

interface CourseDetailsScreenProps {
  route: {
    params: {
      courseId: string;
    };
  };
}

export default function CourseDetailsScreen({ route }: CourseDetailsScreenProps) {
  const { courseId } = route.params;
  const [students, setStudents] = useState<Student[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        
        if (courseDoc.exists()) {
          const data = courseDoc.data();
          setStudents(data.students || []);
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar la información del curso.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const addStudent = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    const newStudent: Student = {
      name: studentName.trim(),
      email: studentEmail.toLowerCase().trim()
    };

    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        students: arrayUnion(newStudent)
      });
      setStudents(prev => [...prev, newStudent]);
      setStudentName('');
      setStudentEmail('');
      Alert.alert('Éxito', 'Alumno agregado correctamente.');
    } catch (error) {
      console.error('Error al agregar alumno:', error);
      Alert.alert('Error', 'No se pudo agregar el alumno.');
    }
  };

  const deleteStudent = async (student: Student) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        students: arrayRemove(student)
      });
      setStudents(prev => prev.filter(s => s.email !== student.email));
      Alert.alert('Éxito', 'Alumno eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar alumno:', error);
      Alert.alert('Error', 'No se pudo eliminar al alumno.');
    }
  };

  const handleStudentPress = (email: string) => {
    setSelectedStudent(email);
    setModalVisible(true);
  };

  const downloadQRCode = async () => {
    if (!qrRef.current || !selectedStudent) {
      Alert.alert('Error', 'El QR no está disponible.');
      return;
    }

    try {
      // Paso 1: Capturar el QR como imagen
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      // Paso 2: Crear nombre de archivo válido
      const fileName = `QR_${selectedStudent.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Paso 3: Copiar el archivo a ubicación permanente
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });

      // Paso 4: Compartir el archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir QR de Asistencia',
          UTI: 'public.image'
        });
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo.');
      }
    } catch (error) {
      console.error('Error al generar el QR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Hubo un problema al generar o compartir el QR.';
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Estudiantes</Text>

      <FlatList
        data={students}
        keyExtractor={(item) => item.email}
        renderItem={({ item }) => (
          <View style={styles.studentContainer}>
            <TouchableOpacity 
              style={styles.studentInfo}
              onPress={() => handleStudentPress(item.email)}
            >
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentEmail}>{item.email}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => deleteStudent(item)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay alumnos registrados</Text>
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del alumno"
          value={studentName}
          onChangeText={setStudentName}
          placeholderTextColor="#888"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={studentEmail}
          onChangeText={setStudentEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={addStudent}
        >
          <Text style={styles.addButtonText}>Agregar Alumno</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Código QR de Asistencia</Text>
            
            <QRCode
              value={selectedStudent}
              size={200}
              backgroundColor="white"
              getRef={(ref) => (qrRef.current = ref)}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.shareButton]}
                onPress={downloadQRCode}
              >
                <Ionicons name="share" size={20} color="white" />
                <Text style={styles.buttonText}>Compartir</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="white" />
                <Text style={styles.buttonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginVertical: 20,
    textAlign: 'center',
  },
  studentContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  closeButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});