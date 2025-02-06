import { useEffect } from "react";
import AppNavigator from "../navigation/AppNavigator";
import * as SplashScreen from 'expo-splash-screen';
export default function Page() {


  SplashScreen.preventAutoHideAsync();

  useEffect(() => {
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);
  }, []);
  
  return (
      <AppNavigator />
  );
}


