// import { StyleSheet, Text, View } from "react-native";
// import AppNavigator from "../navigation/AppNavigator";



// export default function Page() {
//   return (
    
//       <AppNavigator />
    
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     padding: 24,
//   },
//   main: {
//     flex: 1,
//     justifyContent: "center",
//     maxWidth: 960,
//     marginHorizontal: "auto",
//   },
//   title: {
//     fontSize: 64,
//     fontWeight: "bold",
//   },
//   subtitle: {
//     fontSize: 36,
//     color: "#38434D",
//   },
// });

import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AppNavigator from "../navigation/AppNavigator";


SplashScreen.preventAutoHideAsync();

export default function Page() {
  const [appIsReady, setAppIsReady] = useState(false);


  useEffect(() => {
    async function prepare() {
      try {

        await new Promise((resolve) => setTimeout(resolve, 2000)); 
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);


  if (!appIsReady) {
    return null;
  }


  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppNavigator />
    </View>
  );
}