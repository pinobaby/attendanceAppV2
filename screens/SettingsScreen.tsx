import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAuth, updateProfile, updateEmail, signOut } from 'firebase/auth';
import { useTheme } from './ThemeContext';
import Constants from 'expo-constants';

const SettingsScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const { theme } = useTheme();
  const auth = getAuth();
  const user = auth.currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const dynamicStyles = getDynamicStyles(theme);

  const updateUserProfile = async () => {
    if (!displayName.trim() || !email.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      await updateProfile(user!, { displayName });
      await updateEmail(user!, email);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salir',
          onPress: async () => {
            await signOut(auth);
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={dynamicStyles.container}>
      {loading && (
        <ActivityIndicator
          size="large"
          color="#3533c0"
          style={styles.loading}
        />
      )}

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Perfil</Text>

        <View style={dynamicStyles.profileIconContainer}>
          <Icon name="person" size={80} color="#3533c0" />
        </View>

        <TextInput
          placeholder="Nombre"
          value={displayName}
          onChangeText={setDisplayName}
          style={dynamicStyles.input}
        />

        <TextInput
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          style={dynamicStyles.input}
          keyboardType="email-address"
        />

        <TouchableOpacity
          style={dynamicStyles.button}
          onPress={updateUserProfile}
        >
          <Text style={dynamicStyles.buttonText}>Actualizar Perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={dynamicStyles.section}>
        <TouchableOpacity
          style={dynamicStyles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color="#e74c3c" />
          <Text style={dynamicStyles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.versionText}>
          Versión {Constants.manifest?.version || '1.0.0'}
        </Text>
      </View>
    </View>
  );
};

const getDynamicStyles = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
    },
    section: {
      backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#fff' : '#3533c0',
      marginBottom: 15,
    },
    profileIconContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    input: {
      backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
      borderRadius: 8,
      padding: 12,
      marginBottom: 15,
      color: theme === 'dark' ? '#fff' : '#000',
    },
    button: {
      backgroundColor: '#3533c0',
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      backgroundColor: theme === 'dark' ? '#3a1a1a' : '#ffe6e6',
      borderRadius: 8,
    },
    logoutText: {
      color: '#e74c3c',
      marginLeft: 10,
      fontWeight: '600',
    },
    versionText: {
      textAlign: 'center',
      color: theme === 'dark' ? '#888' : '#666',
    },
  });

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 100,
  },
});

export default SettingsScreen;