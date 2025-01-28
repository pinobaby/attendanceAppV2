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


// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   ActivityIndicator, 
//   Alert, 
//   Platform 
// } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { Calendar } from 'react-native-calendars';
// import { db, auth } from '../firebase/config';
// import { collection, query, getDocs } from 'firebase/firestore';
// import { MaterialIcons } from '@expo/vector-icons';
// import * as FileSystem from 'expo-file-system';
// import { shareAsync } from 'expo-sharing';
// import * as XLSX from 'xlsx';

// interface AttendanceRecord {
//   date: string;
//   status: 'presente' | 'ausente';
//   studentEmail: string;
// }

// const AttendanceHistoryScreen = ({ route }) => {
//   const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
//   const [markedDates, setMarkedDates] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [selectedStudent, setSelectedStudent] = useState('');
//   const [students, setStudents] = useState<string[]>([]);
//   const { courseId } = route.params;

//   useEffect(() => {
//     const fetchAttendanceData = async () => {
//       try {
//         const user = auth.currentUser;
//         if (!user) return;

//         // Obtener lista de estudiantes
//         const studentsRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
//         const studentsSnapshot = await getDocs(studentsRef);
//         const studentEmails = studentsSnapshot.docs.map(doc => doc.data().email);
//         setStudents(studentEmails);

//         // Obtener asistencias
//         const attendanceRef = collection(db, 'users', user.uid, 'cursos', courseId, 'asistencias');
//         const q = query(attendanceRef);
//         const querySnapshot = await getDocs(q);

//         const data: AttendanceRecord[] = [];
//         querySnapshot.forEach(doc => {
//           const attendance = doc.data();
//           const date = attendance.date.toDate();
//           data.push({
//             date: date.toISOString().split('T')[0],
//             status: attendance.status,
//             studentEmail: attendance.studentEmail
//           });
//         });

//         setAttendanceData(data);
//         updateMarkedDates(data, selectedStudent);
//       } catch (error) {
//         Alert.alert('Error', 'No se pudo cargar el historial');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAttendanceData();
//   }, [courseId, selectedStudent]);

//   const updateMarkedDates = (data: AttendanceRecord[], student: string) => {
//     const marks: { [key: string]: { customStyles: { container: { backgroundColor: string; borderRadius: number; }; text: { color: string; }; }; } } = {};
//     data
//       .filter(record => !student || record.studentEmail === student)
//       .forEach(record => {
//         marks[record.date] = {
//           customStyles: {
//             container: {
//               backgroundColor: record.status === 'presente' ? '#4CAF50' : '#F44336',
//               borderRadius: 5
//             },
//             text: {
//               color: 'white'
//             }
//           }
//         };
//       });
//     setMarkedDates(marks);
//   };

//   const generateExcel = async () => {
//     try {
//       const wsData = [
//         ['Estudiante', 'Fecha', 'Estado'],
//         ...attendanceData.map(record => [
//           record.studentEmail,
//           record.date,
//           record.status === 'presente' ? 'Presente' : 'Ausente'
//         ])
//       ];

//       const ws = XLSX.utils.aoa_to_sheet(wsData);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

//       const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
//       const uri = FileSystem.cacheDirectory + 'asistencias.xlsx';
//       await FileSystem.writeAsStringAsync(uri, wbout, {
//         encoding: FileSystem.EncodingType.Base64
//       });

//       await shareAsync(uri, {
//         mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         dialogTitle: 'Exportar Asistencias'
//       });
//     } catch (error) {
//       Alert.alert('Error', 'No se pudo generar el archivo');
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#2196F3" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Historial de Asistencias</Text>
//         <View style={[
//           styles.pickerContainer,
//           Platform.OS === 'ios' && styles.iosPickerContainer
//         ]}>
//           <Picker
//             selectedValue={selectedStudent}
//             onValueChange={(itemValue) => setSelectedStudent(itemValue)}
//             dropdownIconColor="#666"
//             mode="dropdown"
//             style={styles.picker}
//             itemStyle={styles.pickerItem}
//           >
//             <Picker.Item 
//               label="Todos los estudiantes" 
//               value="" 
//             />
//             {students.map((student, index) => (
//               <Picker.Item 
//                 key={index} 
//                 label={student} 
//                 value={student} 
//               />
//             ))}
//           </Picker>
//         </View>
//       </View>

