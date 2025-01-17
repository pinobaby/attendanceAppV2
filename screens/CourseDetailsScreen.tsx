import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { db } from '../firebase/config';
import { collection, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

type RootStackParamList = {
  CourseDetails: { courseId: string };
};

type CourseDetailsScreenRouteProp = RouteProp<RootStackParamList, 'CourseDetails'>;

interface Props {
  route: CourseDetailsScreenRouteProp;
}

export default function CourseDetailsScreen({ route }: Props) {
  const { courseId } = route.params;
  const [courseName, setCourseName] = useState('');
  const [students, setStudents] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          const data = courseDoc.data();
          setCourseName(data.name);
          setStudents(data.students || []);
        } else {
          Alert.alert('Error', 'El curso no existe.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error al obtener detalles del curso:', error);
        Alert.alert('Error', 'Hubo un problema al cargar los detalles del curso.');
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleAddStudent = async () => {
    if (!newStudent.trim()) {
      Alert.alert('Error', 'El nombre del alumno no puede estar vacío.');
      return;
    }

    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        students: arrayUnion(newStudent),
      });

      setStudents((prevStudents) => [...prevStudents, newStudent]);
      setNewStudent('');
      Alert.alert('Éxito', 'Alumno agregado correctamente.');
    } catch (error) {
      console.error('Error al agregar alumno:', error);
      Alert.alert('Error', 'Hubo un problema al agregar el alumno.');
    }
  };

  const handleRemoveStudent = async (student: string) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        students: arrayRemove(student),
      });

      setStudents((prevStudents) => prevStudents.filter((s) => s !== student));
      Alert.alert('Éxito', 'Alumno eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar alumno:', error);
      Alert.alert('Error', 'Hubo un problema al eliminar el alumno.');
    }
  };

  const renderStudent = ({ item }: { item: string }) => (
    <View style={styles.studentContainer}>
      <Text style={styles.studentName}>{item}</Text>
      <Button title="Eliminar" onPress={() => handleRemoveStudent(item)} color="red" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`Curso: ${courseName}`}</Text>
      <Text style={styles.subtitle}>Lista de Alumnos:</Text>
      <FlatList
        data={students}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderStudent}
        ListEmptyComponent={<Text style={styles.emptyList}>No hay alumnos registrados.</Text>}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre del alumno"
        value={newStudent}
        onChangeText={setNewStudent}
      />
      <Button title="Agregar Alumno" onPress={handleAddStudent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  studentContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  studentName: { fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  emptyList: { textAlign: 'center', color: '#999', marginVertical: 20 },
});
