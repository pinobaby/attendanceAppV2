import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

const HomeScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance App</Text>
      {/* <Button
        title="Add Student"
        onPress={() => navigation.navigate('AddStudent')}
      />
      <Button
        title="View Students"
        onPress={() => navigation.navigate('StudentList')}
      />
      <Button
        title="Take Attendance"
        onPress={() => navigation.navigate('Attendance')}
      /> */}
      <Button title="Crear Curso" onPress={() => navigation.navigate('CreateCourse')} />
      <Button title="Mis Cursos" onPress={() => navigation.navigate('ManageCourses')} />
      <Button title="Tomar Asistencia" onPress={() => navigation.navigate('TakeAttendance')} />
      <Button title="Historial de Asistencia" onPress={() => navigation.navigate('AttendanceHistory')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 30, textAlign: 'center' },
});

export default HomeScreen;
