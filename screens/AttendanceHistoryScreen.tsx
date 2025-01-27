// import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
// import { db, auth } from '../firebase/config';
// import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
// import { MaterialIcons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// interface Course {
//   id: string;
//   name: string;
// }

// interface AttendanceRecord {
//   id: string;
//   studentEmail: string;
//   date: Date;
//   status: string;
// }

// export default function AttendanceHistoryScreen() {
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
//   const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const user = auth.currentUser;

//   useEffect(() => {
//     const fetchCourses = async () => {
//       try {
//         if (!user) {
//           setError('Usuario no autenticado');
//           return;
//         }

//         setLoading(true);
//         const cursosRef = collection(db, 'users', user.uid, 'cursos');
//         const querySnapshot = await getDocs(cursosRef);
        
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
//   }, [user]);

  
//   const fetchAttendanceRecords = async (courseId: string) => {
//     try {
//       if (!user) {
//         setError('Usuario no autenticado');
//         return;
//       }

//       setLoading(true);
//       const asistenciasRef = collection(
//         db, 
//         'users', 
//         user.uid, 
//         'cursos', 
//         courseId, 
//         'asistencias'
//       );
      
//       const q = query(asistenciasRef, orderBy('date', 'desc'));
//       const querySnapshot = await getDocs(q);

//       const records = querySnapshot.docs.map(doc => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           studentEmail: data.studentEmail,
//           date: data.date?.toDate() || new Date(),
//           status: data.status || 'presente'
//         };
//       });

//       setAttendanceRecords(records);
//       setError(null);
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
//     <TouchableOpacity 
//       style={styles.courseCard}
//       onPress={() => handleCourseSelection(item.id)}
//     >
//       <MaterialIcons name="class" size={24} color="#2A5298" />
//       <Text style={styles.courseName}>{item.name}</Text>
//       <MaterialIcons name="chevron-right" size={24} color="#6C757D" />
//     </TouchableOpacity>
//   );

  

//   const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => (
//     <View style={styles.attendanceCard}>
//       <View style={styles.cardHeader}>
//         <MaterialIcons name="history" size={20} color="#4CAF50" />
//         <Text style={styles.cardTitle}>Registro de Asistencia</Text>
//       </View>

//       <View style={styles.detailRow}>
//         <MaterialIcons name="person" size={18} color="#2A5298" />
//         <Text style={styles.detailText}>{item.studentEmail}</Text>
//       </View>

//       <View style={styles.detailRow}>
//         <MaterialIcons name="calendar-today" size={18} color="#2A5298" />
//         <Text style={styles.detailText}>
//           {item.date.toLocaleDateString('es-ES', {
//             weekday: 'long',
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//           })}
//         </Text>
//       </View>

//       <View style={styles.detailRow}>
//         <MaterialIcons name="access-time" size={18} color="#2A5298" />
//         <Text style={styles.detailText}>
//           {item.date.toLocaleTimeString('es-ES', {
//             hour: '2-digit',
//             minute: '2-digit'
//           })}
//         </Text>
//       </View>

//       <View style={styles.statusContainer}>
//         <Text style={[
//           styles.statusText,
//           item.status === 'presente' ? styles.present : styles.absent
//         ]}>
//           {item.status.toUpperCase()}
//         </Text>
//       </View>
//     </View>
//   );



//   return (
//     <LinearGradient
//       colors={['#FFFFFF', '#F8F9FA']}
//       style={styles.container}
//     >
//       <Text style={styles.title}>📅 Historial de Asistencia</Text>

//       {!selectedCourse ? (
//         <FlatList
//           data={courses}
//           renderItem={renderCourseItem}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.courseList}
//           ListHeaderComponent={
//             <Text style={styles.sectionTitle}>Selecciona un curso</Text>
//           }
//         />
//       ) : (
//         <FlatList
//           data={attendanceRecords}
//           renderItem={renderAttendanceItem}
//           keyExtractor={(item, index) => index.toString()}
//           contentContainerStyle={styles.attendanceList}
//           ListHeaderComponent={
//             <View style={styles.headerContainer}>
//               <TouchableOpacity 
//                 style={styles.backButton}
//                 onPress={() => setSelectedCourse(null)}
//               >
//                 <MaterialIcons name="arrow-back" size={24} color="#2A5298" />
//               </TouchableOpacity>
//               <Text style={styles.sectionTitle}>Registros de asistencia</Text>
//             </View>
//           }
//         />
//       )}

//       {loading && (
//         <View style={styles.loadingOverlay}>
//           <View style={styles.loadingCard}>
//             <ActivityIndicator size="large" color="#2A5298" />
//             <Text style={styles.loadingText}>Cargando datos...</Text>
//           </View>
//         </View>
//       )}

