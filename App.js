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
            <Text style={styles.kicker}>FIFA World Cup 2026</Text>
            <Text style={styles.title}>Album Manager</Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterNumber}>{stats.owned}</Text>
            <Text style={styles.counterLabel}>tengo</Text>
          </View>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>Gestion de coleccion</Text>
            <Text style={styles.heroTitle}>Panini Mundial 2026</Text>
            <Text style={styles.heroText}>
              Escanea el reverso, confirma el codigo y controla tus faltantes y repetidas.
            </Text>
          </View>
          <View style={styles.pitchBadge}>
            <View style={styles.pitchLine} />
            <Text style={styles.pitchNumber}>26</Text>
            <Text style={styles.pitchText}>World Cup</Text>
          </View>
        </View>

        <View style={styles.progressPanel}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progreso del album</Text>
            <Text style={styles.progressPercent}>
              {Math.round((stats.owned / STICKERS.length) * 100)}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((stats.owned / STICKERS.length) * 100, 100)}%` }
              ]}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Faltan" value={stats.missing} />
          <Stat label="Repetidas" value={stats.repeated} />
          <Stat label="Base" value={STICKERS.length} />
        </View>

        <View style={styles.scanPanel}>
          <View style={styles.panelTitleRow}>
            <Text style={styles.panelTitle}>Escaner de estampas</Text>
            <Text style={styles.panelTag}>Reverso</Text>
          </View>
          <View style={styles.cameraBox}>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.camera} facing="back">
                <View style={styles.scanFrame}>
                  <View style={styles.scanCorner} />
                  <Text style={styles.scanFrameText}>Centra el codigo: ARG 4</Text>
                </View>
              </CameraView>
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
          <Text style={styles.resultEyebrow}>Resultado</Text>
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
          <Text style={styles.sectionTitle}>Panel de gestion</Text>
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
                <View style={styles.itemRight}>
                  <Text style={styles.quantityText}>x{quantity}</Text>
                  <View style={[styles.statusPill, styles[`${itemStatus.tone}Pill`]]}>
                    <Text style={styles.statusPillText}>{itemStatus.label}</Text>
                  </View>
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
    backgroundColor: "#eef3f0"
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
    color: "#51605b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: "#10211b",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: 0
  },
  counter: {
    alignItems: "center",
    backgroundColor: "#092c26",
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
    color: "#cce9df",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  heroPanel: {
    backgroundColor: "#0d3b31",
    borderColor: "#0a2d26",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    minHeight: 126,
    overflow: "hidden",
    padding: 14
  },
  heroCopy: {
    flex: 1,
    justifyContent: "center"
  },
  heroLabel: {
    color: "#f3c14b",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 2
  },
  heroText: {
    color: "#d7ece5",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6
  },
  pitchBadge: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#155d4b",
    borderColor: "#5fd19e",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 104,
    overflow: "hidden",
    paddingHorizontal: 10
  },
  pitchLine: {
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: 999,
    borderWidth: 2,
    height: 58,
    position: "absolute",
    width: 58
  },
  pitchNumber: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900"
  },
  pitchText: {
    color: "#f3c14b",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  progressPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  progressTitle: {
    color: "#10211b",
    fontSize: 14,
    fontWeight: "900"
  },
  progressPercent: {
    color: "#d73b32",
    fontSize: 14,
    fontWeight: "900"
  },
  progressTrack: {
    backgroundColor: "#dce6e0",
    borderRadius: 999,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: "#28a36f",
    borderRadius: 999,
    height: "100%"
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  stat: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 10
  },
  statValue: {
    color: "#10211b",
    fontSize: 20,
    fontWeight: "900"
  },
  statLabel: {
    color: "#51605b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  scanPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
    borderRadius: 8,
    borderWidth: 1,
    padding: 10
  },
  panelTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  panelTitle: {
    color: "#10211b",
    fontSize: 16,
    fontWeight: "900"
  },
  panelTag: {
    backgroundColor: "#fff1d7",
    borderRadius: 999,
    color: "#7f4e00",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 9,
    paddingVertical: 4,
    textTransform: "uppercase"
  },
  cameraBox: {
    aspectRatio: 4 / 3,
    backgroundColor: "#10211b",
    borderRadius: 8,
    overflow: "hidden"
  },
  camera: {
    flex: 1
  },
  scanFrame: {
    alignItems: "center",
    alignSelf: "center",
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: 8,
    borderWidth: 2,
    bottom: 22,
    justifyContent: "center",
    minHeight: 64,
    paddingHorizontal: 14,
    position: "absolute",
    width: "62%"
  },
  scanCorner: {
    backgroundColor: "#f3c14b",
    borderRadius: 999,
    height: 8,
    position: "absolute",
    top: -5,
    width: 44
  },
  scanFrameText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
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
    backgroundColor: "#eef3f0",
    borderColor: "#c8d4ce",
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
    backgroundColor: "#092c26",
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
    borderWidth: 1,
    marginTop: 12,
    padding: 14
  },
  missingPanel: {
    backgroundColor: "#fff1d7",
    borderColor: "#f0c36b"
  },
  ownedPanel: {
    backgroundColor: "#dff3e6",
    borderColor: "#91d9ad"
  },
  repeatPanel: {
    backgroundColor: "#dcecff",
    borderColor: "#94bff3"
  },
  resultEyebrow: {
    color: "#51605b",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  resultStatus: {
    color: "#10211b",
    fontSize: 24,
    fontWeight: "900"
  },
  resultName: {
    color: "#10211b",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 2
  },
  resultMeta: {
    color: "#46564f",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3
  },
  resultDetail: {
    color: "#46564f",
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
    color: "#10211b",
    fontSize: 14,
    fontWeight: "900"
  },
  listHeader: {
    marginTop: 12
  },
  sectionTitle: {
    color: "#10211b",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0db",
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
    borderColor: "#d7e0db",
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
    color: "#10211b",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2
  },
  itemTeam: {
    color: "#51605b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 6
  },
  quantityText: {
    color: "#51605b",
    fontSize: 12,
    fontWeight: "900"
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
    color: "#10211b",
    fontSize: 11,
    fontWeight: "900"
  }
});
