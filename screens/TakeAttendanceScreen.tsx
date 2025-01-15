// TakeAttendanceScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
// import QRCodeScanner from 'react-native-qrcode-scanner';

export default function TakeAttendanceScreen() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigation = useNavigation();

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
  };

  const handleQRRead = (e) => {
    const qrValue = e.data;
    console.log('QR leído:', qrValue);
    // Aquí iría la lógica para marcar la asistencia en Firestore.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tomar Asistencia</Text>
      <View style={styles.buttonsContainer}>
        {courses.map(course => (
          <Button
            key={course.id}
            title={course.name}
            onPress={() => handleCourseSelection(course.id)}
          />
        ))}
      </View>
      {selectedCourse && (
        <QRCodeScanner onRead={handleQRRead} />
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
  buttonsContainer: {
    marginBottom: 20,
  },
});