//       {error && (
//         <View style={styles.errorCard}>
//           <MaterialIcons name="error-outline" size={32} color="#dc3545" />
//           <Text style={styles.errorText}>{error}</Text>
//         </View>
//       )}
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontFamily: Platform.select({ android: 'Roboto-Bold', ios: 'System' }),
//     color: '#2A5298',
//     textAlign: 'center',
//     marginVertical: 20,
//     letterSpacing: 0.5,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//     color: '#495057',
//     marginVertical: 15,
//     paddingHorizontal: 20,
//   },
//   courseList: {
//     paddingBottom: 20,
//   },
//   attendanceList: {
//     paddingBottom: 40,
//   },
//   courseCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 18,
//     marginVertical: 8,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#2A5298',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 6,
//       },
//       android: {
//         elevation: 3,
//       },
//     }),
//     borderWidth: 1,
//     borderColor: '#E9ECEF',
//   },
//   courseName: {
//     flex: 1,
//     fontSize: 16,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//     color: '#444',
//     marginHorizontal: 15,
//   },
//   attendanceCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 15,
//     padding: 20,
//     marginVertical: 10,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#2A5298',
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.1,
//         shadowRadius: 10,
//       },
//       android: {
//         elevation: 5,
//       },
//     }),
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F3F5',
//     paddingBottom: 10,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//     color: '#2D3436',
//     marginLeft: 10,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 8,
//   },
//   detailText: {
//     fontSize: 14,
//     fontFamily: Platform.select({ android: 'Roboto-Regular', ios: 'System' }),
//     color: '#495057',
//     marginLeft: 10,
//   },
//   studentsContainer: {
//     marginTop: 15,
//   },
//   studentsHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   studentsCount: {
//     fontSize: 14,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//     color: '#2A5298',
//     marginLeft: 10,
//   },
//   studentEmail: {
//     fontSize: 12,
//     fontFamily: Platform.select({ android: 'Roboto-Regular', ios: 'System' }),
//     color: '#6C757D',
//     marginVertical: 3,
//     paddingLeft: 28,
//   },
//   headerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   backButton: {
//     padding: 8,
//     marginRight: 10,
//   },
//   loadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(255,255,255,0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 35,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#2A5298',
//         shadowOffset: { width: 0, height: 6 },
//         shadowOpacity: 0.1,
//         shadowRadius: 12,
//       },
//       android: {
//         elevation: 8,
//       },
//     }),
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 16,
//     color: '#6C757D',
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//   },
//   errorCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 20,
//     margin: 20,
//     alignItems: 'center',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#dc3545',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 6,
//       },
//       android: {
//         elevation: 3,
//       },
//     }),
//   },
//   errorText: {
//     color: '#dc3545',
//     fontSize: 16,
//     marginTop: 10,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//     textAlign: 'center',
//   },

//   statusContainer: {
//     marginTop: 15,
//     alignItems: 'flex-end',
//   },
//   statusText: {
//     fontSize: 14,
//     fontFamily: Platform.select({ android: 'Roboto-Bold', ios: 'System' }),
//     paddingVertical: 4,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },
//   present: {
//     backgroundColor: '#4CAF5020',
//     color: '#4CAF50',
//   },
//   absent: {
//     backgroundColor: '#ff444420',
//     color: '#ff4444',
//   },
// });

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { db, auth } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import * as XLSX from 'xlsx';
import RNPickerSelect from 'react-native-picker-select';

interface AttendanceRecord {
  date: string;
  status: 'presente' | 'ausente';
  studentEmail: string;
}

const AttendanceHistoryScreen = ({ route }) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState<string[]>([]);
  const { courseId } = route.params;

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Obtener lista de estudiantes
        const studentsRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
        const studentsSnapshot = await getDocs(studentsRef);
        const studentEmails = studentsSnapshot.docs.map(doc => doc.data().email);
        setStudents(studentEmails);

        // Obtener asistencias
        const attendanceRef = collection(db, 'users', user.uid, 'cursos', courseId, 'asistencias');
        const q = query(attendanceRef);
        const querySnapshot = await getDocs(q);

        const data: AttendanceRecord[] = [];
        querySnapshot.forEach(doc => {
          const attendance = doc.data();
          const date = attendance.date.toDate();
          data.push({
            date: date.toISOString().split('T')[0],
            status: attendance.status,
            studentEmail: attendance.studentEmail
          });
        });

        setAttendanceData(data);
        updateMarkedDates(data, selectedStudent);
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [courseId, selectedStudent]);

  const updateMarkedDates = (data: AttendanceRecord[], student: string) => {
    const marks: { [key: string]: { customStyles: { container: { backgroundColor: string; borderRadius: number; }; text: { color: string; }; }; } } = {};
    data
      .filter(record => !student || record.studentEmail === student)
      .forEach(record => {
        marks[record.date] = {
          customStyles: {
            container: {
              backgroundColor: record.status === 'presente' ? '#4CAF50' : '#F44336',
              borderRadius: 5
            },
            text: {
              color: 'white'
            }
          }
        };
      });
    setMarkedDates(marks);
  };

  const generateExcel = async () => {
    try {
      // Crear estructura de datos
      const wsData = [
        ['Estudiante', 'Fecha', 'Estado'],
        ...attendanceData.map(record => [
          record.studentEmail,
          record.date,
          record.status === 'presente' ? 'Presente' : 'Ausente'
        ])
      ];

      // Crear hoja de cálculo
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

      // Generar archivo
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'asistencias.xlsx';
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Compartir archivo
      await shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar Asistencias',
        UTI: 'com.microsoft.excel.xlsx'
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el archivo');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Asistencias</Text>
        <TouchableOpacity onPress={generateExcel} style={styles.excelButton}>
          <MaterialIcons name="file-download" size={24} color="white" />
          <Text style={styles.excelButtonText}>Exportar a Excel</Text>
        </TouchableOpacity>
      </View>

      <RNPickerSelect
        onValueChange={value => setSelectedStudent(value)}
        items={students.map(student => ({ label: student, value: student }))}
        placeholder={{ label: 'Todos los estudiantes', value: '' }}
        style={pickerSelectStyles}
      />

      <Calendar
        markedDates={markedDates}
        markingType="custom"
        theme={{
          calendarBackground: '#fff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8'
        }}
        style={styles.calendar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  calendar: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3
  },
  excelButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center'
  },
  excelButtonText: {
    color: 'white',
    marginLeft: 5
  }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    marginBottom: 15
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    marginBottom: 15
  }
});

export default AttendanceHistoryScreen;