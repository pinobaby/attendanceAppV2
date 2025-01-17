// import React from 'react';
// import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
// import { NavigationContainer } from '@react-navigation/native';

// import LoginScreen from '../screens/LoginScreen';
// import RegisterScreen from '../screens/RegisterScreen';
// import HomeScreen from '../screens/HomeScreen';
// import AddStudentScreen from '../screens/AddStudentScreen';
// import StudentListScreen from '../screens/StudentListScreen';
// import AttendanceScreen from '../screens/AttendanceScreen';
// import QRCodeScreen from '../screens/QRCodeScreen';

// const Stack = createNativeStackNavigator();

// const AppNavigator = () => {
//   return (
    
//       <Stack.Navigator initialRouteName="Login">
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="Register" component={RegisterScreen} />
//         <Stack.Screen name="Home" component={HomeScreen} />
//         <Stack.Screen name="AddStudent" component={AddStudentScreen} />
//         <Stack.Screen name="StudentList" component={StudentListScreen} />
//         <Stack.Screen name="Attendance" component={AttendanceScreen} />
//         <Stack.Screen name="QRCode" component={QRCodeScreen} />
       
        

//       </Stack.Navigator>
  
//   );
// };

// export default AppNavigator;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import QRCodeScreen from '../screens/QRCodeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddStudentScreen from '../screens/AddStudentScreen';
import StudentListScreen from '../screens/StudentListScreen';
import AttendanceScreen from '../screens/AttendanceScreen';

import CreateCourseScreen from '@/screens/CreateCourseScreen';
import ManageCoursesScreen from '@/screens/ManageCoursesScreen';
import TakeAttendanceScreen from '@/screens/TakeAttendanceScreen';
import AttendanceHistoryScreen from '@/screens/AttendanceHistoryScreen';
import CourseDetailsScreen from '@/screens/CourseDetailsScreen';



type RootStackParamList = {
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
  AttendanceHistory: undefined;
  CourseDetails: undefined;
};


const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
  
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddStudent" component={AddStudentScreen} />
        {/* <Stack.Screen name="StudentList" component={StudentListScreen} /> */}
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        {/* <Stack.Screen name="QRCode" component={QRCodeScreen} /> */}
        <Stack.Screen name="StudentList" component={StudentListScreen} options={{ title: 'Estudiantes' }} />
        <Stack.Screen name="QRCode" component={QRCodeScreen} options={{ title: 'Código QR' }} />

        <Stack.Screen name="CreateCourse" component={CreateCourseScreen} />
        <Stack.Screen name="ManageCourses" component={ManageCoursesScreen} />
        <Stack.Screen name="TakeAttendance" component={TakeAttendanceScreen} />
        <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
        <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ title: 'Detalles del Curso' }} />
      </Stack.Navigator>

  );
};

export default AppNavigator;
