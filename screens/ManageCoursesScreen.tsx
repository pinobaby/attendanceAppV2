// ManageCoursesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function ManageCoursesScreen() {
  const [courses, setCourses] = useState([]);
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

  const handleSelectCourse = (courseId) => {
    navigation.navigate('CourseDetails', { courseId });
  };

  const renderCourse = ({ item }) => (
    <View style={styles.courseContainer}>
      <Button title={item.name} onPress={() => handleSelectCourse(item.id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Cursos</Text>
      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        renderItem={renderCourse}
      />
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
  courseContainer: {
    marginBottom: 10,
  },
});
