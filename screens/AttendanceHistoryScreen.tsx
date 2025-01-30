// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   ActivityIndicator, 
//   Alert, 
//   Platform,
//   LayoutAnimation,
//   UIManager,
//   Modal,
//   ScrollView
// } from 'react-native';
// import { Calendar, DateData } from 'react-native-calendars';
// import { db, auth } from '../firebase/config';
// import { collection, query, getDocs, where } from 'firebase/firestore';
// import { MaterialIcons } from '@expo/vector-icons';
// import * as FileSystem from 'expo-file-system';
// import { shareAsync } from 'expo-sharing';
// import * as XLSX from 'xlsx';
// import { Picker } from '@react-native-picker/picker';
// import { format, parseISO, differenceInCalendarDays } from 'date-fns';
// import { es } from 'date-fns/locale';

// interface AttendanceRecord {
//   date: string;
//   status: 'presente' | 'ausente' | 'no_registrado';
//   studentEmail: string;
// }

// interface Student {
//   email: string;
//   name: string;
// }

// interface CourseRouteParams {
//   courseId: string;
// }

// interface AttendanceModalProps {
//   visible: boolean;
//   date: string | null;
//   data: AttendanceRecord[];
//   getStudentName: (email: string) => string;
//   onClose: () => void;
// }

// const AttendanceHistoryScreen = ({ route }: { route: { params: CourseRouteParams } }) => {
//   const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
//   const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
//   const [loading, setLoading] = useState(true);
//   const [selectedStudent, setSelectedStudent] = useState('');
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selectedDate, setSelectedDate] = useState<string | null>(null);
//   const { courseId } = route.params;

//   useEffect(() => {
//     if (Platform.OS === 'android') {
//       UIManager.setLayoutAnimationEnabledExperimental?.(true);
//     }
//   }, []);

//   const studentEmails = useMemo(() => students.map(s => s.email), [students]);


//   const fetchData = useCallback(async () => {
//     try {
//       const user = auth.currentUser;
//       if (!user) {
//         Alert.alert('Error', 'Usuario no autenticado');
//         return;
//       }
  
//       const studentsRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
//       const studentsSnapshot = await getDocs(studentsRef);
//       const studentList = studentsSnapshot.docs.map(doc => ({
//         email: doc.data().email,
//         name: doc.data().nombre || doc.data().name || 'Sin nombre'
//       }));
//       setStudents(studentList);
  
//       const attendanceRef = collection(db, 'users', user.uid, 'cursos', courseId, 'asistencias');
//       const q = query(attendanceRef);
//       const querySnapshot = await getDocs(q);
  
//       const data = querySnapshot.docs.map(doc => {
//         const attendance = doc.data();
//         const date = attendance.date?.toDate?.() || new Date(); 
//         return {
//           date: format(date, 'yyyy-MM-dd'),
//           status: attendance.status || 'no_registrado',
//           studentEmail: attendance.studentEmail
//         };
//       });
  
