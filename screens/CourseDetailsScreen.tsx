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
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  onSnapshot
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
  createdAt: Date;
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
    let unsubscribe: () => void;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        if (!user) {
          Alert.alert('Error', 'Usuario no autenticado');
          return;
        }

        const alumnosRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
        const q = query(alumnosRef, orderBy('createdAt', 'asc'));
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const alumnosData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            email: doc.data().email,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })) as Student[];
          
          setStudents(alumnosData);
        });

      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar la información del curso.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();

    return () => {
      if (unsubscribe) unsubscribe();
    };
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

      await addDoc(alumnosRef, newStudent);
      setStudentName('');
      setStudentEmail('');
      setAddStudentModalVisible(false);
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
      Alert.alert('Error', 'Hubo un problema al generar o compartir el QR.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2A5298" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Estudiantes</Text>
        <Text style={styles.subtitle}>Ordenados por fecha de registro</Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.studentContainer}>
            <TouchableOpacity
              style={styles.studentInfo}
              onPress={() => handleStudentPress(item.email)}
            >
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentEmail}>{item.email}</Text>
              {/* <Text style={styles.registrationDate}>
                Registrado el: {item.createdAt.toLocaleDateString()}
              </Text> */}
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
  header: {
    marginBottom: 15,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3533c0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
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
  registrationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
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
    backgroundColor: '#3533c0',
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
    backgroundColor: '#3533c0',
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