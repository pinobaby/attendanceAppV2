import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  Modal, 
  TextInput, 
  Alert 
} from 'react-native';
import { db, auth } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from 'expo-router';

interface Course {
  id: string;
  name: string;
  createdAt?: {
    toDate: () => Date;
  };
  students?: any[];
}

type ManageCoursesNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ManageCourses'
>;

export default function ManageCoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourseName, setNewCourseName] = useState('');
  const navigation = useNavigation<ManageCoursesNavigationProp>();

  const fetchCourses = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'users', userId, 'cursos'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const coursesData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const studentsRef = collection(doc.ref, 'alumnos');
          const studentsSnapshot = await getDocs(studentsRef);
          return {
            id: doc.id,
            ...doc.data(),
            students: studentsSnapshot.docs,
            createdAt: doc.data().createdAt
          } as Course;
        })
      );
      
      setCourses(coursesData);
      setError(null);
    } catch (error) {
      console.error('Error al obtener cursos:', error);
      setError('Error al cargar los cursos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const confirmDelete = () => {
    Alert.alert(
      "Eliminar curso",
      "¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Sí",
          onPress: () => handleDeleteCourse()
        }
      ]
    );
  };
  const handleUpdateCourse = async () => {
    if (!selectedCourse || !newCourseName.trim()) {
      Alert.alert('Error', 'El nombre del curso no puede estar vacío');
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const courseRef = doc(db, 'users', user.uid, 'cursos', selectedCourse.id);
      await updateDoc(courseRef, { name: newCourseName });
      
      setCourses(courses.map(course => 
        course.id === selectedCourse.id ? { ...course, name: newCourseName } : course
      ));
      
      setEditModalVisible(false);
      Alert.alert('Éxito', 'Curso actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el curso');
      console.error(error);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const courseRef = doc(db, 'users', user.uid, 'cursos', selectedCourse.id);
      await deleteDoc(courseRef);
      
      setCourses(courses.filter(course => course.id !== selectedCourse.id));
      setEditModalVisible(false);
      Alert.alert('Éxito', 'Curso eliminado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el curso');
      console.error(error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchCourses(user.uid);
      } else {
        setCourses([]);
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    if (auth.currentUser) {
      fetchCourses(auth.currentUser.uid);
    }
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
    >
      <View style={styles.courseInfo}>
        <Text style={styles.courseName}>{item.name}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            <Ionicons name="people" size={14} color="#666" /> {item.students?.length || 0}
          </Text>
          {item.createdAt && (
            <Text style={styles.metaText}>
              <Ionicons name="calendar" size={14} color="#666" />{' '}
              {item.createdAt.toDate().toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
  
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            setSelectedCourse(item);
            setNewCourseName(item.name);
            setEditModalVisible(true);
          }}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={20} color="#4CAF50" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('AttendanceHistory', { courseId: item.id })}
          style={styles.historyButton}
        >
          <Ionicons name="time" size={20} color="#3533c0" />
        </TouchableOpacity>
        
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3533c0" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Cursos</Text>
      
      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3533c0']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school" size={60} color="#999" />
            <Text style={styles.emptyText}>No tienes cursos creados</Text>
          </View>
        }
      />

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Curso</Text>
            
            <TextInput
              style={styles.input}
              value={newCourseName}
              onChangeText={setNewCourseName}
              placeholder="Nombre del curso"
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateCourse}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCourse')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#1a1a1a',
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
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
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3533c0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#3533c0',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
  },
  historyButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  modalButtonsContainer: {
    gap: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});