//       setAttendanceData(data);
//     } catch (error) {
//       Alert.alert('Error', 'Error al cargar los datos');
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   }, [courseId]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const updateMarkedDates = useCallback(() => {
//     const marks: { [key: string]: any } = {};
//     const today = format(new Date(), 'yyyy-MM-dd');
//     const allDates = Array.from(new Set(attendanceData.map(record => record.date)));
//     const allStudents = students.map(s => s.email);

//     const statusColors = {
//       presente: '#4CAF50',
//       ausente: '#F44336',
//       no_registrado: '#FF9800'
//     };

//     attendanceData.forEach(record => {
//       if (selectedStudent && record.studentEmail !== selectedStudent) return;

//       marks[record.date] = {
//         customStyles: {
//           container: {
//             backgroundColor: statusColors[record.status],
//             borderRadius: 5,
//             borderWidth: record.date === today ? 2 : 0,
//             borderColor: '#ffffff'
//           },
//           text: {
//             color: 'white',
//             fontWeight: record.date === today ? 'bold' : 'normal'
//           }
//         }
//       };
//     });

//     const firstDate = attendanceData.length > 0 
//       ? parseISO(attendanceData[0].date)
//       : new Date();
      
//     const totalDays = differenceInCalendarDays(new Date(), firstDate);
//     for (let i = 0; i <= totalDays; i++) {
//       const date = format(new Date(firstDate.getTime() + i * 86400000), 'yyyy-MM-dd');
//       if (!marks[date]) {
//         marks[date] = {
//           customStyles: {
//             container: {
//               backgroundColor: '#BDBDBD',
//               borderRadius: 5
//             },
//             text: {
//               color: 'white'
//             }
//           }
//         };
//       }
//     }

//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setMarkedDates(marks);
//   }, [attendanceData, selectedStudent, students]);

//   useEffect(() => {
//     updateMarkedDates();
//   }, [updateMarkedDates]);

//   const filteredData = useMemo(() => 
//     selectedStudent 
//       ? attendanceData.filter(record => record.studentEmail === selectedStudent)
//       : attendanceData
//   , [attendanceData, selectedStudent]);

//   const getStudentName = (email: string): string => 
//     students.find(s => s.email === email)?.name || email;

//   const handleDayPress = (day: DateData) => 
//     setSelectedDate(day.dateString);

//   const generateExcel = async () => {
//     try {
//       const wsData = [
//         ['Estudiante', 'Fecha', 'Estado'],
//         ...filteredData.map(record => [
//           getStudentName(record.studentEmail),
//           format(parseISO(record.date), 'PPPP', { locale: es }),
//           record.status === 'presente' 
//             ? 'Presente' 
//             : record.status === 'ausente'
//             ? 'Ausente'
//             : 'No registrado'
//         ])
//       ];

//       const ws = XLSX.utils.aoa_to_sheet(wsData);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

//       const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
//       const uri = FileSystem.cacheDirectory + `asistencias_${courseId}.xlsx`;
      
//       await FileSystem.writeAsStringAsync(uri, wbout, {
//         encoding: FileSystem.EncodingType.Base64
//       });

//       await shareAsync(uri, {
//         mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         dialogTitle: 'Exportar Asistencias',
//         UTI: 'com.microsoft.excel.xlsx'
//       });
//     } catch (error) {
//       Alert.alert('Error', 'Error al generar el reporte');
//       console.error(error);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#2196F3" />
//         <Text style={styles.loadingText}>Cargando datos...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <Text style={styles.title}>Historial de Asistencias</Text>
        
//         <View style={[
//           styles.pickerContainer,
//           Platform.OS === 'ios' && styles.iosPickerContainer
//         ]}>
//           <Picker
//             selectedValue={selectedStudent}
//             onValueChange={setSelectedStudent}
//             dropdownIconColor="#666"
//             mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
//             style={styles.picker}
//             itemStyle={styles.pickerItem}
//           >
//             <Picker.Item label="Todos los estudiantes" value="" />
//             {students.map(student => (
//               <Picker.Item 
//                 key={student.email}
//                 label={student.name} 
//                 value={student.email} 
//               />
//             ))}
//           </Picker>
//         </View>

//         <Legend />

//         <Calendar
//           markedDates={markedDates}
//           markingType="custom"
//           onDayPress={handleDayPress}
//           theme={calendarTheme}
//           style={styles.calendar}
//           locale="es"
//           firstDay={1}
//         />

//         <Summary 
//           data={filteredData} 
//           students={students} 
//           selectedStudent={selectedStudent} 
//           attendanceData={attendanceData} 
//         />
//       </ScrollView>

//       <AttendanceModal 
//         visible={!!selectedDate}
//         date={selectedDate}
//         data={attendanceData}
//         getStudentName={getStudentName}
//         onClose={() => setSelectedDate(null)}
//       />

//       <FloatingExportButton onPress={generateExcel} />
//     </View>
//   );
// };

// const Legend = () => (
//   <View style={styles.legendContainer}>
//     <LegendItem color="#4CAF50" text="Presente" />
//     <LegendItem color="#F44336" text="Ausente" />
//     <LegendItem color="#FF9800" text="No registrado" />
//     <LegendItem color="#BDBDBD" text="Sin registro" />
//   </View>
// );

// const LegendItem = ({ color, text }: { color: string; text: string }) => (
//   <View style={styles.legendItem}>
//     <View style={[styles.colorBox, { backgroundColor: color }]} />
//     <Text style={styles.legendText}>{text}</Text>
//   </View>
// );

// const Summary = ({ 
//   data, 
//   students, 
//   selectedStudent, 
//   attendanceData 
// }: { 
//   data: AttendanceRecord[]; 
//   students: Student[]; 
//   selectedStudent: string;
//   attendanceData: AttendanceRecord[];
// }) => {
//   const summary = useMemo(() => {
//     const presentes = data.filter(r => r.status === 'presente').length;
//     const ausentes = data.filter(r => r.status === 'ausente').length;
//     let noRegistrados = 0;

//     const allAttendanceDates = Array.from(new Set(attendanceData.map(record => record.date)));
//     const allStudents = students.map(s => s.email);

//     if (selectedStudent) {
//       const studentRecords = attendanceData.filter(record => 
//         record.studentEmail === selectedStudent
//       );
//       noRegistrados = allAttendanceDates.length - new Set(studentRecords.map(r => r.date)).size;
//     } else {
//       noRegistrados = allStudents.length * allAttendanceDates.length - attendanceData.length;
//     }

//     return { presentes, ausentes, noRegistrados };
//   }, [data, students, selectedStudent, attendanceData]);

//   return (
//     <View style={styles.summaryContainer}>
//       <Text style={styles.summaryText}>
//         📊 Resumen: 
//         <Text style={styles.presentText}> {summary.presentes} Presentes</Text>
//         <Text style={styles.absentText}> • {summary.ausentes} Ausentes</Text>
//         <Text style={styles.unregisteredText}> • {summary.noRegistrados} No registrados</Text>
//       </Text>
//     </View>
//   );
// };

// const AttendanceModal = ({ visible, date, data, getStudentName, onClose }: AttendanceModalProps) => {
//   const formattedDate = useMemo(() => 
//     date ? format(parseISO(date), 'PPPP', { locale: es }) : ''
//   , [date]);

//   const dayRecords = useMemo(() => 
//     data.filter((record) => record.date === date)
//   , [data, date]);

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="slide"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <Text style={styles.modalTitle}>Asistencias del {formattedDate}</Text>
          
//           {dayRecords.length === 0 ? (
//             <Text style={styles.noDataText}>No hay registros para este día</Text>
//           ) : (
//             <ScrollView>
//               {dayRecords.map((record, index) => (
//                 <Text key={index} style={styles.modalText}>
//                   {getStudentName(record.studentEmail)}: 
//                   <Text style={record.status === 'presente' ? styles.presentText : styles.absentText}>
//                     {' '}{record.status.charAt(0).toUpperCase() + record.status.slice(1)}
//                   </Text>
//                 </Text>
//               ))}
//             </ScrollView>
//           )}

//           <TouchableOpacity 
//             onPress={onClose} 
//             style={styles.modalCloseButton}
//           >
//             <Text style={styles.modalCloseButtonText}>Cerrar</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const FloatingExportButton = ({ onPress }: { onPress: () => void }) => (
//   <TouchableOpacity 
//     onPress={onPress} 
//     style={styles.floatingButton}
//     accessibilityLabel="Exportar a Excel"
//   >
//     <MaterialIcons name="file-download" size={26} color="white" />
//     <Text style={styles.floatingButtonText}>Exportar</Text>
//   </TouchableOpacity>
// );

// const calendarTheme = {
//   calendarBackground: '#fff',
//   todayTextColor: '#00adf5',
//   dayTextColor: '#2d4150',
//   textDisabledColor: '#d9e1e8',
//   arrowColor: '#2196F3',
//   monthTextColor: '#1a237e',
//   textMonthFontWeight: '600',
//   textDayFontSize: 16,
//   textMonthFontSize: 18,
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   scrollContent: {
//     padding: 16,
//     paddingBottom: 80,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 20,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#666',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1a237e',
//     textAlign: 'center',
//     marginVertical: 16,
//   },
//   pickerContainer: {
//     backgroundColor: 'white',
//     borderRadius: 10,
//     marginVertical: 10,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     overflow: 'hidden',
//   },
//   iosPickerContainer: {
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     height: 50,
//     justifyContent: 'center',
//   },
//   picker: {
//     width: '100%',
//     color: '#333',
//   },
//   pickerItem: {
//     fontSize: Platform.select({
//       ios: 16,
//       android: 14
//     }),
//     color: '#333',
//     backgroundColor: 'transparent',
//   },
//   legendContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginVertical: 12,
//     gap: 16,
//   },
//   legendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   colorBox: {
//     width: 16,
//     height: 16,
//     borderRadius: 4,
//   },
//   legendText: {
//     fontSize: 14,
//     color: '#333',
//   },
//   calendar: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginVertical: 10,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   summaryContainer: {
//     marginVertical: 16,
//     padding: 12,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     elevation: 2,
//   },
//   summaryText: {
//     fontSize: 16,
//     color: '#333',
//     textAlign: 'center',
//   },
//   presentText: {
//     color: '#4CAF50',
//     fontWeight: '600',
//   },
//   absentText: {
//     color: '#F44336',
//     fontWeight: '600',
//   },
//   unregisteredText: {
//     color: '#FF9800',
//     fontWeight: '600',
//   },
//   floatingButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     flexDirection: 'row',
//     backgroundColor: '#2196F3',
//     paddingVertical: 14,
//     paddingHorizontal: 24,
//     borderRadius: 30,
//     alignItems: 'center',
//     gap: 10,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//   },
//   floatingButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     padding: 20,
//     borderRadius: 12,
//     width: '90%',
//     maxHeight: '60%',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     marginBottom: 12,
//     textAlign: 'center',
//     color: '#1a237e',
//   },
//   modalText: {
//     fontSize: 16,
//     marginVertical: 6,
//     color: '#333',
//   },
//   noDataText: {
//     textAlign: 'center',
//     color: '#666',
//     fontStyle: 'italic',
//     marginVertical: 10,
//   },
//   modalCloseButton: {
//     marginTop: 15,
//     padding: 12,
//     backgroundColor: '#2196F3',
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   modalCloseButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 16,
//   },
// });

// export default AttendanceHistoryScreen;


import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
  ScrollView,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { db, auth } from '../firebase/config';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Picker } from '@react-native-picker/picker';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendanceRecord {
  date: string;
  status: 'presente' | 'ausente' | 'no_registrado';
  studentEmail: string;
}

interface Student {
  email: string;
  name: string;
}

interface CourseRouteParams {
  courseId: string;
}

interface AttendanceModalProps {
  visible: boolean;
  date: string | null;
  data: AttendanceRecord[];
  getStudentName: (email: string) => string;
  onClose: () => void;
}

const AttendanceHistoryScreen = ({ route }: { route: { params: CourseRouteParams } }) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { courseId } = route.params;

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      // Obtener estudiantes
      const studentsRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
      const studentsQuery = query(studentsRef, orderBy('createdAt', 'asc'));
      const studentsSnapshot = await getDocs(studentsQuery);

      const studentList = studentsSnapshot.docs.map(doc => ({
        email: doc.data().email,
        name: doc.data().nombre || doc.data().name || 'Sin nombre',
      }));

      setStudents(studentList);
      console.log('Estudiantes cargados:', studentList);

      // Obtener asistencias
      const attendanceRef = collection(db, 'users', user.uid, 'cursos', courseId, 'asistencias');
      const attendanceQuery = query(attendanceRef, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(attendanceQuery);

      const data = querySnapshot.docs.map(doc => {
        const attendance = doc.data();
        const date = attendance.date?.toDate?.();
        return {
          date: format(date, 'yyyy-MM-dd'),
          status: attendance.status || 'no_registrado',
          studentEmail: attendance.studentEmail,
        };
      });

      setAttendanceData(data);
      console.log('Asistencias cargadas:', data);

    } catch (error) {
      Alert.alert('Error', 'Error al cargar los datos');
      console.error('Error detallado:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateMarkedDates = useCallback(() => {
    const marks: { [key: string]: any } = {};
    const today = format(new Date(), 'yyyy-MM-dd');

    attendanceData.forEach(record => {
      if (selectedStudent && record.studentEmail !== selectedStudent) return;

      const statusColors = {
        presente: '#4CAF50',
        ausente: '#F44336',
        no_registrado: '#FF9800',
      };

      marks[record.date] = {
        customStyles: {
          container: {
            backgroundColor: statusColors[record.status],
            borderRadius: 5,
            borderWidth: record.date === today ? 2 : 0,
            borderColor: '#ffffff',
          },
          text: {
            color: 'white',
            fontWeight: record.date === today ? 'bold' : 'normal',
          },
        },
      };
    });

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMarkedDates(marks);
  }, [attendanceData, selectedStudent]);

  useEffect(() => {
    updateMarkedDates();
  }, [updateMarkedDates]);

  const getStudentName = (email: string): string =>
    students.find(s => s.email === email)?.name || email;

  const handleDayPress = (day: DateData) => setSelectedDate(day.dateString);

  const generateExcel = async () => {
    const filteredData = selectedStudent 
      ? attendanceData.filter(record => record.studentEmail === selectedStudent)
      : attendanceData;
        try {
          const wsData = [
            ['Estudiante', 'Fecha', 'Estado'],
            ...filteredData.map(record => [
              getStudentName(record.studentEmail),
              format(parseISO(record.date), 'PPPP', { locale: es }),
              record.status === 'presente' 
                ? 'Presente' 
                : record.status === 'ausente'
                ? 'Ausente'
                : 'No registrado'
            ])
          ];
    
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');
    
          const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
          const uri = FileSystem.cacheDirectory + `asistencias_${courseId}.xlsx`;
          
          await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: FileSystem.EncodingType.Base64
          });
    
          await shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Exportar Asistencias',
            UTI: 'com.microsoft.excel.xlsx'
          });
        } catch (error) {
          Alert.alert('Error', 'Error al generar el reporte');
          console.error(error);
        }
      };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Historial de Asistencias</Text>

        <View style={styles.pickerContainer}>
        <Picker
            selectedValue={selectedStudent}
            onValueChange={setSelectedStudent}
            dropdownIconColor="#666"
            mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Todos los estudiantes" value="" />
            {students.map(student => (
              <Picker.Item 
                key={student.email}
                label={student.name} 
                value={student.email} 
              />
            ))}
          </Picker>
        </View>

        <Legend />

        <Calendar
          markedDates={markedDates}
          markingType="custom"
          onDayPress={handleDayPress}
          theme={calendarTheme}
          style={styles.calendar}
          locale="es"
        />

        <Summary data={attendanceData} students={students} selectedStudent={selectedStudent} />
      </ScrollView>

      <AttendanceModal
        visible={!!selectedDate}
        date={selectedDate}
        data={attendanceData}
        getStudentName={getStudentName}
        onClose={() => setSelectedDate(null)}
      />

      <FloatingExportButton onPress={generateExcel} />
    </View>
  );
};

