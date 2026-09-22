import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Text, TextInput, Button, Surface, Divider } from 'react-native-paper'
import { loadApiUrl, setApiUrl, BUILT_IN_API_URL } from '../api'
import ErrorBoundary from '../components/ErrorBoundary'
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView'
import { APP_VERSION } from '../constants/appVersion'
import { theme } from '../theme'

export default function SettingsScreen() {
  const [apiUrl, setApiUrlState] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const url = await loadApiUrl()
      setApiUrlState(url || '')
    })()
  }, [])

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Validación', 'La URL de la API es obligatoria')
      return
    }
    setSaving(true)
    try {
      await setApiUrl(apiUrl.trim())
      Alert.alert('Configuración guardada', 'La URL de la API se ha actualizado. Los cambios se aplicarán en las próximas solicitudes.')
    } catch (e) {
      Alert.alert('Error', e.message || 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setApiUrlState(BUILT_IN_API_URL || '')
  }

  return (
    <ErrorBoundary>
      <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Surface style={styles.card}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Configuración de API</Text>
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={styles.description}>
            Configura la URL del servidor backend. Este valor se almacena de forma segura en el dispositivo.
          </Text>
          <TextInput
            label="URL de la API"
            mode="outlined"
            value={apiUrl}
            onChangeText={setApiUrlState}
            placeholder="http://servidor:6111/api/v1"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={handleReset} style={styles.button}>
              Restablecer
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.button}>
              Guardar
            </Button>
          </View>
        </Surface>

        <Surface style={styles.card}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Información del Sistema</Text>
          <Divider style={styles.divider} />
          <View style={styles.row}>
            <Text variant="bodySmall" style={styles.label}>App</Text>
            <Text variant="bodyMedium" style={styles.value}>Control Equipos Apilamiento</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" style={styles.label}>Versión</Text>
            <Text variant="bodyMedium" style={styles.value}>{APP_VERSION}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" style={styles.label}>Plataforma</Text>
            <Text variant="bodyMedium" style={styles.value}>Android</Text>
          </View>
        </Surface>
      </KeyboardAwareScrollView>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.page },
  content: { padding: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  sectionTitle: { fontWeight: 700, marginBottom: 8 },
  divider: { marginBottom: 12 },
  description: { opacity: 0.6, marginBottom: 16, lineHeight: 18 },
  input: { marginBottom: 16 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, borderRadius: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { opacity: 0.6, flex: 1 },
  value: { fontWeight: 600, flex: 1, textAlign: 'right' },
})