//       <Calendar
//         markedDates={markedDates}
//         markingType="custom"
//         theme={{
//           calendarBackground: '#fff',
//           todayTextColor: '#00adf5',
//           dayTextColor: '#2d4150',
//           textDisabledColor: '#d9e1e8',
//           arrowColor: '#2196F3',
//         }}
//         style={styles.calendar}
//       />

//       <TouchableOpacity 
//         onPress={generateExcel} 
//         style={styles.floatingButton}
//         activeOpacity={0.9}
//       >
//         <MaterialIcons name="file-download" size={26} color="white" />
//         <Text style={styles.floatingButtonText}>Exportar</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#f5f5f5'
//   },
//   header: {
//     marginBottom: 15
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: '#1a237e',
//     marginBottom: 20,
//     textAlign: 'center'
//   },
//   pickerContainer: {
//     backgroundColor: 'white',
//     borderRadius: 10,
//     marginBottom: 20,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     minHeight: 50,
//     justifyContent: 'center',
//   },
//   iosPickerContainer: {
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     overflow: 'hidden',
//     height: 50,
//   },
//   picker: {
//     width: '100%',
//     color: '#333',
//     backgroundColor: 'transparent',
//     transform: Platform.select({
//       ios: [{ scaleX: 1 }, { scaleY: 1 }],
//     }),
//   },
//   pickerItem: {
//     fontSize: 16,
//     color: '#333',
//     backgroundColor: 'white',
//   },
//   calendar: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   floatingButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     flexDirection: 'row',
//     backgroundColor: '#2196F3',
//     paddingVertical: 15,
//     paddingHorizontal: 25,
//     borderRadius: 30,
//     alignItems: 'center',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     zIndex: 10
//   },
//   floatingButtonText: {
//     color: 'white',
//     marginLeft: 12,
//     fontWeight: '600',
//     fontSize: 16
//   },
// });

// export default AttendanceHistoryScreen;

// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   ActivityIndicator, 
//   Alert, 
//   Platform 
// } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { Calendar } from 'react-native-calendars';
// import { db, auth } from '../firebase/config';
// import { collection, query, getDocs } from 'firebase/firestore';
// import { MaterialIcons } from '@expo/vector-icons';
// import * as FileSystem from 'expo-file-system';
// import { shareAsync } from 'expo-sharing';
// import * as XLSX from 'xlsx';

// interface AttendanceRecord {
//   date: string;
//   status: 'presente' | 'ausente';
//   studentEmail: string;
// }

// interface Student {
//   email: string;
//   name: string;
// }

// const AttendanceHistoryScreen = ({ route }) => {
//   const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
//   const [markedDates, setMarkedDates] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [selectedStudent, setSelectedStudent] = useState('');
//   const [students, setStudents] = useState<Student[]>([]);
//   const { courseId } = route.params;

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const user = auth.currentUser;
//         if (!user) return;

//         // Obtener lista de estudiantes con nombres
//         if (students.length === 0) {
//           const studentsRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
//           const studentsSnapshot = await getDocs(studentsRef);
//           const studentList = studentsSnapshot.docs.map(doc => ({
//             email: doc.data().email,
//             name: doc.data().nombre || doc.data().name || 'Sin nombre'
//           }));
//           setStudents(studentList);
//         }

//         // Obtener todas las asistencias
//         const attendanceRef = collection(db, 'users', user.uid, 'cursos', courseId, 'asistencias');
//         const q = query(attendanceRef);
//         const querySnapshot = await getDocs(q);

//         const data: AttendanceRecord[] = [];
//         querySnapshot.forEach(doc => {
//           const attendance = doc.data();
//           const date = attendance.date.toDate();
//           data.push({
//             date: date.toISOString().split('T')[0],
//             status: attendance.status,
//             studentEmail: attendance.studentEmail
//           });
//         });

//         setAttendanceData(data);
//       } catch (error) {
//         Alert.alert('Error', 'No se pudo cargar el historial');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [courseId]);

//   useEffect(() => {
//     updateMarkedDates(attendanceData, selectedStudent);
//   }, [selectedStudent, attendanceData]);

//   const updateMarkedDates = (data: AttendanceRecord[], student: string) => {
//     const marks: { [key: string]: { customStyles: { container: { backgroundColor: string; borderRadius: number; }; text: { color: string; }; }; } } = {};
//     data
//       .filter(record => !student || record.studentEmail === student)
//       .forEach(record => {
//         marks[record.date] = {
//           customStyles: {
//             container: {
//               backgroundColor: record.status === 'presente' ? '#4CAF50' : '#F44336',
//               borderRadius: 5
//             },
//             text: {
//               color: 'white'
//             }
//           }
//         };
//       });
//     setMarkedDates(marks);
//   };

