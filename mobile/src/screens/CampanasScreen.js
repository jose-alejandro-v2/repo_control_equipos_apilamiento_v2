import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react'
import { View, FlatList, RefreshControl, StyleSheet, Alert, ScrollView, Keyboard } from 'react-native'
import { Card, Text, Button, Searchbar, Chip, IconButton, Dialog, TouchableRipple } from 'react-native-paper'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import api from '../api'
import LoadingScreen from '../components/LoadingScreen'
import EmptyState from '../components/EmptyState'
import ErrorBoundary from '../components/ErrorBoundary'
import AppInput from '../components/AppInput'
import AppButton from '../components/AppButton'
import { useAuth } from '../AuthContext'
import { isAdminOrSuperAdmin } from '../utils/roles'
import { formatApiDate, formatDisplayDate, parseApiDate } from '../utils/psrForm'
import { theme } from '../theme'

const statusColor = (estado) => {
  if (!estado) return theme.colors.status.neutral
  const e = estado.toLowerCase()
  if (e === 'activo') return theme.colors.status.success
  if (e === 'cerrado') return theme.colors.status.error
  return theme.colors.status.warning
}

function DateField({ label, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <View>
      <TouchableRipple onPress={() => setShow(true)} accessibilityRole="button" accessibilityLabel={`Seleccionar ${label}`}>
        <View pointerEvents="none">
          <AppInput label={label} value={formatDisplayDate(value)} placeholder="dd/mm/yyyy" editable={false} />
        </View>
      </TouchableRipple>
      {show ? (
        <DateTimePicker
          value={parseApiDate(value)}
          mode="date"
          display="default"
          onChange={(e, d) => { setShow(false); if (e.type !== 'dismissed' && d) onChange(formatApiDate(d)) }}
        />
      ) : null}
    </View>
  )
}

