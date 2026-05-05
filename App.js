import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { STICKERS, findSticker, normalizeStickerCode } from "./src/stickers";

const STORAGE_KEY = "panini-2026-collection-v1";

function getStatus(quantity) {
  if (quantity >= 2) {
    return {
      label: "Es repetida",
      tone: "repeat",
      detail: `Tienes ${quantity} copias de esta estampa.`
    };
  }

  if (quantity === 1) {
    return {
      label: "Ya la tienes",
      tone: "owned",
      detail: "Esta estampa ya esta registrada en tu album."
    };
  }

  return {
    label: "Te falta",
    tone: "missing",
    detail: "Todavia no esta registrada en tu album."
  };
}

export default function App() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [collection, setCollection] = useState({});
  const [codeInput, setCodeInput] = useState("ARG 4");
  const [selectedCode, setSelectedCode] = useState("ARG4");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          setCollection(JSON.parse(saved));
        }
      })
      .catch(() => {
        Alert.alert("No pude cargar tu album", "Intenta cerrar y abrir la app.");
      });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collection)).catch(() => {
      Alert.alert("No pude guardar", "Tu avance no se guardo en el telefono.");
    });
  }, [collection]);

  const selectedSticker = useMemo(() => findSticker(selectedCode), [selectedCode]);
  const selectedQuantity = collection[normalizeStickerCode(selectedCode)] || 0;
  const status = getStatus(selectedQuantity);

  const stats = useMemo(() => {
    const owned = Object.values(collection).filter((quantity) => quantity > 0).length;
    const repeated = Object.values(collection).reduce((total, quantity) => {
      return total + Math.max(quantity - 1, 0);
    }, 0);

    return {
      owned,
      missing: Math.max(STICKERS.length - owned, 0),
      repeated
    };
  }, [collection]);

  const filteredStickers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return STICKERS;
    }

    return STICKERS.filter((sticker) => {
      return [sticker.code, sticker.name, sticker.team]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query]);

  const checkCode = () => {
    const normalized = normalizeStickerCode(codeInput);

    if (!normalized) {
      Alert.alert("Falta el codigo", "Escribe algo como ARG 4, ARG4 o ARG-4.");
      return;
    }

    setSelectedCode(normalized);
  };

  const addSticker = () => {
    const normalized = normalizeStickerCode(selectedCode);

    setCollection((current) => ({
      ...current,
      [normalized]: (current[normalized] || 0) + 1
    }));
  };

  const removeSticker = () => {
    const normalized = normalizeStickerCode(selectedCode);

    setCollection((current) => {
      const quantity = current[normalized] || 0;
      const next = { ...current };

      if (quantity <= 1) {
        delete next[normalized];
      } else {
        next[normalized] = quantity - 1;
      }

      return next;
    });
  };

  const takePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    await cameraRef.current.takePictureAsync({ quality: 0.6, skipProcessing: true });
    setPhotoTaken(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Panini FIFA World Cup 2026</Text>
            <Text style={styles.title}>Mi album</Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterNumber}>{stats.owned}</Text>
            <Text style={styles.counterLabel}>tengo</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Faltan" value={stats.missing} />
          <Stat label="Repetidas" value={stats.repeated} />
          <Stat label="Base" value={STICKERS.length} />
        </View>

        <View style={styles.scanPanel}>
          <View style={styles.cameraBox}>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            ) : (
              <View style={styles.permissionBox}>
                <Text style={styles.permissionTitle}>Camara lista para activar</Text>
                <Text style={styles.permissionText}>
                  La app usara la parte de atras de la estampa, donde aparece el codigo.
                </Text>
                <Pressable style={styles.primaryButton} onPress={requestPermission}>
                  <Text style={styles.primaryButtonText}>Permitir camara</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.scanActions}>
            <Pressable
              disabled={!permission?.granted}
              style={[styles.secondaryButton, !permission?.granted && styles.disabledButton]}
              onPress={takePhoto}
            >
              <Text style={styles.secondaryButtonText}>Tomar foto</Text>
            </Pressable>
            <Text style={styles.scanHint}>
              {photoTaken
                ? "Foto tomada. En esta version confirma el codigo manualmente."
                : "Apunta al reverso, por ejemplo ARG 4."}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              autoCapitalize="characters"
              placeholder="ARG 4"
              style={styles.input}
              value={codeInput}
              onChangeText={setCodeInput}
              onSubmitEditing={checkCode}
            />
            <Pressable style={styles.primaryButton} onPress={checkCode}>
              <Text style={styles.primaryButtonText}>Revisar</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.resultPanel, styles[`${status.tone}Panel`]]}>
          <Text style={styles.resultStatus}>{status.label}</Text>
          <Text style={styles.resultName}>
            {selectedSticker ? selectedSticker.name : "Estampa sin datos"}
          </Text>
          <Text style={styles.resultMeta}>
            {selectedSticker
              ? `${selectedSticker.code} - ${selectedSticker.team}`
              : `${selectedCode} - Puedes registrarla aunque aun no este en la base.`}
          </Text>
          <Text style={styles.resultDetail}>{status.detail}</Text>
          <View style={styles.resultActions}>
            <Pressable style={styles.primaryButton} onPress={addSticker}>
              <Text style={styles.primaryButtonText}>Agregar</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={removeSticker}>
              <Text style={styles.ghostButtonText}>Quitar</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Checklist inicial</Text>
          <TextInput
            placeholder="Buscar codigo, jugador o seleccion"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          data={filteredStickers}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const quantity = collection[normalizeStickerCode(item.code)] || 0;
            const itemStatus = getStatus(quantity);

            return (
              <Pressable
                style={styles.listItem}
                onPress={() => {
                  setSelectedCode(item.code);
                  setCodeInput(item.code);
                }}
              >
                <View>
                  <Text style={styles.itemCode}>{item.code}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemTeam}>{item.team}</Text>
                </View>
                <View style={[styles.statusPill, styles[`${itemStatus.tone}Pill`]]}>
                  <Text style={styles.statusPillText}>{itemStatus.label}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f4ef"
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  kicker: {
    color: "#6c665e",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: "#1f2529",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  counter: {
    alignItems: "center",
    backgroundColor: "#17324d",
    borderRadius: 8,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  counterNumber: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900"
  },
  counterLabel: {
    color: "#dbe9f2",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  stat: {
    backgroundColor: "#ffffff",
    borderColor: "#e4ded4",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 10
  },
  statValue: {
    color: "#1f2529",
    fontSize: 20,
    fontWeight: "900"
  },
  statLabel: {
    color: "#706a62",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  scanPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#e4ded4",
    borderRadius: 8,
    borderWidth: 1,
    padding: 10
  },
  cameraBox: {
    aspectRatio: 4 / 3,
    backgroundColor: "#1f2529",
    borderRadius: 8,
    overflow: "hidden"
  },
  camera: {
    flex: 1
  },
  permissionBox: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  permissionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center"
  },
  permissionText: {
    color: "#d4dde5",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    textAlign: "center"
  },
  scanActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  scanHint: {
    color: "#6c665e",
    flex: 1,
    fontSize: 12,
    lineHeight: 16
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  input: {
    backgroundColor: "#f7f4ef",
    borderColor: "#d8d0c6",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2529",
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    minHeight: 48,
    paddingHorizontal: 12
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#d73b32",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#17324d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  disabledButton: {
    opacity: 0.35
  },
  resultPanel: {
    borderRadius: 8,
    marginTop: 12,
    padding: 14
  },
  missingPanel: {
    backgroundColor: "#fff1d7"
  },
  ownedPanel: {
    backgroundColor: "#dff3e6"
  },
  repeatPanel: {
    backgroundColor: "#dcecff"
  },
  resultStatus: {
    color: "#1f2529",
    fontSize: 24,
    fontWeight: "900"
  },
  resultName: {
    color: "#1f2529",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 2
  },
  resultMeta: {
    color: "#4d575d",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3
  },
  resultDetail: {
    color: "#4d575d",
    fontSize: 13,
    marginTop: 8
  },
  resultActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  ghostButton: {
    alignItems: "center",
    borderColor: "#a8a096",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16
  },
  ghostButtonText: {
    color: "#1f2529",
    fontSize: 14,
    fontWeight: "900"
  },
  listHeader: {
    marginTop: 12
  },
  sectionTitle: {
    color: "#1f2529",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderColor: "#e4ded4",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2529",
    minHeight: 42,
    paddingHorizontal: 12
  },
  list: {
    gap: 8,
    paddingBottom: 28,
    paddingTop: 10
  },
  listItem: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e4ded4",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 74,
    padding: 12
  },
  itemCode: {
    color: "#d73b32",
    fontSize: 13,
    fontWeight: "900"
  },
  itemName: {
    color: "#1f2529",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2
  },
  itemTeam: {
    color: "#6c665e",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  missingPill: {
    backgroundColor: "#fff1d7"
  },
  ownedPill: {
    backgroundColor: "#dff3e6"
  },
  repeatPill: {
    backgroundColor: "#dcecff"
  },
  statusPillText: {
    color: "#1f2529",
    fontSize: 11,
    fontWeight: "900"
  }
});
