// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { db } from '../firebase/config';
// import { collection, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
// import { Ionicons } from '@expo/vector-icons';

// interface Course {
//   id: string;
//   name: string;
// }

// interface AttendanceRecord {
//   date: Timestamp | Date;
//   studentsPresent: string[];
// }

// export default function AttendanceHistoryScreen() {
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
//   const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchCourses = async () => {
//       try {
//         setLoading(true);
//         const querySnapshot = await getDocs(collection(db, 'courses'));
//         const coursesData = querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           name: doc.data().name,
//         }));
//         setCourses(coursesData);
//         setError(null);
//       } catch (err) {
//         setError('Error al cargar los cursos');
//         console.error('Error fetching courses:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCourses();
//   }, []);

//   const safeConvertToDate = (firebaseDate: Timestamp | Date | any): Date => {
//     try {
//       if (firebaseDate instanceof Timestamp) {
//         return firebaseDate.toDate();
//       }
//       if (firebaseDate?.toDate) {
//         return firebaseDate.toDate();
//       }
//       if (typeof firebaseDate === 'string') {
//         return new Date(firebaseDate);
//       }
//       return new Date();
//     } catch (error) {
//       console.error('Error converting date:', error);
//       return new Date();
//     }
//   };

//   const fetchAttendanceRecords = async (courseId: string) => {
//     try {
//       setLoading(true);
//       const courseRef = doc(db, 'courses', courseId);
//       const courseDoc = await getDoc(courseRef);

//       if (courseDoc.exists()) {
//         const data = courseDoc.data();
//         const history = data.attendanceHistory?.map((record: any) => ({
//           date: record.date ? safeConvertToDate(record.date) : new Date(),
//           studentsPresent: record.studentsPresent || [],
//         })) || [];
        
//         setAttendanceRecords(history);
//         setError(null);
//       } else {
//         setError('Curso no encontrado');
//       }
//     } catch (error) {
//       setError('Error al cargar el historial');
//       console.error('Error fetching attendance:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCourseSelection = (courseId: string) => {
//     setSelectedCourse(courseId);
//     fetchAttendanceRecords(courseId);
//   };

//   const renderCourseItem = ({ item }: { item: Course }) => (
//     <View style={styles.courseButton}>
//       <Ionicons 
//         name="book" 
//         size={20} 
//         color="#1e88e5" 
//         style={styles.courseIcon} 
//       />
//       <Text 
//         style={styles.courseName}
//         onPress={() => handleCourseSelection(item.id)}
//       >
//         {item.name}
//       </Text>
//     </View>
//   );

//   const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => {
//     const recordDate = safeConvertToDate(item.date);
    
//     return (
//       <View style={styles.attendanceCard}>
//         <View style={styles.dateContainer}>
//           <Ionicons name="calendar" size={18} color="#4CAF50" />
//           <Text style={styles.dateText}>
//             {recordDate.toLocaleDateString('es-ES', {
//               weekday: 'long',
//               year: 'numeric',
//               month: 'long',
//               day: 'numeric',
//             })}
//           </Text>
//         </View>
        
//         <View style={styles.timeContainer}>
//           <Ionicons name="time" size={16} color="#FF9800" />
//           <Text style={styles.timeText}>
//             {recordDate.toLocaleTimeString('es-ES', {
//               hour: '2-digit',
//               minute: '2-digit'
//             })}
//           </Text>
//         </View>

//         <View style={styles.studentsContainer}>
//           <Ionicons name="people" size={16} color="#9C27B0" />
//           <Text style={styles.studentsText}>
//             {item.studentsPresent.length} estudiantes presentes
//           </Text>
//         </View>

//         <FlatList
//           data={item.studentsPresent}
//           keyExtractor={(item) => item}
//           renderItem={({ item }) => (
//             <Text style={styles.studentEmail}>{item}</Text>
//           )}
//           style={styles.studentList}
//         />
//       </View>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#1e88e5" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centered}>
//         <Ionicons name="warning" size={40} color="#d32f2f" />
//         <Text style={styles.errorText}>{error}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Historial de Asistencia</Text>
      
//       <FlatList
//         data={courses}
//         renderItem={renderCourseItem}
//         keyExtractor={item => item.id}
//         ListHeaderComponent={
//           <Text style={styles.subtitle}>Selecciona un curso:</Text>
//         }
//         contentContainerStyle={styles.courseList}
//       />