export default function CampanasScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const canEdit = isAdminOrSuperAdmin(user)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', codigo: '', fechaInicio: '', fechaFin: '' })
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates?.height || 0))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canEdit ? () => (
        <IconButton icon="plus" iconColor={theme.colors.text.inverse} size={24} onPress={openCreate} accessibilityLabel="Nueva campaña" />
      ) : undefined,
    })
  }, [navigation, canEdit])

  const fetch = useCallback(async () => {
    try {
      setError(null)
      const { data } = await api.get('/campanas')
      const list = data?.data || data || []
      setItems(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Error al cargar campañas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { setLoading(true); fetch() }, [fetch]))

  const onRefresh = useCallback(() => { setRefreshing(true); fetch() }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setFormData({ nombre: '', codigo: '', fechaInicio: '', fechaFin: '' })
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormData({
      nombre: item.nombre || '',
      codigo: item.codigo || '',
      fechaInicio: item.fechaInicio ? formatApiDate(new Date(item.fechaInicio)) : '',
      fechaFin: item.fechaFin ? formatApiDate(new Date(item.fechaFin)) : '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.nombre?.trim()) {
      Alert.alert('Validación', 'El campo "Nombre" es obligatorio')
      return
    }
    if (!formData.fechaInicio) {
      Alert.alert('Validación', 'La fecha de inicio es obligatoria')
      return
    }
    if (!formData.fechaFin) {
      Alert.alert('Validación', 'La fecha de fin es obligatoria')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/campanas/${editing.id}`, { nombre: formData.nombre, codigo: formData.codigo, fechaInicio: formData.fechaInicio || null, fechaFin: formData.fechaFin || null })
      } else {
        await api.post('/campanas', { nombre: formData.nombre, codigo: formData.codigo, fechaInicio: formData.fechaInicio, fechaFin: formData.fechaFin })
      }
      setShowForm(false)
      fetch()
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleActivar = (item) => {
    Alert.alert('Activar', `¿Activar campaña "${item.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Activar', onPress: async () => { try { await api.post(`/campanas/${item.id}/activar`); fetch() } catch (e) { Alert.alert('Error', e.response?.data?.error || e.message) } } },
    ])
  }

  const handleCerrar = (item) => {
    Alert.alert('Cerrar', `¿Cerrar campaña "${item.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar', style: 'destructive', onPress: async () => { try { await api.post(`/campanas/${item.id}/cerrar`); fetch() } catch (e) { Alert.alert('Error', e.response?.data?.error || e.message) } } },
    ])
  }

  const handleDelete = (item) => {
    Alert.alert('Eliminar', `¿Eliminar campaña "${item.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.delete(`/campanas/${item.id}`); fetch() } catch (e) { Alert.alert('Error', e.response?.data?.error || e.message) } } },
    ])
  }

  const filtered = items.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (item.nombre || '').toLowerCase().includes(q) || (item.codigo || '').toLowerCase().includes(q)
  })

  const renderItem = ({ item }) => (
    <Card style={styles.card} onPress={canEdit ? () => openEdit(item) : undefined}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={styles.cardTitle}>{item.nombre || 'Sin nombre'}</Text>
            {item.codigo ? <Text variant="bodySmall" style={styles.cardMeta}>Código: {item.codigo}</Text> : null}
          </View>
          <Chip mode="flat" textStyle={{ color: theme.colors.text.inverse, fontSize: 11, fontWeight: 600 }}
            style={{ backgroundColor: statusColor(item.estado) }}
          >
            {item.estado || 'DESCONOCIDO'}
          </Chip>
        </View>
        <View style={styles.dates}>
          <Text variant="bodySmall" style={styles.dateText}>
            Inicio: {item.fechaInicio ? new Date(item.fechaInicio).toLocaleDateString() : '-'}
          </Text>
          <Text variant="bodySmall" style={styles.dateText}>
            Fin: {item.fechaFin ? new Date(item.fechaFin).toLocaleDateString() : '-'}
          </Text>
        </View>
        {canEdit ? (
          <View style={styles.actions}>
            {(item.estado === 'ACTIVO' || item.estado === 'activo') ? (
              <Button mode="outlined" textColor={theme.colors.status.error} compact onPress={() => handleCerrar(item)}>
                Cerrar
              </Button>
            ) : (
              <Button mode="outlined" textColor={theme.colors.status.success} compact onPress={() => handleActivar(item)}>
                Activar
              </Button>
            )}
            <IconButton icon="delete" iconColor={theme.colors.status.error} size={20} onPress={() => handleDelete(item)} />
          </View>
        ) : null}
      </Card.Content>
    </Card>
  )

  if (loading && items.length === 0) return <LoadingScreen />

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Searchbar placeholder="Buscar por nombre o código" onChangeText={setSearch} value={search} style={styles.searchbar} />
        {error ? (
          <EmptyState icon="alert" title="Error" subtitle={error} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.action.primary]} />}
            ListEmptyComponent={<EmptyState icon="calendar" title={search ? 'Sin resultados' : 'No hay campañas'} subtitle={search ? 'Intenta con otro término' : 'Aún no se han registrado campañas'} />}
          />
        )}
        <Dialog visible={showForm} onDismiss={() => setShowForm(false)} style={styles.dialog}>
          <Dialog.Title>{editing ? 'Editar campaña' : 'Nueva campaña'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: keyboardHeight }}
            >
              <AppInput label="Nombre" value={formData.nombre} onChangeText={(v) => setFormData(prev => ({ ...prev, nombre: v }))} style={styles.dialogInput} />
              <AppInput label="Código" value={formData.codigo} onChangeText={(v) => setFormData(prev => ({ ...prev, codigo: v }))} style={styles.dialogInput} />
              <DateField label="Fecha de inicio" value={formData.fechaInicio} onChange={(v) => setFormData(prev => ({ ...prev, fechaInicio: v }))} />
              <DateField label="Fecha de fin" value={formData.fechaFin} onChange={(v) => setFormData(prev => ({ ...prev, fechaFin: v }))} />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <AppButton variant="text" onPress={() => setShowForm(false)}>Cancelar</AppButton>
            <AppButton variant="primary" onPress={handleSave} disabled={saving} loading={saving}>{editing ? 'Actualizar' : 'Crear'}</AppButton>
          </Dialog.Actions>
        </Dialog>
      </View>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.page },
  searchbar: { margin: 16, borderRadius: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: { borderRadius: 12, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardInfo: { flex: 1, marginRight: 8 },
  cardTitle: { fontWeight: 700 },
  cardMeta: { opacity: 0.5, marginTop: 2 },
  dates: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  dateText: { opacity: 0.6, fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  dialog: { maxHeight: '80%' },
  scrollView: { maxHeight: 320 },
  dialogInput: { marginBottom: theme.spacing[3] },
})
