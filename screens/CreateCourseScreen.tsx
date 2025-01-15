// CreateCourseScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function CreateCourseScreen() {
  const [courseName, setCourseName] = useState('');
  const navigation = useNavigation();

  const handleCreateCourse = async () => {
    try {
      await addDoc(collection(db, 'courses'), {
        name: courseName,
        createdAt: serverTimestamp(),
        students: [],
        attendanceRecords: [],
      });
      alert('Curso creado con éxito');
      navigation.goBack();
    } catch (error) {
      console.error('Error al crear curso:', error);
      alert('Hubo un error al crear el curso');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nombre del curso"
        value={courseName}
        onChangeText={setCourseName}
      />
      <Button title="Crear Curso" onPress={handleCreateCourse} />
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
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    width: '80%',
    paddingHorizontal: 10,
  },
});
