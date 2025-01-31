import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateCourseScreen from '@/screens/CreateCourseScreen';
import ManageCoursesScreen from '@/screens/ManageCoursesScreen';
import TakeAttendanceScreen from '@/screens/TakeAttendanceScreen';
import AttendanceHistoryScreen from '@/screens/AttendanceHistoryScreen';
import CourseDetailsScreen from '@/screens/CourseDetailsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { ThemeProvider } from '@/screens/ThemeContext';


 export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  AddStudent: undefined;
  StudentList: undefined;
  Attendance: undefined;
  QRCode: { qrValue: string; studentName: string };
  CreateCourse: undefined;
  ManageCourses: undefined;
  TakeAttendance: undefined;
  AttendanceHistory: { courseId: string };
  CourseDetails: { courseId: string };
  Settings: undefined;
};


const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <ThemeProvider>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateCourse" component={CreateCourseScreen} />
        <Stack.Screen name="ManageCourses" component={ManageCoursesScreen} />
        <Stack.Screen name="TakeAttendance" component={TakeAttendanceScreen} />
        <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
        <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Detalles del Curso' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuración' }} />
      </Stack.Navigator>
  </ThemeProvider>
  );
};

export default AppNavigator;
