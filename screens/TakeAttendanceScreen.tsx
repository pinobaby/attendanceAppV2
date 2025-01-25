import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Platform, Linking } from 'react-native';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TakeAttendanceScreen() {
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedData = useRef<{ data: string; timestamp: number } | null>(null);
  const scanCooldown = 4000; // 5 segundos de bloqueo
  
  const navigation = useNavigation();

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setCourses(coursesData);
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar la lista de cursos.');
      } finally {
        setLoading(false);
      }
    };

    requestCameraPermission();
    fetchCourses();
  }, []);

  const handleCourseSelection = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  const handleQRRead = async ({ data }: { data: string }) => {
    if (scanned || !selectedCourse) return;
    setScanned(true);

    try {
      const courseRef = doc(db, 'courses', selectedCourse);
      const courseDoc = await getDoc(courseRef);
      const students = courseDoc.data()?.students || [];

      if (!students.some((student: { email: string }) => student.email === data)) {
        throw new Error('Estudiante no registrado en este curso');
      }

      await updateDoc(courseRef, {
        attendanceHistory: arrayUnion({
          date: new Date().toISOString(),
          studentsPresent: [data]
        })
      });

      Alert.alert('Éxito', `Asistencia registrada para: ${data}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrar asistencia');
    } finally {
      setTimeout(() => setScanned(false), 2000);
    }
  };

  // const handleQRRead = async ({ data }: { data: string }) => {
  //   const now = Date.now();
    
  //   // Bloquear si está procesando o es el mismo código en el periodo de cooldown
  //   if (isProcessing || 
  //       !selectedCourse || 
  //       (lastScannedData.current && 
  //        lastScannedData.current.data === data && 
  //        now - lastScannedData.current.timestamp < scanCooldown)) {
  //     return;
  //   }

  //   setIsProcessing(true);
  //   lastScannedData.current = { data, timestamp: now };

  //   try {
  //     const courseRef = doc(db, 'courses', selectedCourse);
  //     const courseDoc = await getDoc(courseRef);
  //     const students = courseDoc.data()?.students || [];

  //     if (!students.some((student: { email: string }) => student.email === data)) {
  //       throw new Error('Estudiante no registrado en este curso');
  //     }

  //     await updateDoc(courseRef, {
  //       attendanceHistory: arrayUnion({
  //         date: new Date().toISOString(), 
  //         studentsPresent: [data],       
  //         timestamp: serverTimestamp()  
  //       })
  //     });

  //     Alert.alert('Éxito', `Asistencia registrada para: ${data}`);
  //   } catch (error: any) {
  //     Alert.alert('Error', error.message || 'Error al registrar asistencia');
  //   } finally {
  //     setTimeout(() => {
  //       setIsProcessing(false);
  //       lastScannedData.current = null;
  //     }, scanCooldown);
  //   }
  // };

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>Se requiere acceso a la cámara para escanear códigos QR</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : null}
        >
          <Text style={styles.settingsButtonText}>Abrir Configuración</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FA']}
      style={styles.container}
    >
      <Text style={styles.title}>📋 Tomar Asistencia</Text>

      {!selectedCourse ? (
        <View style={styles.coursesContainer}>
          {courses.map(course => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => handleCourseSelection(course.id)}
            >
              <MaterialIcons name="class" size={28} color="#2A5298" />
              <Text style={styles.courseName}>{course.name}</Text>
              <MaterialIcons name="arrow-forward-ios" size={20} color="#6C757D" />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.cameraWrapper}>
          <CameraView 
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleQRRead}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          >
              {isProcessing && (
      <View style={styles.processingOverlay}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.processingText}>Procesando...</Text>
        <Text style={styles.cooldownText}>Espere {scanCooldown/1000} segundos</Text>
      </View>
    )}
            <View style={styles.cameraOverlay}>
              <View style={styles.qrFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanText}>Enfoca el código QR dentro del marco</Text>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedCourse(null)}
              >
                <MaterialIcons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2A5298" />
            <Text style={styles.loadingText}>Cargando cursos...</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontFamily: Platform.select({ android: 'Roboto-Bold', ios: 'System' }),
    color: '#2A5298',
    textAlign: 'center',
    marginVertical: 25,
    letterSpacing: 0.8,
  },
  coursesContainer: {
    marginTop: 15,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...Platform.select({
      ios: {
        shadowColor: '#2A5298',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  courseName: {
    flex: 1,
    fontSize: 17,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
    color: '#495057',
    marginHorizontal: 15,
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFrame: {
    width: 260,
    height: 260,
    position: 'relative',
    marginBottom: 40,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    borderLeftWidth: 4,
    borderTopWidth: 4,
    left: 0,
    top: 0,
  },
  topRight: {
    borderRightWidth: 4,
    borderTopWidth: 4,
    right: 0,
    top: 0,
  },
  bottomLeft: {
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    left: 0,
    bottom: 0,
  },
  bottomRight: {
    borderRightWidth: 4,
    borderBottomWidth: 4,
    right: 0,
    bottom: 0,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2A5298',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6C757D',
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionText: {
    fontSize: 18,
    color: '#2A5298',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
  },
  settingsButton: {
    backgroundColor: '#2A5298',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 20,
    marginTop: 10,
  },
  cooldownText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 5,
  },
});

// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Platform, Linking } from 'react-native';
// import { db, auth } from '../firebase/config';
// import { collection, getDocs, doc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
// import { Camera, CameraView } from 'expo-camera';
// import { useNavigation } from '@react-navigation/native';
// import { MaterialIcons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';

// export default function TakeAttendanceScreen() {
//   const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
//   const [hasPermission, setHasPermission] = useState<boolean | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const lastScannedData = useRef<string | null>(null);
//   const navigation = useNavigation();

//   useEffect(() => {
//     const requestCameraPermission = async () => {
//       const { status } = await Camera.requestCameraPermissionsAsync();
//       setHasPermission(status === 'granted');
//     };

//     const fetchCourses = async () => {
//       try {
//         const userId = auth.currentUser?.uid;
//         if (!userId) return;

//         const querySnapshot = await getDocs(collection(db, "users", userId, "courses"));
//         const coursesData = querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           name: doc.data().name,
//         }));
//         setCourses(coursesData);
//       } catch (error) {
//         Alert.alert('Error', 'No se pudo cargar la lista de cursos.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     requestCameraPermission();
//     fetchCourses();
//   }, []);

//   const handleQRRead = async ({ data }: { data: string }) => {
//     if (isProcessing || !selectedCourse || data === lastScannedData.current) return;
    
//     setIsProcessing(true);
//     lastScannedData.current = data;
//     const userId = auth.currentUser?.uid;

//     try {
//       if (!userId) throw new Error('Usuario no autenticado');

//       // Referencia al curso del usuario actual
//       const courseRef = doc(db, "users", userId, "courses", selectedCourse);
//       const courseDoc = await getDoc(courseRef);

//       // Verificar si el estudiante existe en el curso
//       const students = courseDoc.data()?.students || [];
//       if (!students.includes(data)) {
//         throw new Error('Estudiante no registrado en este curso');
//       }

//       // Crear registro de asistencia individual en subcolección
//       await addDoc(collection(courseRef, "attendance"), {
//         student: data,
//         timestamp: serverTimestamp(),
//         date: new Date().toISOString()
//       });

//       Alert.alert('Éxito', `Asistencia registrada para: ${data}`);
//     } catch (error: any) {
//       Alert.alert('Error', error.message || 'Error al registrar asistencia');
//     } finally {
//       setTimeout(() => {
//         setIsProcessing(false);
//         lastScannedData.current = null;
//       }, 5000); // 5 segundos de cooldown
//     }
//   };

//   if (hasPermission === false) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.permissionText}>Se requiere acceso a la cámara</Text>
//         <TouchableOpacity
//           style={styles.settingsButton}
//           onPress={() => Linking.openSettings()}
//         >
//           <Text style={styles.settingsButtonText}>Abrir Configuración</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.container}>
//       <Text style={styles.title}>📋 Tomar Asistencia</Text>

//       {!selectedCourse ? (
//         <View style={styles.coursesContainer}>
//           {courses.map(course => (
//             <TouchableOpacity
//               key={course.id}
//               style={styles.courseCard}
//               onPress={() => setSelectedCourse(course.id)}
//             >
//               <MaterialIcons name="class" size={28} color="#2A5298" />
//               <Text style={styles.courseName}>{course.name}</Text>
//               <MaterialIcons name="arrow-forward-ios" size={20} color="#6C757D" />
//             </TouchableOpacity>
//           ))}
//         </View>
//       ) : (
//         <View style={styles.cameraWrapper}>
//           <CameraView 
//             style={styles.camera}
//             onBarcodeScanned={isProcessing ? undefined : handleQRRead}
//             barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
//           >
//             <View style={styles.cameraOverlay}>
//               {isProcessing && (
//                 <View style={styles.processingOverlay}>
//                   <ActivityIndicator size="large" color="#FFF" />
//                   <Text style={styles.processingText}>Registro exitoso</Text>
//                   <Text style={styles.cooldownText}>Espere 5 segundos para nuevo escaneo</Text>
//                 </View>
//               )}
//               <View style={styles.qrFrame}>
//                 <View style={[styles.corner, styles.topLeft]} />
//                 <View style={[styles.corner, styles.topRight]} />
//                 <View style={[styles.corner, styles.bottomLeft]} />
//                 <View style={[styles.corner, styles.bottomRight]} />
//               </View>
//               <Text style={styles.scanText}>Enfoca el código QR del estudiante</Text>
              
//               <TouchableOpacity 
//                 style={styles.closeButton}
//                 onPress={() => setSelectedCourse(null)}
//               >
//                 <MaterialIcons name="close" size={28} color="white" />
//               </TouchableOpacity>
//             </View>
//           </CameraView>
//         </View>
//       )}

//       {loading && (
//         <View style={styles.loadingOverlay}>
//           <View style={styles.loadingCard}>
//             <ActivityIndicator size="large" color="#2A5298" />
//             <Text style={styles.loadingText}>Cargando cursos...</Text>
//           </View>
//         </View>
//       )}
//     </LinearGradient>
//   );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 25,
//   },
//   title: {
//     fontSize: 28,
//     fontFamily: Platform.select({ android: 'Roboto-Bold', ios: 'System' }),
//     color: '#2A5298',
//     textAlign: 'center',
//     marginVertical: 25,
//     letterSpacing: 0.8,
//   },
//   coursesContainer: {
//     marginTop: 15,
//   },
//   courseCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 15,
//     padding: 20,
//     marginVertical: 10,
//     borderWidth: 1,
//     borderColor: '#E9ECEF',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#2A5298',
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.1,
//         shadowRadius: 10,
//       },
//       android: {
//         elevation: 5,
//       },
//     }),
//   },
//   courseName: {
//     flex: 1,
//     fontSize: 17,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//     color: '#495057',
//     marginHorizontal: 15,
//   },
//   cameraWrapper: {
//     flex: 1,
//     borderRadius: 25,
//     overflow: 'hidden',
//     marginVertical: 20,
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//   },
//   camera: {
//     flex: 1,
//   },
//   cameraOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   qrFrame: {
//     width: 260,
//     height: 260,
//     position: 'relative',
//     marginBottom: 40,
//   },
//   corner: {
//     position: 'absolute',
//     width: 40,
//     height: 40,
//     borderColor: '#FFFFFF',
//   },
//   topLeft: {
//     borderLeftWidth: 4,
//     borderTopWidth: 4,
//     left: 0,
//     top: 0,
//   },
//   topRight: {
//     borderRightWidth: 4,
//     borderTopWidth: 4,
//     right: 0,
//     top: 0,
//   },
//   bottomLeft: {
//     borderLeftWidth: 4,
//     borderBottomWidth: 4,
//     left: 0,
//     bottom: 0,
//   },
//   bottomRight: {
//     borderRightWidth: 4,
//     borderBottomWidth: 4,
//     right: 0,
//     bottom: 0,
//   },
//   scanText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     marginTop: 20,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//     textAlign: 'center',
//     textShadowColor: 'rgba(0,0,0,0.3)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 3,
//     letterSpacing: 0.5,
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 40,
//     right: 25,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderRadius: 20,
//     padding: 12,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.2,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 5,
//       },
//     }),
//   },
//   loadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(255,255,255,0.95)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 35,
//     alignItems: 'center',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#2A5298',
//         shadowOffset: { width: 0, height: 6 },
//         shadowOpacity: 0.1,
//         shadowRadius: 12,
//       },
//       android: {
//         elevation: 8,
//       },
//     }),
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 16,
//     color: '#6C757D',
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 30,
//   },
//   permissionText: {
//     fontSize: 18,
//     color: '#2A5298',
//     textAlign: 'center',
//     marginBottom: 20,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//   },
//   settingsButton: {
//     backgroundColor: '#2A5298',
//     paddingVertical: 12,
//     paddingHorizontal: 25,
//     borderRadius: 8,
//   },
//   settingsButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontFamily: Platform.select({ android: 'Roboto-Medium', ios: 'System' }),
//   },
//   processingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   processingText: {
//     color: '#FFFFFF',
//     fontSize: 20,
//     marginTop: 10,
//   },
//   cooldownText: {
//     color: '#CCCCCC',
//     fontSize: 14,
//     marginTop: 5,
//   },
// });