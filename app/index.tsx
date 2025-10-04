import { MessageCircle } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_BUSINESS_GREEN = "#128C7E";
const ERROR_RED = "#DC2626";
const LIGHT_GRAY = "#F3F4F6";
const DARK_GRAY = "#6B7280";
const TEXT_DARK = "#111827";

export default function WhatsAppLinkScreen() {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showAppSelector, setShowAppSelector] = useState<boolean>(false);
  const [validatedE164, setValidatedE164] = useState<string>("");
  const [buttonScale] = useState(new Animated.Value(1));

  const validateAndFormatPhone = (input: string): { valid: boolean; e164?: string; error?: string } => {
    if (!input.trim()) {
      return { valid: false, error: "Please enter a phone number" };
    }

    try {
      const cleaned = input.replace(/[^0-9+]/g, "");
      
      if (!cleaned.startsWith("+")) {
        return { 
          valid: false, 
          error: "Phone number must start with + and country code (e.g., +1 for US)" 
        };
      }

      if (!isValidPhoneNumber(cleaned)) {
        return { 
          valid: false, 
          error: "Invalid phone number format. Use international format: +[country code][number]" 
        };
      }

      const phoneNumberObj = parsePhoneNumber(cleaned);
      const e164 = phoneNumberObj.number;

      return { valid: true, e164 };
    } catch {
      return { 
        valid: false, 
        error: "Invalid phone number. Please use format: +[country code][number]" 
      };
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    if (error) {
      setError("");
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkWhatsAppApps = async (): Promise<{ whatsapp: boolean; business: boolean }> => {
    const whatsappUrl = "whatsapp://";
    const businessUrl = "whatsapp://send?phone=";
    
    try {
      const [whatsapp, business] = await Promise.all([
        Linking.canOpenURL(whatsappUrl),
        Platform.OS === "android" 
          ? Linking.canOpenURL("intent://send/#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end")
          : Linking.canOpenURL(businessUrl)
      ]);
      
      return { whatsapp, business };
    } catch {
      return { whatsapp: true, business: false };
    }
  };

  const openWhatsAppLink = async () => {
    const url = `https://wa.me/${validatedE164.replace("+", "")}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Cannot Open WhatsApp",
          "WhatsApp is not installed on this device.",
          [{ text: "OK" }]
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Failed to open WhatsApp. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleChatPress = async () => {
    animateButton();
    
    const validation = validateAndFormatPhone(phoneNumber);
    
    if (!validation.valid) {
      setError(validation.error || "Invalid phone number");
      return;
    }

    setValidatedE164(validation.e164!);
    setError("");

    const apps = await checkWhatsAppApps();
    
    if (apps.whatsapp && apps.business) {
      setShowAppSelector(true);
    } else {
      await openWhatsAppLink();
    }
  };

  const handleAppSelection = async () => {
    setShowAppSelector(false);
    await openWhatsAppLink();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MessageCircle size={48} color={WHATSAPP_GREEN} strokeWidth={2} />
          </View>
          <Text style={styles.title}>WhatsApp Quick Chat</Text>
          <Text style={styles.subtitle}>
            Enter a phone number to start a WhatsApp conversation
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[
              styles.input,
              error ? styles.inputError : null,
            ]}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            placeholder="+1 234 567 8900"
            placeholderTextColor={DARK_GRAY}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            testID="phone-input"
          />
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.helperText}>
              Include country code (e.g., +1 for US, +44 for UK)
            </Text>
          )}
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleChatPress}
            testID="chat-button"
          >
            <MessageCircle size={24} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.buttonText}>Chat on WhatsApp</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            This will open WhatsApp with a chat ready to send to the number you entered.
          </Text>
        </View>
      </View>

      <Modal
        visible={showAppSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppSelector(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAppSelector(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose App</Text>
            <Text style={styles.modalSubtitle}>
              Which app would you like to use?
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.modalButton,
                styles.whatsappButton,
                pressed && styles.modalButtonPressed,
              ]}
              onPress={() => handleAppSelection()}
              testID="whatsapp-option"
            >
              <MessageCircle size={24} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.modalButtonText}>WhatsApp</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modalButton,
                styles.businessButton,
                pressed && styles.modalButtonPressed,
              ]}
              onPress={() => handleAppSelection()}
              testID="business-option"
            >
              <MessageCircle size={24} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.modalButtonText}>WhatsApp Business</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={() => setShowAppSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: LIGHT_GRAY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: DARK_GRAY,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: LIGHT_GRAY,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    color: TEXT_DARK,
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: ERROR_RED,
  },
  errorText: {
    fontSize: 14,
    color: ERROR_RED,
    marginTop: 8,
  },
  helperText: {
    fontSize: 14,
    color: DARK_GRAY,
    marginTop: 8,
  },
  button: {
    height: 56,
    backgroundColor: WHATSAPP_GREEN,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: WHATSAPP_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: DARK_GRAY,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: DARK_GRAY,
    marginBottom: 24,
    textAlign: "center",
  },
  modalButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  modalButtonPressed: {
    opacity: 0.9,
  },
  whatsappButton: {
    backgroundColor: WHATSAPP_GREEN,
  },
  businessButton: {
    backgroundColor: WHATSAPP_BUSINESS_GREEN,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  cancelButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  cancelButtonPressed: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: DARK_GRAY,
  },
});
