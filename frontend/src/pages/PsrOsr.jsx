import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import api from '../api'
import DataTable from '../components/DataTable'

const DIAS_POR_MES = 30.44

function calcularMeses(inicio, fin) {
  if (!inicio || !fin) return ''
  const d1 = new Date(inicio + 'T00:00:00')
  const d2 = new Date(fin + 'T00:00:00')
  const diffDays = (d2 - d1) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return ''
  return (diffDays / DIAS_POR_MES).toFixed(2)
}

export default function PsrOsr() {
  const [items, setItems] = useState([])
  const [campanas, setCampanas] = useState([])
  const [sedes, setSedes] = useState([])
  const [motivos, setMotivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    campanaId: '', sedeId: '', numeroPsr: '', fechaPsr: '',
    motivoId: '', fechaInicioUso: '', fechaFinUso: '', observaciones: '',
  })
  const [saving, setSaving] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  const todayStr = (() => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  })()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [psrData, campanasData, sedesData, motivosData] = await Promise.all([
        api.get('/psr').then((r) => r.data || r),
        api.get('/campanas').then((r) => r.data || r),
        api.get('/sedes').then((r) => r.data || r),
        api.get('/motivos-psr').then((r) => r.data || r),
      ])
      psrData.sort((a, b) => a.id - b.id)
      setItems(psrData)
      setCampanas(Array.isArray(campanasData) ? campanasData : [])
      setSedes(Array.isArray(sedesData) ? sedesData : [])
      setMotivos(Array.isArray(motivosData) ? motivosData : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const detectCurrentCampana = () => {
    const now = new Date()
    const dateMatch = campanas.filter((c) => {
      if (!c.estadoActivo) return false
      if (!c.fechaInicio && !c.fechaFin) return true
      const inicio = c.fechaInicio ? new Date(c.fechaInicio) : null
      const fin = c.fechaFin ? new Date(c.fechaFin) : null
      if (inicio && fin) return now >= inicio && now <= fin
      if (inicio) return now >= inicio
      if (fin) return now <= fin
      return true
    })
    if (dateMatch.length > 0) return dateMatch[0].id
    const byRecent = [...campanas].filter((c) => c.estadoActivo).sort((a, b) => {
      const aFin = a.fechaFin ? new Date(a.fechaFin) : new Date(0)
      const bFin = b.fechaFin ? new Date(b.fechaFin) : new Date(0)
      return bFin - aFin
    })
    return byRecent.length > 0 ? byRecent[0].id : ''
  }

  const openCreate = () => {
    setEditing(null)
    const detectedCampanaId = detectCurrentCampana()
    setFormData({
      campanaId: detectedCampanaId,
      sedeId: '',
      numeroPsr: '',
      fechaPsr: todayStr,
      motivoId: '',
      fechaInicioUso: '',
      fechaFinUso: '',
      observaciones: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormData({
      campanaId: item.campanaId || '',
      sedeId: item.sedeId || '',
      numeroPsr: item.numeroPsr || '',
      fechaPsr: item.fechaPsr ? item.fechaPsr.slice(0, 10) : '',
      motivoId: item.motivoId || '',
      fechaInicioUso: item.fechaInicioUso ? item.fechaInicioUso.slice(0, 10) : '',
      fechaFinUso: item.fechaFinUso ? item.fechaFinUso.slice(0, 10) : '',
      observaciones: item.observaciones || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (saving) return
    if (!formData.campanaId) { alert('Seleccione una campaña'); return }
    if (!formData.sedeId) { alert('Seleccione una sede'); return }
    if (!formData.numeroPsr.trim()) { alert('Ingrese el número de PSR'); return }
    if (!formData.fechaPsr) { alert('Ingrese la fecha de PSR'); return }
    if (!formData.motivoId) { alert('Seleccione un motivo'); return }
    if (!formData.fechaInicioUso) { alert('Ingrese la fecha de inicio de uso'); return }
    if (!formData.fechaFinUso) { alert('Ingrese la fecha de fin de uso'); return }
    setSaving(true)
    try {
      const payload = {
        campanaId: Number(formData.campanaId),
        sedeId: Number(formData.sedeId),
        numeroPsr: formData.numeroPsr.trim(),
        fechaPsr: formData.fechaPsr,
        motivoId: Number(formData.motivoId),
        fechaInicioUso: formData.fechaInicioUso,
        fechaFinUso: formData.fechaFinUso,
        observaciones: formData.observaciones || null,
      }
      if (editing) {
        await api.put(`/psr/${editing.id}`, payload)
      } else {
        await api.post('/psr', payload)
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    } finally {
      setSaving(false)
    }
  }

  const openDelete = (item) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    try {
      await api.delete(`/psr/${itemToDelete.id}`)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE')
  }

  const getCampanaName = (id) => {
    const c = campanas.find((x) => x.id === id)
    return c ? c.nombre : `ID ${id}`
  }

  const getSedeName = (id) => {
    const s = sedes.find((x) => x.id === id)
    return s ? `${s.nombre} (${s.codigo})` : `ID ${id}`
  }

  const getMotivoName = (id) => {
    const m = motivos.find((x) => x.id === id)
    return m ? m.nombreCorto : `ID ${id}`
  }

  const mesesCalculados = calcularMeses(formData.fechaInicioUso, formData.fechaFinUso)

  const columns = [
    { field: 'id', label: 'ID' },
    { field: 'numeroPsr', label: 'N° PSR' },
    {
      field: 'fechaPsr', label: 'Fecha PSR',
      render: (row) => formatDate(row.fechaPsr),
    },
    {
      field: 'motivoId', label: 'Motivo',
      render: (row) => getMotivoName(row.motivoId),
    },
    {
      field: 'fechaInicioUso', label: 'Inicio uso',
      render: (row) => formatDate(row.fechaInicioUso),
    },
    {
      field: 'fechaFinUso', label: 'Fin uso',
      render: (row) => formatDate(row.fechaFinUso),
    },
    {
      field: 'meses', label: 'Meses',
      render: (row) => row.meses || '-',
    },
    {
      field: 'campanaId', label: 'Campaña',
      render: (row) => getCampanaName(row.campanaId),
    },
    {
      field: 'sedeId', label: 'Sede',
      render: (row) => getSedeName(row.sedeId),
    },
  ]

  const renderActions = (item) => (
    <>
      <Tooltip title="Editar">
        <IconButton size="small" onClick={() => openEdit(item)}>
          <EditIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Eliminar">
        <IconButton size="small" onClick={() => openDelete(item)}>
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      </Tooltip>
    </>
  )

  const renderCard = (item) => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.numeroPsr}</Typography>
          <Typography variant="caption" color="text.secondary">Motivo: {getMotivoName(item.motivoId)}</Typography>
        </Box>
        <Chip label={item.estadoActivo ? 'ACTIVO' : 'INACTIVO'} size="small"
          color={item.estadoActivo ? 'success' : 'default'} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          Campaña: {getCampanaName(item.campanaId)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Sede: {getSedeName(item.sedeId)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Fecha PSR: {formatDate(item.fechaPsr)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Inicio: {formatDate(item.fechaInicioUso)} - Fin: {formatDate(item.fechaFinUso)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Meses: {item.meses || '-'}
        </Typography>
      </Box>
      {item.observaciones ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
          {item.observaciones}
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
        {renderActions(item)}
      </Box>
    </Box>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: 20, md: 24 } }}>PSR</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
          Nuevo PSR
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        emptyMessage="No hay PSR registrados"
        actions={renderActions}
        renderCard={renderCard}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar PSR' : 'Nuevo PSR'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small" required disabled={catalogLoading}>
              <InputLabel>Campaña</InputLabel>
              <Select
                value={formData.campanaId}
                label="Campaña"
                onChange={(e) => setFormData({ ...formData, campanaId: e.target.value })}
              >
                {campanas.filter((c) => c.estadoActivo !== false).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre} {c.codigo ? `(${c.codigo})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" required>
              <InputLabel>Sede</InputLabel>
              <Select
                value={formData.sedeId}
                label="Sede"
                onChange={(e) => setFormData({ ...formData, sedeId: e.target.value })}
              >
                {sedes.filter((s) => s.estadoActivo !== false).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nombre} ({s.codigo})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Número PSR" value={formData.numeroPsr}
              onChange={(e) => setFormData({ ...formData, numeroPsr: e.target.value })}
              required fullWidth size="small" />
            <TextField label="Fecha PSR" type="date" value={formData.fechaPsr}
              onChange={(e) => setFormData({ ...formData, fechaPsr: e.target.value })}
              required fullWidth size="small" InputLabelProps={{ shrink: true }} />

            <FormControl fullWidth size="small" required disabled={catalogLoading}>
              <InputLabel>Motivo</InputLabel>
              <Select
                value={formData.motivoId}
                label="Motivo"
                onChange={(e) => setFormData({ ...formData, motivoId: e.target.value })}
              >
                {motivos.filter((m) => m.estadoActivo !== false).map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nombreCorto}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Fecha inicio uso" type="date" value={formData.fechaInicioUso}
              onChange={(e) => setFormData({ ...formData, fechaInicioUso: e.target.value })}
              required fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Fecha fin uso" type="date" value={formData.fechaFinUso}
              onChange={(e) => setFormData({ ...formData, fechaFinUso: e.target.value })}
              required fullWidth size="small" InputLabelProps={{ shrink: true }} />

            <TextField label="Meses" value={mesesCalculados}
              fullWidth size="small" InputProps={{ readOnly: true }}
              helperText="Calculado automáticamente desde las fechas de uso" />

            <TextField label="Observaciones" value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              fullWidth size="small" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {editing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de eliminar PSR <strong>{itemToDelete?.numeroPsr}</strong>?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setItemToDelete(null) }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}