//       {selectedCourse && (
//         <FlatList
//           data={attendanceRecords}
//           renderItem={renderAttendanceItem}
//           keyExtractor={(item, index) => index.toString()}
//           ListHeaderComponent={
//             <Text style={styles.subtitle}>Registros de asistencia:</Text>
//           }
//           contentContainerStyle={styles.attendanceList}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//     paddingHorizontal: 16,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1a237e',
//     marginVertical: 20,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#3f51b5',
//     marginVertical: 10,
//     paddingHorizontal: 16,
//   },
//   courseList: {
//     paddingBottom: 20,
//   },
//   attendanceList: {
//     paddingBottom: 40,
//   },
//   courseButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e3f2fd',
//     borderRadius: 8,
//     padding: 16,
//     marginVertical: 8,
//     marginHorizontal: 16,
//   },
//   courseIcon: {
//     marginRight: 12,
//   },
//   courseName: {
//     fontSize: 16,
//     color: '#1a237e',
//     fontWeight: '500',
//   },
//   attendanceCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginVertical: 8,
//     marginHorizontal: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   dateContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   dateText: {
//     fontSize: 16,
//     color: '#2d3436',
//     marginLeft: 8,
//   },
//   timeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   timeText: {
//     fontSize: 14,
//     color: '#FF9800',
//     marginLeft: 8,
//   },
//   studentsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   studentsText: {
//     fontSize: 14,
//     color: '#9C27B0',
//     marginLeft: 8,
//   },
//   studentList: {
//     marginTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//     paddingTop: 8,
//   },
//   studentEmail: {
//     fontSize: 12,
//     color: '#666',
//     marginVertical: 2,
//   },
//   errorText: {
//     color: '#d32f2f',
//     fontSize: 16,
//     marginTop: 16,
//     textAlign: 'center',
//     paddingHorizontal: 20,
//   },
// });

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform
} from 'react-native';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Course {
  id: string;
  name: string;
}

interface AttendanceRecord {
  date: Timestamp | Date;
  studentsPresent: string[];
}

export default function AttendanceHistoryScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setCourses(coursesData);
        setError(null);
      } catch (err) {
        setError('Error al cargar los cursos');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const safeConvertToDate = (firebaseDate: Timestamp | Date | any): Date => {
    try {
      if (firebaseDate instanceof Timestamp) {
        return firebaseDate.toDate();
      }
      if (firebaseDate?.toDate) {
        return firebaseDate.toDate();
      }
      if (typeof firebaseDate === 'string') {
        return new Date(firebaseDate);
      }
      return new Date();
    } catch (error) {
      console.error('Error converting date:', error);
      return new Date();
    }
  };

  const fetchAttendanceRecords = async (courseId: string) => {
    try {
      setLoading(true);
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);

      if (courseDoc.exists()) {
        const data = courseDoc.data();
        const history = data.attendanceHistory?.map((record: any) => ({
          date: record.date ? safeConvertToDate(record.date) : new Date(),
          studentsPresent: record.studentsPresent || [],
        })) || [];
        
        setAttendanceRecords(history);
        setError(null);
      } else {
        setError('Curso no encontrado');
      }
    } catch (error) {
      setError('Error al cargar el historial');
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelection = (courseId: string) => {
    setSelectedCourse(courseId);
    fetchAttendanceRecords(courseId);
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => handleCourseSelection(item.id)}
    >
      <MaterialIcons name="class" size={24} color="#2A5298" />
      <Text style={styles.courseName}>{item.name}</Text>
      <MaterialIcons name="chevron-right" size={24} color="#6C757D" />
    </TouchableOpacity>
  );

  const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => {
    const recordDate = safeConvertToDate(item.date);
    
    return (
      <View style={styles.attendanceCard}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="history" size={20} color="#4CAF50" />
          <Text style={styles.cardTitle}>Registro de Asistencia</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="calendar-today" size={18} color="#2A5298" />
          <Text style={styles.detailText}>
            {recordDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={18} color="#2A5298" />
          <Text style={styles.detailText}>
            {recordDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        <View style={styles.studentsContainer}>
          <View style={styles.studentsHeader}>
            <MaterialIcons name="people-alt" size={18} color="#2A5298" />
            <Text style={styles.studentsCount}>
              {item.studentsPresent.length} Estudiantes
            </Text>
          </View>
          
          <FlatList
            data={item.studentsPresent}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Text style={styles.studentEmail} numberOfLines={1} ellipsizeMode="tail">
                {item}
              </Text>
            )}
          />
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FA']}
      style={styles.container}
    >
      <Text style={styles.title}>📅 Historial de Asistencia</Text>

      {!selectedCourse ? (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.courseList}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Selecciona un curso</Text>
          }
        />
      ) : (
        <FlatList
          data={attendanceRecords}
          renderItem={renderAttendanceItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.attendanceList}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedCourse(null)}
              >
                <MaterialIcons name="arrow-back" size={24} color="#2A5298" />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Registros de asistencia</Text>
            </View>
          }
        />
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2A5298" />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={32} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: Platform.select({ android: 'Roboto-Bold', ios: 'System' }),
    color: '#2A5298',
    textAlign: 'center',
    marginVertical: 20,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
    color: '#495057',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  courseList: {
    paddingBottom: 20,
  },
  attendanceList: {
    paddingBottom: 40,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#2A5298',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  courseName: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
    color: '#444',
    marginHorizontal: 15,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#2A5298',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
    color: '#2D3436',
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: Platform.select({ android: 'Roboto-Regular', ios: 'System' }),
    color: '#495057',
    marginLeft: 10,
  },
  studentsContainer: {
    marginTop: 15,
  },
  studentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentsCount: {
    fontSize: 14,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
    color: '#2A5298',
    marginLeft: 10,
  },
  studentEmail: {
    fontSize: 12,
    fontFamily: Platform.select({ android: 'Roboto-Regular', ios: 'System' }),
    color: '#6C757D',
    marginVertical: 3,
    paddingLeft: 28,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 35,
    ...Platform.select({
      ios: {
        shadowColor: '#2A5298',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6C757D',
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    marginTop: 10,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
    textAlign: 'center',
  },
});