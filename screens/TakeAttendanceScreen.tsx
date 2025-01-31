import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Linking,
  PermissionsAndroid,
} from "react-native";
import { db, auth } from "../firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  doc,
} from "firebase/firestore";
import { Camera, CameraView } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";

interface Course {
  id: string;
  name: string;
  alumnos?: string[];
}

export default function TakeAttendanceScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<string[]>([]);
  const lastScannedData = useRef<{ data: string; timestamp: number } | null>(null);
  const scanCooldown = 5000;
  const user = auth.currentUser;
  const navigation = useNavigation();
  
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: "Permiso de Cámara",
              message: "Esta app necesita acceso a la cámara para escanear códigos QR.",
              buttonPositive: "Aceptar",
            }
          );
          setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } else {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === "granted");
        }
      } catch (error) {
        console.error("Error al solicitar permiso:", error);
        setHasPermission(false);
      }
    };

    const fetchCourses = async () => {
      try {
        if (!user) return;

        const cursosRef = collection(db, "users", user.uid, "cursos");
        const querySnapshot = await getDocs(cursosRef);
        const coursesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setCourses(coursesData);
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar la lista de cursos.");
      } finally {
        setLoading(false);
      }
    };

    requestCameraPermission();
    fetchCourses();
  }, [user]);



  const handleCourseSelection = async (courseId: string) => {
    try {
      setLoading(true);
      const alumnosRef = collection(db, "users", user!.uid, "cursos", courseId, "alumnos");
      const snapshot = await getDocs(alumnosRef);
      const emails = snapshot.docs.map(doc => doc.data().email);
      
      setCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, alumnos: emails } : c
      ));
      
      setSelectedCourse(courseId);
      setScannedStudents([]);
    } catch (error) {
      Alert.alert("Error", "Error al cargar estudiantes del curso");
    } finally {
      setLoading(false);
    }
  };

  const handleQRRead = async ({ data }: { data: string }) => {
    const now = Date.now();
    if (
      lastScannedData.current &&
      lastScannedData.current.data === data &&
      now - lastScannedData.current.timestamp < scanCooldown
    ) {
      return;
    }

    if (scanned || !selectedCourse || !user || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);
    lastScannedData.current = { data, timestamp: now };

    try {
      const currentCourse = courses.find(c => c.id === selectedCourse);
      if (!currentCourse?.alumnos?.includes(data)) {
        throw new Error("Estudiante no pertenece a este curso");
      }

      setScannedStudents(prev => [...prev, data]);

      const asistenciasRef = collection(
        db,
        "users",
        user.uid,
        "cursos",
        selectedCourse,
        "asistencias"
      );

      const localDate = new Date(); 
      const formattedDate = format(localDate, "yyyy-MM-dd"); 

      await addDoc(asistenciasRef, {
        studentEmail: data,
        date: localDate,
        formattedDate, 
        status: "presente",
      });

      Alert.alert("Éxito", `Asistencia registrada para: ${data}`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al registrar asistencia");
    } finally {
      setTimeout(() => {
        setScanned(false);
        setIsProcessing(false);
        lastScannedData.current = null;
      }, scanCooldown);
    }
  };

  const markAbsentStudents = async () => {
    try {
      setIsProcessing(true);
      
      if (!user || !selectedCourse) {
        throw new Error("Datos incompletos para registrar ausentes");
      }

      const currentCourse = courses.find(c => c.id === selectedCourse);
      if (!currentCourse?.alumnos) return;

      const absentStudents = currentCourse.alumnos.filter(
        email => !scannedStudents.includes(email)
      );

      const batch = writeBatch(db);
      const asistenciasRef = collection(
        db,
        "users",
        user.uid,
        "cursos",
        selectedCourse,
        "asistencias"
      );

      const localDate = new Date(); 
      const formattedDate = format(localDate, "yyyy-MM-dd"); 

      absentStudents.forEach(email => {
        const docRef = doc(asistenciasRef);
        batch.set(docRef, {
          studentEmail: email,
          date: localDate, 
          formattedDate, 
          status: "ausente",
        });
      });

      await batch.commit();
      Alert.alert(
        "Éxito", 
        `Asistencia finalizada`
      );
      
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Error al marcar ausentes");
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          Se requiere acceso a la cámara para escanear códigos QR
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() =>
            Platform.OS === "ios" ? Linking.openURL("app-settings:") : null
          }
        >
          <Text style={styles.settingsButtonText}>Abrir Configuración</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.container}>
      <Text style={styles.title}>📋 Tomar Asistencia</Text>

      {!selectedCourse ? (
        <View style={styles.coursesContainer}>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => handleCourseSelection(course.id)}
            >
              <MaterialIcons name="class" size={28} color="#2A5298" />
              <Text style={styles.courseName}>{course.name}</Text>
              <MaterialIcons
                name="arrow-forward-ios"
                size={20}
                color="#6C757D"
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.cameraWrapper}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={isProcessing ? undefined : handleQRRead}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.processingText}>Procesando...</Text>
                <Text style={styles.cooldownText}>
                  Listo en{" "}
                  {Math.ceil(
                    (scanCooldown -
                      (Date.now() -
                        (lastScannedData.current?.timestamp || 0))) /
                      1000
                  )}
                  s
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <View style={styles.qrFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanText}>
                Enfoca el código QR dentro del marco
              </Text>

              <TouchableOpacity
                style={styles.finishButton}
                onPress={markAbsentStudents}
                disabled={isProcessing}
              >
                <MaterialIcons name="done-all" size={24} color="white" />
                <Text style={styles.finishButtonText}>Finalizar Asistencia</Text>
              </TouchableOpacity>

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
    fontFamily: Platform.select({ android: "Roboto-Bold", ios: "System" }),
    color: "#2A5298",
    textAlign: "center",
    marginVertical: 25,
    letterSpacing: 0.8,
  },
  coursesContainer: {
    marginTop: 15,
  },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    ...Platform.select({
      ios: {
        shadowColor: "#2A5298",
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
    fontFamily: Platform.select({ android: "Roboto-Medium", ios: "System" }),
    color: "#495057",
    marginHorizontal: 15,
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    marginVertical: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrFrame: {
    width: 260,
    height: 260,
    position: "relative",
    marginBottom: 40,
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
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
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 20,
    fontFamily: Platform.select({ android: "Roboto-Medium", ios: "System" }),
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  finishButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#2A5298",
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
    color: "#6C757D",
    fontFamily: Platform.select({ android: "Roboto-Medium", ios: "System" }),
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  permissionText: {
    fontSize: 18,
    color: "#2A5298",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Platform.select({ android: "Roboto-Medium", ios: "System" }),
  },
  settingsButton: {
    backgroundColor: "#2A5298",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Platform.select({ android: "Roboto-Medium", ios: "System" }),
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 20,
    marginTop: 10,
  },
  cooldownText: {
    color: "#CCCCCC",
    fontSize: 14,
    marginTop: 5,
  },
});