//   const getStudentName = (email: string): string => {
//     const student = students.find(s => s.email === email);
//     return student ? student.name : email;
//   };

//   const generateExcel = async () => {
//     try {
//       const filteredData = selectedStudent 
//         ? attendanceData.filter(record => record.studentEmail === selectedStudent)
//         : attendanceData;

//       const wsData = [
//         ['Estudiante', 'Fecha', 'Estado'],
//         ...filteredData.map(record => [
//           getStudentName(record.studentEmail),
//           record.date,
//           record.status === 'presente' ? 'Presente' : 'Ausente'
//         ])
//       ];

//       const ws = XLSX.utils.aoa_to_sheet(wsData);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

//       const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
//       const uri = FileSystem.cacheDirectory + 'asistencias.xlsx';
//       await FileSystem.writeAsStringAsync(uri, wbout, {
//         encoding: FileSystem.EncodingType.Base64
//       });

//       await shareAsync(uri, {
//         mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         dialogTitle: 'Exportar Asistencias'
//       });
//     } catch (error) {
//       Alert.alert('Error', 'No se pudo generar el archivo');
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#2196F3" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Historial de Asistencias</Text>
//         <View style={[
//           styles.pickerContainer,
//           Platform.OS === 'ios' && styles.iosPickerContainer
//         ]}>
//           <Picker
//             selectedValue={selectedStudent}
//             onValueChange={(itemValue) => setSelectedStudent(itemValue)}
//             dropdownIconColor="#666"
//             mode="dropdown"
//             style={styles.picker}
//             itemStyle={styles.pickerItem}
//           >
//             <Picker.Item 
//               label="Todos los estudiantes" 
//               value="" 
//             />
//             {students.map((student, index) => (
//               <Picker.Item 
//                 key={index} 
//                 label={student.name} 
//                 value={student.email} 
//               />
//             ))}
//           </Picker>
//         </View>
//       </View>

//       <Calendar
//         markedDates={markedDates}
//         markingType="custom"
//         theme={{
//           calendarBackground: '#fff',
//           todayTextColor: '#00adf5',
//           dayTextColor: '#2d4150',
//           textDisabledColor: '#d9e1e8',
//           arrowColor: '#2196F3',
//         }}
//         style={styles.calendar}
//       />

//       <TouchableOpacity 
//         onPress={generateExcel} 
//         style={styles.floatingButton}
//         activeOpacity={0.9}
//       >
//         <MaterialIcons name="file-download" size={26} color="white" />
//         <Text style={styles.floatingButtonText}>Exportar</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#f5f5f5'
//   },
//   header: {
//     marginBottom: 15
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: '#1a237e',
//     marginBottom: 20,
//     textAlign: 'center'
//   },
//   pickerContainer: {
//     backgroundColor: 'white',
//     borderRadius: 10,
//     marginBottom: 20,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     minHeight: 50,
//     justifyContent: 'center',
//   },
//   iosPickerContainer: {
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     overflow: 'hidden',
//     height: 50,
//   },
//   picker: {
//     width: '100%',
//     color: '#333',
//     backgroundColor: 'transparent',
//     transform: Platform.select({
//       ios: [{ scaleX: 1 }, { scaleY: 1 }],
//     }),
//   },
//   pickerItem: {
//     fontSize: 16,
//     color: '#333',
//     backgroundColor: 'white',
//   },
//   calendar: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   floatingButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     flexDirection: 'row',
//     backgroundColor: '#2196F3',
//     paddingVertical: 15,
//     paddingHorizontal: 25,
//     borderRadius: 30,
//     alignItems: 'center',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     zIndex: 10
//   },
//   floatingButtonText: {
//     color: 'white',
//     marginLeft: 12,
//     fontWeight: '600',
//     fontSize: 16
//   },
// });

// export default AttendanceHistoryScreen;

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Platform,
  LayoutAnimation,
  UIManager,
  Modal
} from 'react-native';

import { Calendar } from 'react-native-calendars';
import { db, auth } from '../firebase/config';
import { collection, query, getDocs } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Picker } from '@react-native-picker/picker';
interface AttendanceRecord {
  date: string;
  status: 'presente' | 'ausente';
  studentEmail: string;
}

interface Student {
  email: string;
  name: string;
}

