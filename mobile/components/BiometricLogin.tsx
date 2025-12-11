import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ViewStyle,
  TextStyle
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

interface BiometricLoginProps {
  onSuccess: () => void;
  onFailure?: (error: string) => void;
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * BiometricLogin Component
 * 
 * Implements secure authentication using device hardware (FaceID / TouchID).
 * Intended for securing access to Google Cloud Service management features.
 */
const BiometricLogin: React.FC<BiometricLoginProps> = ({ 
  onSuccess, 
  onFailure,
  containerStyle,
  buttonStyle,
  textStyle
}) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    checkDeviceHardware();
  }, []);

  const checkDeviceHardware = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types && types.length > 0) {
          // Determine type for UI customization (1: Fingerprint, 2: Facial Recognition, 3: Iris)
          setBiometricType(types[0]);
        }
      }
    } catch (error) {
      console.error('[BiometricLogin] Error checking hardware:', error);
      setIsBiometricSupported(false);
    }
  };

  const handleAuthentication = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);

    try {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!isEnrolled) {
        Alert.alert(
          'Biometrics Not Set Up',
          'Please ensure you have set up Face ID or Touch ID in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        setIsAuthenticating(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify identity to access Cloud Console',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onSuccess();
      } else {
        const errorMessage = result.error === 'user_cancel' ? 'User cancelled' : 'Authentication failed';
        if (onFailure) onFailure(errorMessage);
        
        // Only alert on failure if it wasn't a deliberate cancel
        if (result.error !== 'user_cancel') {
             Alert.alert('Authentication Failed', 'Unable to verify identity.');
        }
      }
    } catch (error) {
      console.error('[BiometricLogin] Auth error:', error);
      if (onFailure) onFailure('System error during authentication');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getButtonLabel = () => {
    if (biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
      return Platform.OS === 'ios' ? 'Login with Face ID' : 'Login with Face Unlock';
    }
    if (biometricType === LocalAuthentication.AuthenticationType.FINGERPRINT) {
      return 'Login with Touch ID';
    }
    return 'Biometric Login';
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
      return 'scan-outline';
    }
    return 'finger-print-outline';
  };

  if (!isBiometricSupported) {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        style={[styles.button, buttonStyle, isAuthenticating && styles.buttonDisabled]} 
        onPress={handleAuthentication}
        disabled={isAuthenticating}
        activeOpacity={0.7}
      >
        <Ionicons name={getIconName()} size={24} color="#FFFFFF" style={styles.icon} />
        <Text style={[styles.text, textStyle]}>
          {getButtonLabel()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4285F4', // Google Blue
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 220,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  buttonDisabled: {
    backgroundColor: '#8AB4F8',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default BiometricLogin;