import React from "react";
import { View,Text,StyleSheet,ImageBackground,TouchableOpacity,Platform,} from "react-native";
import { NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";

const HomeScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  return (
    <ImageBackground style={styles.background} resizeMode="cover">
      <LinearGradient
        colors={["rgba(255,255,255,0.95)", "rgba(245,245,245,0.95)"]}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Attendo</Text>

          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => navigation.navigate("ManageCourses")}>
            <Icon name="class" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Mis Cursos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate("TakeAttendance")}>
            <Icon
              name="checklist"
              size={24}
              color="#2A5298"
              style={styles.icon}
            />
            <Text style={[styles.buttonText, styles.darkText]}>
              Tomar Asistencia
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={() => navigation.navigate("AttendanceHistory")}
          >
            <Icon name="history" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Historial</Text>
          </TouchableOpacity> */}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 32,
    marginBottom: 40,
    textAlign: "center",
    fontFamily: "Roboto-Bold",
    color: "#2A5298",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginVertical: 10,
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
  primaryButton: {
    backgroundColor: "#2A5298",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#2A5298",
  },
  tertiaryButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Roboto-Medium",
    marginLeft: 10,
  },
  darkText: {
    color: "#2A5298",
  },
  icon: {
    marginRight: 5,
  },
});

export default HomeScreen;