const AttendanceHistoryScreen = ({ route }) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { courseId } = route.params;

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

      
        if (students.length === 0) {
          const studentsRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
          const studentsSnapshot = await getDocs(studentsRef);
          const studentList = studentsSnapshot.docs.map(doc => ({
            email: doc.data().email,
            name: doc.data().nombre || doc.data().name || 'Sin nombre'
          }));
          setStudents(studentList);
        }

     
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
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  useEffect(() => {
    updateMarkedDates(attendanceData, selectedStudent);
  }, [selectedStudent, attendanceData]);

  const updateMarkedDates = (data: AttendanceRecord[], student: string) => {
    const marks: { [key: string]: { customStyles: { container: { backgroundColor: string; borderRadius: number; }; text: { color: string; }; }; } } = {};
    const today = new Date().toISOString().split('T')[0];

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

 
    marks[today] = {
      customStyles: {
        container: {
          backgroundColor: '#00adf5',
          borderRadius: 5,
        },
        text: {
          color: 'white',
        },
      },
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMarkedDates(marks);
  };

  const getStudentName = (email: string): string => {
    const student = students.find(s => s.email === email);
    return student ? student.name : email;
  };

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const closeModal = () => {
    setSelectedDate(null);
  };

  const getSummary = () => {
    const filteredData = selectedStudent
      ? attendanceData.filter(record => record.studentEmail === selectedStudent)
      : attendanceData;

    const presentes = filteredData.filter(record => record.status === 'presente').length;
    const ausentes = filteredData.filter(record => record.status === 'ausente').length;

    return `Presentes: ${presentes}, Ausentes: ${ausentes}`;
  };

  const generateExcel = async () => {
    try {
      const filteredData = selectedStudent 
        ? attendanceData.filter(record => record.studentEmail === selectedStudent)
        : attendanceData;

      const wsData = [
        ['Estudiante', 'Fecha', 'Estado'],
        ...filteredData.map(record => [
          getStudentName(record.studentEmail),
          record.date,
          record.status === 'presente' ? 'Presente' : 'Ausente'
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'asistencias.xlsx';
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });

      await shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar Asistencias'
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el archivo');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Asistencias</Text>
        <View style={[
          styles.pickerContainer,
          Platform.OS === 'ios' && styles.iosPickerContainer
        ]}>
          <Picker
            selectedValue={selectedStudent}
            onValueChange={(itemValue: React.SetStateAction<string>) => setSelectedStudent(itemValue)}
            dropdownIconColor="#666"
            mode="dropdown"
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item 
              label="Todos los estudiantes" 
              value="" 
            />
            {students.map((student, index) => (
              <Picker.Item 
                key={index} 
                label={student.name} 
                value={student.email} 
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Leyenda de Colores */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Presente</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Ausente</Text>
        </View>
      </View>

      <Calendar
        markedDates={markedDates}
        markingType="custom"
        onDayPress={handleDayPress}
        theme={{
          calendarBackground: '#fff',
          todayTextColor: '#00adf5',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          arrowColor: '#2196F3',
        }}
        style={styles.calendar}
      />

      {/* Resumen de Asistencias */}
      <Text style={styles.summaryText}>{getSummary()}</Text>

      {/* Modal para detalles de la fecha */}
      <Modal
        visible={!!selectedDate}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asistencias del {selectedDate}</Text>
            {attendanceData
              .filter(record => record.date === selectedDate)
              .map((record, index) => (
                <Text key={index} style={styles.modalText}>
                  {getStudentName(record.studentEmail)}: {record.status}
                </Text>
              ))}
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        onPress={generateExcel} 
        style={styles.floatingButton}
        activeOpacity={0.9}
      >
        <MaterialIcons name="file-download" size={26} color="white" />
        <Text style={styles.floatingButtonText}>Exportar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  header: {
    marginBottom: 15
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 20,
    textAlign: 'center'
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 50,
    justifyContent: 'center',
  },
  iosPickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    height: 50,
  },
  picker: {
    width: '100%',
    color: '#333',
    backgroundColor: 'transparent',
    transform: Platform.select({
      ios: [{ scaleX: 1 }, { scaleY: 1 }],
    }),
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10
  },
  floatingButtonText: {
    color: 'white',
    marginLeft: 12,
    fontWeight: '600',
    fontSize: 16
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  colorBox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 5,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  summaryText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    color: '#333',
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
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginVertical: 5,
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default AttendanceHistoryScreen; 