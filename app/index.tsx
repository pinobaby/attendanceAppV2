import { StyleSheet, Text, View } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import AppNavigator from "../navigation/AppNavigator";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();



export default function Page() {

  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 2000);
  }, []);
  
  return (
      <AppNavigator />
  );
}

