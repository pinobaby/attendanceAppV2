// AttendanceHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default function AttendanceHistoryScreen() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error('Error al obtener cursos:', error);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseSelection = (courseId) => {
    setSelectedCourse(courseId);
    // Obtener registros de asistencia para el curso seleccionado
  };

  const renderAttendanceRecord = ({ item }) => (
    <View style={styles.recordContainer}>
      <Text>Fecha: {item.date}</Text>
      <Text>Asistentes: {item.studentsPresent.join(', ')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Asistencia</Text>
      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.courseContainer}>
            <Button
              title={item.name}
              onPress={() => handleCourseSelection(item.id)}
            />
          </View>
        )}
      />
      {selectedCourse && (
        <FlatList
          data={attendanceRecords}
          keyExtractor={item => item.id}
          renderItem={renderAttendanceRecord}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  recordContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  courseContainer: {
    marginBottom: 10,
  },
});
