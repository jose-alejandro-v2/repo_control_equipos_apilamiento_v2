import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import api, { loadApiUrl, setApiUrl, BUILT_IN_API_URL } from '../api'
import AppButton from '../components/AppButton'
import AppCard from '../components/AppCard'
import AppInput from '../components/AppInput'
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView'
import ErrorBoundary from '../components/ErrorBoundary'
import { theme } from '../theme'

const CHECK_TIMEOUT = 5000

export default function ServerCheckScreen({ onReady }) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const [status, setStatus] = useState('checking')
  const [apiUrl, setApiUrlState] = useState(BUILT_IN_API_URL)
  const [draftUrl, setDraftUrl] = useState('')
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)

  const runCheck = useCallback(async (urlToTest) => {
    setTesting(true)
    setError('')
    try {
      await api.get('/auth/roles', { timeout: CHECK_TIMEOUT, baseURL: urlToTest })
      setStatus('ok')
      if (typeof onReady === 'function') onReady()
    } catch (e) {
      setStatus('fail')
      const msg = e.code === 'ECONNABORTED'
        ? 'Tiempo de espera agotado. Verifica que el servidor esté activo y la IP sea correcta.'
        : (e.message || 'No se pudo conectar con el servidor')
      setError(msg)
    } finally {
      setTesting(false)
    }
  }, [onReady])

  useEffect(() => {
    let active = true
    loadApiUrl().then((stored) => {
      if (!active) return
      const url = stored || BUILT_IN_API_URL
      setApiUrlState(url)
      setDraftUrl(url)
      return runCheck(url)
    })
    return () => { active = false }
  }, [runCheck])

  const handleSaveAndTest = async () => {
    const normalized = String(draftUrl || '').trim().replace(/\/+$/, '')
    if (!normalized) {
      setError('La URL de la API es obligatoria')
      return
    }
    setTesting(true)
    setError('')
    try {
      await setApiUrl(normalized)
      setApiUrlState(normalized)
      await api.get('/auth/roles', { timeout: CHECK_TIMEOUT, baseURL: normalized })
      setStatus('ok')
      if (typeof onReady === 'function') onReady()
    } catch (e) {
      setStatus('fail')
      const msg = e.code === 'ECONNABORTED'
        ? 'Tiempo de espera agotado. Verifica que el servidor esté activo y la IP sea correcta.'
        : (e.message || 'No se pudo conectar con el servidor')
      setError(msg)
    } finally {
      setTesting(false)
    }
  }

  const handleReset = () => {
    setDraftUrl(BUILT_IN_API_URL)
  }

  const handleRetry = () => {
    runCheck(apiUrl)
  }

  const checking = status === 'checking' || testing

  return (
    <ErrorBoundary>
      <KeyboardAwareScrollView
        style={styles.background}
        contentContainerStyle={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <AppCard style={[styles.card, { width: Math.min(width - theme.spacing[10], 420) }]}>
          <Text style={styles.title}>
            Control de Equipos de Apilamiento Packing
          </Text>
          <Text style={styles.subtitle}>
            Configuración del servidor
          </Text>

          {checking && status !== 'ok' ? (
            <View style={styles.messageBlock}>
              <Text style={styles.statusText}>Verificando conexión con el servidor...</Text>
              <Text style={styles.urlText}>{apiUrl}</Text>
            </View>
          ) : null}

          {status === 'ok' ? (
            <View style={styles.messageBlock}>
              <Text style={[styles.statusText, { color: theme.colors.status.success }]}>
                Conexión exitosa. Continuando...
              </Text>
              <Text style={styles.urlText}>{apiUrl}</Text>
            </View>
          ) : null}

          {status === 'fail' ? (
            <View style={styles.failBlock}>
              <View style={styles.errorBanner}>
                <Text style={styles.errorTitle}>No se pudo conectar al servidor</Text>
                <Text style={styles.errorDetail}>{error}</Text>
                <Text style={styles.urlText}>{apiUrl}</Text>
              </View>

              <Text style={styles.helpText}>
                Ingresa la URL del servidor backend (IP de la laptop + puerto 6111 + /api/v1).
                Asegúrate de que el celular esté en la misma red Wi-Fi que la laptop.
              </Text>

              <AppInput
                label="URL de la API"
                value={draftUrl}
                onChangeText={setDraftUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="http://10.13.18.168:6111/api/v1"
                style={styles.input}
              />

              <View style={styles.buttonRow}>
                <AppButton tone="secondary" onPress={handleReset} style={styles.flexButton}>
                  Restablecer
                </AppButton>
                <AppButton onPress={handleSaveAndTest} loading={testing} style={styles.flexButton}>
                  Guardar y probar
                </AppButton>
              </View>

              <AppButton
                tone="text"
                onPress={handleRetry}
                style={styles.retryButton}
                disabled={testing}
              >
                Reintentar con la URL actual
              </AppButton>
            </View>
          ) : null}
        </AppCard>
      </KeyboardAwareScrollView>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: theme.colors.background.page },
  overlay: {
    flexGrow: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.colors.background.backdrop, padding: theme.spacing[6],
  },
  card: {
    padding: theme.spacing[6], borderRadius: theme.radius.lg,
    alignItems: 'center', backgroundColor: theme.colors.background.authOverlay,
    ...theme.shadows.z2,
  },
  title: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: theme.spacing[2], textAlign: 'center' },
  subtitle: { ...theme.typography.body1, color: theme.colors.text.secondary, marginBottom: theme.spacing[6] },
  messageBlock: { width: '100%', alignItems: 'center', marginVertical: theme.spacing[4], gap: theme.spacing[3] },
  failBlock: { width: '100%' },
  statusText: { ...theme.typography.body1, color: theme.colors.text.primary, textAlign: 'center' },
  urlText: { ...theme.typography.caption, color: theme.colors.text.tertiary, textAlign: 'center', marginTop: theme.spacing[1] },
  errorBanner: {
    width: '100%',
    backgroundColor: theme.colors.status.errorBackground,
    borderRadius: theme.radius.sm,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  errorTitle: {
    ...theme.typography.subtitle2,
    color: theme.colors.status.error,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  errorDetail: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  helpText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    lineHeight: 18,
  },
  input: { width: '100%', marginTop: theme.spacing[2] },
  buttonRow: { width: '100%', flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[4] },
  flexButton: { flex: 1, borderRadius: 8 },
  retryButton: { width: '100%', marginTop: theme.spacing[2] },
})
