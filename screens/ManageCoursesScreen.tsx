import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl} from 'react-native';
import { db, auth } from '../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
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
  const navigation = useNavigation<ManageCoursesNavigationProp>();

  const fetchCourses = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'users', userId, 'cursos'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      
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

  const handleSelectCourse = (courseId: string) => {
    navigation.navigate('CourseDetails', { courseId });
  };
  

  // const renderCourseItem = ({ item }: { item: Course }) => (
  //   <TouchableOpacity
  //     style={styles.courseCard}
  //     onPress={() => handleSelectCourse(item.id)}
  //   >
  //     <View style={styles.courseInfo}>
  //       <Text style={styles.courseName}>{item.name}</Text>
  //       <View style={styles.metaContainer}>
  //         <Text style={styles.metaText}>
  //           <Ionicons name="people" size={14} color="#666" /> {item.students?.length || 0}
  //         </Text>
  //         {item.createdAt && (
  //           <Text style={styles.metaText}>
  //             <Ionicons name="calendar" size={14} color="#666" />{' '}
  //             {item.createdAt.toDate().toLocaleDateString()}
  //           </Text>
  //         )}
  //       </View>
  //     </View>
  //     <Ionicons name="chevron-forward" size={24} color="#999" />
  //   </TouchableOpacity>
  // );
  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => handleSelectCourse(item.id)}
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
          onPress={() => navigation.navigate('AttendanceHistory', { courseId: item.id })}
          style={styles.historyButton}
        >
          <Ionicons name="time" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
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
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school" size={60} color="#999" />
            <Text style={styles.emptyText}>No tienes cursos creados</Text>
          </View>
        }
      />
      
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
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
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
  historyButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
});