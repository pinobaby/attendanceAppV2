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