const Legend = () => (
  <View style={styles.legendContainer}>
    <LegendItem color="#4CAF50" text="Presente" />
    <LegendItem color="#F44336" text="Ausente" />
    <LegendItem color="#FF9800" text="No registrado" />
    <LegendItem color="#BDBDBD" text="Sin registro" />
  </View>
);

const LegendItem = ({ color, text }: { color: string; text: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.colorBox, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{text}</Text>
  </View>
);

const Summary = ({
  data,
  students,
  selectedStudent,
}: {
  data: AttendanceRecord[];
  students: Student[];
  selectedStudent: string;
}) => {
  const summary = useMemo(() => {
    const presentes = data.filter(r => r.status === 'presente').length;
    const ausentes = data.filter(r => r.status === 'ausente').length;
    const noRegistrados = students.length - (presentes + ausentes);

    return { presentes, ausentes, noRegistrados };
  }, [data, students]);

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryText}>
        📊 Resumen:
        <Text style={styles.presentText}> {summary.presentes} Presentes</Text>
        <Text style={styles.absentText}> • {summary.ausentes} Ausentes</Text>
        <Text style={styles.unregisteredText}> • {summary.noRegistrados} No registrados</Text>
      </Text>
    </View>
  );
};

const AttendanceModal = ({ visible, date, data, getStudentName, onClose }: AttendanceModalProps) => {
  const formattedDate = useMemo(() =>
    date ? format(parseISO(date), 'PPPP', { locale: es }) : '',
    [date],
  );

  const dayRecords = useMemo(() =>
    data.filter((record) => record.date === date),
    [data, date],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Asistencias del {formattedDate}</Text>

          {dayRecords.length === 0 ? (
            <Text style={styles.noDataText}>No hay registros para este día</Text>
          ) : (
            <ScrollView>
              {dayRecords.map((record, index) => (
                <View key={index} style={styles.modalRecordContainer}>
                  <Text style={styles.modalStudentName}>{getStudentName(record.studentEmail)}</Text>
                  <Text
                    style={[
                      styles.statusText,
                      record.status === 'presente' && styles.presentText,
                      record.status === 'ausente' && styles.absentText,
                      record.status === 'no_registrado' && styles.unregisteredText,
                    ]}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const FloatingExportButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.floatingButton}>
    <MaterialIcons name="file-download" size={26} color="white" />
    <Text style={styles.floatingButtonText}>Exportar</Text>
  </TouchableOpacity>
);

const calendarTheme = {
  calendarBackground: '#fff',
  todayTextColor: '#00adf5',
  dayTextColor: '#2d4150',
  textDisabledColor: '#d9e1e8',
  arrowColor: '#2196F3',
  monthTextColor: '#1a237e',
  textMonthFontWeight: '600',
  textDayFontSize: 16,
  textMonthFontSize: 18,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'center',
    marginVertical: 16,
  },
  pickerContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginVertical: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
      },
      iosPickerContainer: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        height: 50,
        justifyContent: 'center',
      },
      picker: {
        width: '100%',
        color: '#333',
      },
      pickerItem: {
        fontSize: Platform.select({
          ios: 16,
          android: 14
        }),
        color: '#333',
        backgroundColor: 'transparent',
      },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  presentText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  absentText: {
    color: '#F44336',
    fontWeight: '600',
  },
  unregisteredText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    gap: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
    width: '90%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1a237e',
  },
  modalRecordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalStudentName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AttendanceHistoryScreen;