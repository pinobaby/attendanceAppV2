
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export default function AddStudentScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [course, setCourse] = useState(''); 

  const handleAddStudent = async () => {
    if (!name || !email || !qrCode || !course) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      await addDoc(collection(db, 'students'), {
        name,
        email,
        qrCode,
        course, 
      });
      Alert.alert('Éxito', 'Estudiante agregado correctamente');
      setName('');
      setEmail('');
      setQrCode('');
      setCourse('');
    } catch (error) {
      console.error('Error al agregar estudiante:', error);
      Alert.alert('Error', 'No se pudo agregar el estudiante');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar Estudiante</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="ID (Código QR)"
        value={qrCode}
        onChangeText={setQrCode}
      />
      <TextInput
        style={styles.input}
        placeholder="Curso"
        value={course}
        onChangeText={setCourse}
      />
      <Button title="Agregar Estudiante" onPress={handleAddStudent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
});

