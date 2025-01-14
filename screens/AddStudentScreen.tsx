import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { NavigationProp } from '@react-navigation/native';

const AddStudentScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const db = getFirestore();

  const handleAddStudent = async () => {
    try {
      await addDoc(collection(db, 'students'), { name, email });
      alert('Student added successfully!');
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('An unknown error occurred');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Student</Text>
      <TextInput
        style={styles.input}
        placeholder="Student Name"
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Student Email"
        onChangeText={setEmail}
      />
      <Button title="Add Student" onPress={handleAddStudent} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: { borderBottomWidth: 1, marginBottom: 15, padding: 10 },
});

export default AddStudentScreen;
