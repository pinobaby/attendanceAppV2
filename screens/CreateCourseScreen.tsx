import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';


export default function CreateCourseScreen() {
  const [courseName, setCourseName] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleCreateCourse = async () => {
    if (!courseName.trim()) {
      setError('Por favor ingresa un nombre para el curso');
      return;
    }

    try {
      await addDoc(collection(db, 'courses'), {
        name: courseName,
        createdAt: serverTimestamp(),
        students: [],
        attendanceRecords: [],
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error al crear curso:', error);
      setError('Error al crear el curso. Intenta nuevamente.');
    }
  };

  return (
    <ImageBackground 
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(245,245,245,0.95)']}
        style={styles.overlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.flex}>
            <View style={styles.container}>
              <View style={styles.card}>
                <Text style={styles.title}>Nuevo Curso</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nombre del Curso</Text>
                  <View style={styles.inputWrapper}>
                    <Icon name="class" size={20} color="#2A5298" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: Matemáticas 101"
                      placeholderTextColor="#888"
                      value={courseName}
                      onChangeText={(text) => {
                        setCourseName(text);
                        setError('');
                      }}
                      autoFocus
                    />
                  </View>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                <TouchableOpacity 
                  style={[styles.button, !courseName && styles.disabledButton]}
                  onPress={handleCreateCourse}
                  disabled={!courseName}
                >
                  <Icon name="add-circle" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Crear Curso</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    padding: 20,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#2A5298',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontFamily: 'Roboto-Medium',
    color: '#444',
    marginBottom: 8,
    fontSize: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A5298',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#2A5298',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
  },
  errorText: {
    color: '#dc3545',
    fontFamily: 'Roboto-Italic',
    fontSize: 14,
    marginTop: 8,
  },
});
