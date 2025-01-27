import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  RefreshControl,
  Animated
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import { db, auth } from '../firebase/config';
import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import * as XLSX from 'xlsx';

interface AttendanceRecord {
  date: string;
  status: 'presente' | 'ausente';
  studentEmail: string;
}

interface Student {
  email: string;
  nombre: string;
}

const months = [
  { name: 'Enero', value: 1 },
  { name: 'Febrero', value: 2 },
  { name: 'Marzo', value: 3 },
  { name: 'Abril', value: 4 },
  { name: 'Mayo', value: 5 },
  { name: 'Junio', value: 6 },
  { name: 'Julio', value: 7 },
  { name: 'Agosto', value: 8 },
  { name: 'Septiembre', value: 9 },
  { name: 'Octubre', value: 10 },
  { name: 'Noviembre', value: 11 },
  { name: 'Diciembre', value: 12 },
];

const AttendanceHistoryScreen = ({ route }) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [students, setStudents] = useState<Student[]>([]);
  const { courseId } = route.params;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const studentsRef = collection(db, 'users', user.uid, 'cursos', courseId, 'alumnos');
        const studentsSnapshot = await getDocs(studentsRef);
        const studentData = studentsSnapshot.docs.map(doc => ({
          email: doc.data().email,
          nombre: doc.data().nombre || doc.data().name || doc.data().email
        }));
        setStudents(studentData);
      } catch (error) {
        Alert.alert('Error', 'Error cargando estudiantes');
      }
    };
    
    fetchStudents();
  }, [courseId]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        const start = new Date();
        start.setMonth(selectedMonth - 1, 1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(selectedMonth, 0);
        end.setHours(23, 59, 59, 999);

        const startTimestamp = Timestamp.fromDate(start);
        const endTimestamp = Timestamp.fromDate(end);

        const attendanceRef = collection(db, 'users', user.uid, 'cursos', courseId, 'asistencias');
        const q = query(
          attendanceRef,
          where('date', '>=', startTimestamp),
          where('date', '<=', endTimestamp)
        );

        const querySnapshot = await getDocs(q);
        const data: AttendanceRecord[] = [];
        
        querySnapshot.forEach(doc => {
          const attendance = doc.data();
          const timestamp = attendance.date as Timestamp;
          const date = timestamp.toDate();
          
          data.push({
            date: date.toISOString().split('T')[0],
            status: attendance.status,
            studentEmail: attendance.studentEmail
          });
        });

        setAttendanceData(data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
      } catch (error) {
        Alert.alert('Error', 'Error cargando asistencias');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchAttendanceData();
  }, [courseId, selectedStudent, selectedMonth]);

  const getStudentName = (email: string) => {
    const student = students.find(s => s.email === email);
    return student ? student.nombre : email;
  };

  const filteredData = useMemo(() => 
    attendanceData.filter(record => 
      !selectedStudent || record.studentEmail === selectedStudent
    ),
    [attendanceData, selectedStudent]
  );

  const updateMarkedDates = () => {
    const marks = {};
    filteredData.forEach(record => {
      marks[record.date] = {
        customStyles: {
          container: {
            backgroundColor: record.status === 'presente' ? '#4CAF50' : '#F44336',
            borderRadius: 5
          },
          text: { color: 'white' }
        }
      };
    });
    setMarkedDates(marks);
  };

  useEffect(() => {
    updateMarkedDates();
  }, [filteredData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttendanceData();
  };

  const generateExcel = async () => {
    try {
      if (filteredData.length === 0) {
        Alert.alert('Info', 'No hay datos para exportar');
        return;
      }

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
      Alert.alert('Error', 'Error generando el archivo');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#2196F3']}
          tintColor="#2196F3"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Asistencias</Text>
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedMonth}
            onValueChange={value => setSelectedMonth(value)}
            dropdownIconColor="#666"
            style={styles.picker}
          >
            {months.map(month => (
              <Picker.Item 
                key={month.value} 
                label={month.name} 
                value={month.value} 
              />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedStudent}
            onValueChange={setSelectedStudent}
            dropdownIconColor="#666"
            style={styles.picker}
          >
            <Picker.Item label="Todos los estudiantes" value="" />
            {students.map((student, index) => (
              <Picker.Item 
                key={index} 
                label={student.nombre} 
                value={student.email} 
              />
            ))}
          </Picker>
        </View>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Calendar
          markedDates={markedDates}
          markingType="custom"
          theme={calendarTheme}
          style={styles.calendar}
        />
      </Animated.View>

      <TouchableOpacity 
        onPress={generateExcel} 
        style={styles.floatingButton}
        activeOpacity={0.9}
      >
        <MaterialIcons name="file-download" size={26} color="white" />
        <Text style={styles.floatingButtonText}>Exportar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

     
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
  'stylesheet.calendar.header': {
    week: {
      marginTop: 7,
      flexDirection: 'row',
      justifyContent: 'space-between'
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 15,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 25,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#333',
    height: 50,
  },
  calendar: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 20,
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
    shadowRadius: 6,
  },
  floatingButtonText: {
    color: 'white',
    marginLeft: 12,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default AttendanceHistoryScreen;