import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Keyboard, Platform, StyleSheet, View } from 'react-native'
import { Divider, HelperText, SegmentedButtons, Text, TouchableRipple } from 'react-native-paper'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../api'
import { useAuth } from '../AuthContext'
import AppButton from '../components/AppButton'
import AppCard from '../components/AppCard'
import AppInput from '../components/AppInput'
import AppSelect from '../components/AppSelect'
import AppTextArea from '../components/AppTextArea'
import ErrorBoundary from '../components/ErrorBoundary'
import ErrorState from '../components/ErrorState'
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView'
import LoadingScreen from '../components/LoadingScreen'
import { theme } from '../theme'
import {
  calcularMeses,
  extractApiList,
  formatApiDate,
  formatDisplayDate,
  getActiveCampanaId,
  isDateBefore,
  isValidApiDate,
  parseApiDate,
} from '../utils/psrForm'
import { hasPsrAdminRole } from '../utils/roles'

function DatePickerField({ label, value, onChange, error, readOnly = false }) {
  const [show, setShow] = useState(false)
  const processedRef = useRef(false)

  const handleChange = useCallback((event, selectedDate) => {
    if (event.type === 'dismissed') return
    if (selectedDate && !processedRef.current) {
      processedRef.current = true
      onChange(formatApiDate(selectedDate))
      setShow(false)
    }
  }, [onChange])

  const handleOpen = useCallback(() => {
    processedRef.current = false
    if (Keyboard?.dismiss) {
      try { Keyboard.dismiss() } catch (_) {}
    }
    setShow(true)
  }, [])

  return (
    <View>
      <TouchableRipple
        onPress={readOnly ? undefined : handleOpen}
        disabled={readOnly}
        accessibilityRole="button"
        accessibilityLabel={`Seleccionar ${label}`}
      >
        <View pointerEvents="none">
          <AppInput
            label={label}
            value={formatDisplayDate(value)}
            placeholder="dd/mm/yyyy hh:mm"
            editable={false}
            errorMessage={error}
          />
        </View>
      </TouchableRipple>
      {show ? (
        <DateTimePicker
          value={parseApiDate(value)}
          mode="datetime"
          display={Platform.OS === 'android' ? 'default' : 'spinner'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  )
}

const requiredDate = message => z.string()
  .min(1, message)
  .refine(isValidApiDate, 'Seleccione una fecha y hora válida')

const schema = z.object({
  campanaId: z.string().min(1, 'Seleccione una campaña'),
  sedeId: z.string().min(1, 'Seleccione una sede'),
  numeroPsr: z.string().trim().min(1, 'Ingrese el número de PSR'),
  fechaPsr: requiredDate('Seleccione la fecha de PSR'),
  motivoId: z.string().min(1, 'Seleccione un motivo'),
  fechaInicioUso: requiredDate('Seleccione la fecha de inicio'),
  fechaFinUso: requiredDate('Seleccione la fecha de fin'),
  observaciones: z.string().optional(),
}).superRefine((data, context) => {
  if (isDateBefore(data.fechaFinUso, data.fechaInicioUso)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fechaFinUso'],
      message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
    })
  }
})

const osrSchema = z.object({
  numeroOsr: z.string().trim().min(1, 'Ingrese el número de OSR'),
  costoUnitario: z.string()
    .trim()
    .min(1, 'Ingrese el costo unitario')
    .regex(/^\d+([.,]\d{1,2})?$/, 'Ingrese un costo válido con hasta dos decimales')
    .refine(value => Number(value.replace(',', '.')) > 0, 'El costo debe ser mayor a cero'),
  tipoMoneda: z.enum(['PEN', 'USD', 'EUR'], {
    required_error: 'Seleccione el tipo de moneda',
  }),
})

function mapToSelectOptions(items, labelFn, activeOnly = true) {
  return items
    .filter(item => !activeOnly || item.estadoActivo !== false)
    .map(item => ({
      value: String(item.id),
      label: labelFn(item),
    }))
}

function getRequestError(error, fallback) {
  return error.response?.data?.message
    || error.response?.data?.error
    || error.message
    || fallback
}

export default function CreatePsrScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { user } = useAuth()
  const editing = route.params?.psr || null
  const editingOsr = route.params?.osr || null
  const isOsrMode = route.params?.mode === 'osr'
  const isEditOsrMode = route.params?.mode === 'editOsr'
  const isEditing = Boolean(editing)
  const hasExistingOsr = isEditing && Boolean(editing?.osr || (Array.isArray(editing?.osrs) && editing.osrs.length > 0))
  const showOsrFields = isOsrMode || isEditOsrMode || hasExistingOsr
  const canManage = hasPsrAdminRole(user)
  const formSchema = isOsrMode || isEditOsrMode
    ? osrSchema
    : hasExistingOsr
      ? schema.and(osrSchema)
      : schema

  const [campanas, setCampanas] = useState([])
  const [sedes, setSedes] = useState([])
  const [motivos, setMotivos] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const todayStr = useMemo(() => formatApiDate(new Date()), [])

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campanaId: editing?.campanaId != null ? String(editing.campanaId) : '',
      sedeId: editing?.sedeId != null ? String(editing.sedeId) : '',
      numeroPsr: editing?.numeroPsr || '',
      fechaPsr: editing?.fechaPsr || todayStr,
      motivoId: editing?.motivoId != null ? String(editing.motivoId) : '',
      fechaInicioUso: editing?.fechaInicioUso || '',
      fechaFinUso: editing?.fechaFinUso || '',
      observaciones: editing?.observaciones || '',
      numeroOsr: isEditOsrMode
        ? editingOsr?.numeroOsr || ''
        : isOsrMode
          ? ''
          : editing?.osr?.numeroOsr || editing?.osrs?.[0]?.numeroOsr || '',
      costoUnitario: (isEditOsrMode ? editingOsr?.costoUnitario : isOsrMode ? null : editing?.osr?.costoUnitario ?? editing?.osrs?.[0]?.costoUnitario) != null
        ? String(isEditOsrMode ? editingOsr?.costoUnitario : editing?.osr?.costoUnitario ?? editing?.osrs?.[0]?.costoUnitario)
        : '',
      tipoMoneda: (isEditOsrMode ? editingOsr?.tipoMoneda : isOsrMode ? null : editing?.osr?.tipoMoneda || editing?.osrs?.[0]?.tipoMoneda) || 'PEN',
    },
  })

  const loadCatalogs = useCallback(async (silent = false) => {
    if (!silent) {
      setCatalogLoading(true)
      setCatalogError('')
    }

    try {
      const [campanasResponse, sedesResponse, motivosResponse] = await Promise.all([
        api.get('/campanas'),
        api.get('/sedes'),
        api.get('/motivos-psr'),
      ])

      const campanasList = extractApiList(campanasResponse, 'campañas')
      const sedesList = extractApiList(sedesResponse, 'sedes')
      const motivosList = extractApiList(motivosResponse, 'motivos PSR')

      if (!silent) {
        if (!isEditing && !campanasList.some(item => item.estadoActivo === true)) {
          throw new Error('No existe una campaña activa para registrar el PSR')
        }
        if (sedesList.length === 0) {
          throw new Error('No existen sedes registradas')
        }
        if (!motivosList.some(item => item.estadoActivo !== false)) {
          throw new Error('No existen motivos PSR activos')
        }
      }

      setCampanas(campanasList)
      setSedes(sedesList)
      setMotivos(motivosList)
    } catch (error) {
      if (!silent) setCatalogError(getRequestError(error, 'No se pudieron cargar los catálogos'))
    } finally {
      if (!silent) setCatalogLoading(false)
    }
  }, [isEditing])

  const loadedRef = useRef(false)
  useFocusEffect(useCallback(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      loadCatalogs()
    } else {
      loadCatalogs(true)
    }
  }, [loadCatalogs]))

  useEffect(() => {
    if (!isEditing && campanas.length > 0) {
      setValue('campanaId', getActiveCampanaId(campanas), {
        shouldDirty: false,
        shouldValidate: true,
      })
    }
  }, [campanas, isEditing, setValue])

  const campanaOptions = useMemo(
    () => mapToSelectOptions(
      campanas,
      item => `${item.nombre}${item.codigo ? ` (${item.codigo})` : ''}${item.estadoActivo === false ? ' - Inactiva' : ''}`,
      !isEditing,
    ),
    [campanas, isEditing],
  )

  const sedeOptions = useMemo(
    () => mapToSelectOptions(
      sedes,
      item => `${item.nombre}${item.codigo ? ` (${item.codigo})` : ''}`,
      true,
    ),
    [sedes],
  )

  const motivoOptions = useMemo(
    () => mapToSelectOptions(motivos, item => item.nombreCorto || item.nombre),
    [motivos],
  )

  const fechaInicioUso = watch('fechaInicioUso')
  const fechaFinUso = watch('fechaFinUso')
  const mesesCalculados = calcularMeses(fechaInicioUso, fechaFinUso)

  const onSubmit = async formData => {
    if (submitting) return
    setSubmitting(true)

    try {
      if (isEditOsrMode) {
        await api.put(`/osr/${editingOsr.id}`, {
          costoUnitario: Number(formData.costoUnitario.replace(',', '.')),
          tipoMoneda: formData.tipoMoneda,
        })
        if (typeof navigation.popTo === 'function') {
          navigation.popTo('PsrOsr')
        } else {
          navigation.navigate('PsrOsr')
        }
        Alert.alert('Éxito', 'OSR actualizada correctamente')
        return
      }
      if (isOsrMode) {
        await api.post('/osr', {
          psrId: editing.id,
          numeroOsr: formData.numeroOsr.trim().toUpperCase(),
          costoUnitario: Number(formData.costoUnitario.replace(',', '.')),
          tipoMoneda: formData.tipoMoneda,
        })

        if (typeof navigation.popTo === 'function') {
          navigation.popTo('PsrOsr')
        } else {
          navigation.navigate('PsrOsr')
        }
        Alert.alert('Éxito', 'OSR creada correctamente')
        return
      }

      const payload = {
        campanaId: Number(formData.campanaId),
        sedeId: Number(formData.sedeId),
        numeroPsr: formData.numeroPsr.trim().toUpperCase(),
        fechaPsr: formData.fechaPsr,
        motivoId: Number(formData.motivoId),
        fechaInicioUso: formData.fechaInicioUso,
        fechaFinUso: formData.fechaFinUso,
        observaciones: formData.observaciones?.trim() || null,
      }

      if (hasExistingOsr) {
        payload.osr = {
          costoUnitario: Number(formData.costoUnitario.replace(',', '.')),
          tipoMoneda: formData.tipoMoneda,
        }
      }

      if (isEditing) {
        await api.put(`/psr/${editing.id}`, payload)
      } else {
        await api.post('/psr', payload)
      }

      if (typeof navigation.popTo === 'function') {
        navigation.popTo('PsrOsr')
      } else {
        navigation.navigate('PsrOsr')
      }
      Alert.alert('Éxito', `PSR ${isEditing ? 'actualizado' : 'creado'} correctamente`)
    } catch (error) {
      Alert.alert(
        'Error',
        getRequestError(error, `No se pudo ${isEditing ? 'actualizar' : 'crear'} el PSR`),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (catalogLoading) {
    return <LoadingScreen message="Cargando catálogos..." />
  }

  if ((isEditing || isOsrMode || isEditOsrMode) && !canManage) {
    return (
      <ErrorState
        title="Acceso restringido"
        message="Solo los perfiles Admin y Super Admin pueden modificar PSR o agregar OSR."
      />
    )
  }

  if ((isOsrMode || isEditOsrMode) && !editing) {
    return (
      <ErrorState
        title="PSR no disponible"
        message="No se recibió el PSR al que se asociará la OSR."
      />
    )
  }

  if (catalogError) {
    return (
      <ErrorState
        title="No se pudieron cargar los catálogos"
        message={catalogError}
        onRetry={() => loadCatalogs()}
      />
    )
  }

  return (
    <ErrorBoundary>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppCard style={styles.formCard}>
          <Text variant="titleMedium" style={styles.title}>
            {isEditOsrMode ? 'Editar OSR' : isOsrMode ? 'Nueva OSR' : isEditing ? 'Editar PSR' : 'Nuevo PSR'}
          </Text>

          <Controller
            control={control}
            name="campanaId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.input}>
                <AppSelect
                  label="Campaña"
                  value={value}
                  options={campanaOptions}
                  onChange={onChange}
                  error={errors.campanaId?.message}
                  disabled={isOsrMode || isEditOsrMode}
                  onOpen={() => loadCatalogs(true)}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="sedeId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.input}>
                <AppSelect
                  label="Sede"
                  value={value}
                  options={sedeOptions}
                  onChange={onChange}
                  error={errors.sedeId?.message}
                  disabled={isOsrMode || isEditOsrMode}
                  onOpen={() => loadCatalogs(true)}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="numeroPsr"
            render={({ field: { onBlur, onChange, value } }) => (
              <AppInput
                label="Número PSR"
                value={value}
                onBlur={onBlur}
                onChangeText={text => onChange(text.toUpperCase())}
                errorMessage={errors.numeroPsr?.message}
                editable={!isEditing && !isOsrMode && !isEditOsrMode}
                autoCapitalize="characters"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="fechaPsr"
            render={({ field: { onChange, value } }) => (
              <View style={styles.input}>
                <DatePickerField
                  label="Fecha PSR"
                  value={value}
                  onChange={onChange}
                  error={errors.fechaPsr?.message}
                  readOnly={isOsrMode || isEditOsrMode}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="motivoId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.input}>
                <AppSelect
                  label="Motivo"
                  value={value}
                  options={motivoOptions}
                  onChange={onChange}
                  error={errors.motivoId?.message}
                  disabled={isOsrMode || isEditOsrMode}
                  onOpen={() => loadCatalogs(true)}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="fechaInicioUso"
            render={({ field: { onChange, value } }) => (
              <View style={styles.input}>
                <DatePickerField
                  label="Fecha inicio de uso"
                  value={value}
                  onChange={onChange}
                  error={errors.fechaInicioUso?.message}
                  readOnly={isOsrMode || isEditOsrMode}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="fechaFinUso"
            render={({ field: { onChange, value } }) => (
              <View style={styles.input}>
                <DatePickerField
                  label="Fecha fin de uso"
                  value={value}
                  onChange={onChange}
                  error={errors.fechaFinUso?.message}
                  readOnly={isOsrMode || isEditOsrMode}
                />
              </View>
            )}
          />

          <View style={styles.mesesContainer}>
            <Text style={styles.mesesLabel}>Meses calculados:</Text>
            <Text style={styles.mesesValue}>{mesesCalculados || '-'}</Text>
            <HelperText type="info" visible>
              Calculado automáticamente desde las fechas de uso
            </HelperText>
          </View>

          <Controller
            control={control}
            name="observaciones"
            render={({ field: { onBlur, onChange, value } }) => (
              <AppTextArea
                label="Observaciones"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorMessage={errors.observaciones?.message}
                editable={!isOsrMode && !isEditOsrMode}
                style={styles.input}
              />
            )}
          />

          {showOsrFields ? (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Datos de la OSR
              </Text>

              <Controller
                control={control}
                name="numeroOsr"
                render={({ field: { onBlur, onChange, value } }) => (
                  <AppInput
                    label="Número OSR"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    errorMessage={errors.numeroOsr?.message}
                    autoCapitalize="characters"
                    editable={isOsrMode}
                    style={styles.input}
                  />
                )}
              />

              <Controller
                control={control}
                name="costoUnitario"
                render={({ field: { onBlur, onChange, value } }) => (
                  <AppInput
                    label="Costo unitario"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    errorMessage={errors.costoUnitario?.message}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                )}
              />

              <Controller
                control={control}
                name="tipoMoneda"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.currencyContainer}>
                    <Text style={styles.currencyLabel}>Tipo de moneda</Text>
                    <SegmentedButtons
                      value={value}
                      onValueChange={onChange}
                      buttons={[
                        { value: 'PEN', label: 'PEN' },
                        { value: 'USD', label: 'USD' },
                        { value: 'EUR', label: 'EUR' },
                      ]}
                    />
                    {errors.tipoMoneda?.message ? (
                      <HelperText type="error" visible>
                        {errors.tipoMoneda.message}
                      </HelperText>
                    ) : null}
                  </View>
                )}
              />
            </>
          ) : null}

          <AppButton
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
            loading={submitting}
            style={styles.button}
            fullWidth
          >
            {isEditOsrMode ? 'Actualizar OSR' : isOsrMode ? 'Guardar OSR' : isEditing ? 'Actualizar PSR' : 'Crear PSR'}
          </AppButton>
        </AppCard>
      </KeyboardAwareScrollView>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.page,
  },
  content: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  formCard: {
    padding: theme.spacing[6],
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[5],
  },
  input: {
    marginBottom: theme.spacing[3],
  },
  mesesContainer: {
    marginBottom: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: theme.colors.background.neutral,
    borderRadius: theme.radius.sm,
  },
  mesesLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  mesesValue: {
    ...theme.typography.subtitle,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[1],
  },
  button: {
    marginTop: theme.spacing[2],
  },
  divider: {
    marginVertical: theme.spacing[5],
  },
  sectionTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  currencyContainer: {
    marginBottom: theme.spacing[4],
  },
  currencyLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
})
