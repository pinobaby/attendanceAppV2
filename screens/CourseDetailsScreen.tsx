import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { db, auth } from '../firebase/config'; 
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface Student {
  id: string;
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
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<any>(null);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        if (!user) {
          Alert.alert('Error', 'Usuario no autenticado');
          return;
        }

        const alumnosRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
        const querySnapshot = await getDocs(alumnosRef);
        
        const alumnosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[];
        
        setStudents(alumnosData);
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar la información del curso.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [courseId, user]);

  const addStudent = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar alumnos');
      return;
    }

    try {
      const alumnosRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
      
      // Verificar si el correo ya existe
      const emailQuery = query(alumnosRef, where('email', '==', studentEmail.toLowerCase().trim()));
      const querySnapshot = await getDocs(emailQuery);
      
      if (!querySnapshot.empty) {
        Alert.alert('Error', 'El correo electrónico ya está registrado');
        return;
      }

      const newStudent = {
        name: studentName.trim(),
        email: studentEmail.toLowerCase().trim(),
        createdAt: new Date(),
      };

      const docRef = await addDoc(alumnosRef, newStudent);
      
      setStudents(prev => [...prev, { ...newStudent, id: docRef.id }]);
      setStudentName('');
      setStudentEmail('');
      setAddStudentModalVisible(false);
      Alert.alert('Éxito', 'Alumno agregado correctamente.');
    } catch (error) {
      console.error('Error al agregar alumno:', error);
      Alert.alert('Error', 'No se pudo agregar el alumno.');
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para eliminar alumnos');
      return;
    }

    try {
      const alumnoRef = doc(db, 'users', user.uid, 'cursos', courseId, 'alumnos', studentId);
      await deleteDoc(alumnoRef);
      setStudents(prev => prev.filter(s => s.id !== studentId));
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
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      const fileName = `QR_${selectedStudent.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir QR de Asistencia',
          UTI: 'public.image',
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
              onPress={() => deleteStudent(item.id)} 
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay alumnos registrados</Text>}
        contentContainerStyle={styles.listContent}
      />

   
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setAddStudentModalVisible(true)}
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        visible={addStudentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddStudentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Alumno</Text>

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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddStudentModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={addStudent}
              >
                <Text style={styles.buttonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    width: '100%',
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
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  addButtonModal: {
    backgroundColor: '#4CAF50',
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2A5298',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});