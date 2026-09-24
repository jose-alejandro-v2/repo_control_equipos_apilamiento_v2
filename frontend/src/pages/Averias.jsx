import { useState, useEffect, useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import ImageListItemBar from '@mui/material/ImageListItemBar'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import api from '../api'
import DataTable from '../components/DataTable'

export default function Averias() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ equipoId: '', descripcionFalla: '', horometro: '', fechaHoraAveria: '' })
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [evidenceAveriaId, setEvidenceAveriaId] = useState(null)
  const [evidenceItems, setEvidenceItems] = useState([])
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [evidenceError, setEvidenceError] = useState(null)
  const [evidenceImages, setEvidenceImages] = useState({})
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerUrl, setViewerUrl] = useState(null)
  const evidenceUrls = useRef([])

  const revokeUrls = () => { evidenceUrls.current.forEach(u => URL.revokeObjectURL(u)); evidenceUrls.current = [] }

  const loadEvidence = async (averiaId) => {
    setEvidenceAveriaId(averiaId)
    setEvidenceOpen(true)
    setEvidenceLoading(true)
    setEvidenceError(null)
    setEvidenceImages({})
    revokeUrls()
    try {
      const res = await api.get(`/averias/${averiaId}/evidencias`)
      const list = res.data?.data || res.data || []
      setEvidenceItems(list)
      const images = {}
      for (const item of list) {
        try {
          const imgRes = await api.get(`/averias/${averiaId}/evidencias/${item.numeroFoto}/archivo`, {
            responseType: 'blob',
          })
          const blob = imgRes.data instanceof Blob ? imgRes.data : new Blob([imgRes.data], { type: item.tipoMime || 'image/jpeg' })
          const url = URL.createObjectURL(blob)
          evidenceUrls.current.push(url)
          images[item.numeroFoto] = url
        } catch { /* skip failed image */ }
      }
      setEvidenceImages(images)
    } catch (err) {
      setEvidenceError(err.response?.data?.error || err.message || 'Error al cargar evidencias')
    } finally {
      setEvidenceLoading(false)
    }
  }

  const closeEvidence = () => {
    setEvidenceOpen(false)
    revokeUrls()
    setEvidenceImages({})
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get('/averias').then((r) => r.data || r)
      data.sort((a, b) => a.id - b.id)
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openCreate = () => {
    setEditing(null)
    setFormData({ equipoId: '', descripcionFalla: '', horometro: '', fechaHoraAveria: '' })
    setDialogOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormData({
      equipoId: item.equipoId || '',
      descripcionFalla: item.descripcionFalla || '',
      horometro: item.horometro || '',
      fechaHoraAveria: item.fechaHoraAveria ? item.fechaHoraAveria.slice(0, 16) : '',
      horometroAtencion: item.horometroAtencion || '',
      fechaHoraAtencion: item.fechaHoraAtencion ? item.fechaHoraAtencion.slice(0, 16) : '',
      accionRealizada: item.accionRealizada || '',
      estadoAveria: item.estadoAveria || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      if (editing) {
        const payload = {
          equipoId: formData.equipoId,
          descripcionFalla: formData.descripcionFalla,
          horometro: formData.horometro ? Number(formData.horometro) : null,
          fechaHoraAveria: formData.fechaHoraAveria,
          horometroAtencion: formData.horometroAtencion ? Number(formData.horometroAtencion) : null,
          fechaHoraAtencion: formData.fechaHoraAtencion,
          accionRealizada: formData.accionRealizada,
          estadoAveria: formData.estadoAveria,
        }
        await api.put(`/averias/${editing.id}`, payload)
      } else {
        await api.post('/averias', {
          equipoId: formData.equipoId,
          descripcionFalla: formData.descripcionFalla,
          horometro: formData.horometro ? Number(formData.horometro) : null,
          fechaHoraAveria: formData.fechaHoraAveria,
        })
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
      await api.delete(`/averias/${itemToDelete.id}`)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  }

  const columns = [
    { field: 'id', label: 'ID' },
    { field: 'equipoId', label: 'Equipo ID' },
    { field: 'descripcionFalla', label: 'Falla' },
    {
      field: 'estadoAveria', label: 'Estado',
      render: (row) => (
        <Chip label={row.estadoAveria || '-'} size="small"
          color={row.estadoAveria === 'ATENDIDA' ? 'success' : row.estadoAveria === 'PENDIENTE' ? 'warning' : 'default'} />
      ),
    },
    { field: 'fechaHoraAveria', label: 'Fecha Avería', render: (row) => formatDate(row.fechaHoraAveria) },
    { field: 'fechaHoraAtencion', label: 'Fecha Atención', render: (row) => formatDate(row.fechaHoraAtencion) },
    { field: 'horometro', label: 'Horómetro', render: (row) => row.horometro ?? '-' },
    { field: 'horometroAtencion', label: 'Hor. Atención', render: (row) => row.horometroAtencion ?? '-' },
    {
      field: 'diasInact', label: 'Días Inact.',
      render: (row) => {
        if (row.diasInactividad != null) return row.diasInactividad
        if (!row.fechaHoraAveria) return '-'
        const avg = new Date(row.fechaHoraAveria)
        const atn = row.fechaHoraAtencion ? new Date(row.fechaHoraAtencion) : new Date()
        return Math.max(0, Math.floor((atn - avg) / (1000 * 60 * 60 * 24)))
      },
    },
  ]

  const renderActions = (item) => (
    <>
      <Tooltip title="Evidencias">
        <IconButton size="small" onClick={() => loadEvidence(item.id)}>
          <PhotoLibraryIcon fontSize="small" color="info" />
        </IconButton>
      </Tooltip>
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
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Avería #{item.id} - Eq: {item.equipoId}
          </Typography>
          <Typography variant="caption" color="text.secondary">{item.descripcionFalla}</Typography>
        </Box>
        <Chip label={item.estadoAveria || '-'} size="small"
          color={item.estadoAveria === 'ATENDIDA' ? 'success' : item.estadoAveria === 'PENDIENTE' ? 'warning' : 'default'} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          Avería: {formatDate(item.fechaHoraAveria)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Atención: {formatDate(item.fechaHoraAtencion)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
        {renderActions(item)}
      </Box>
    </Box>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: 20, md: 24 } }}>Averías</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
          Nueva Avería
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        emptyMessage="No hay averías registradas"
        actions={renderActions}
        renderCard={renderCard}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Avería' : 'Nueva Avería'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="ID Equipo" value={formData.equipoId}
              onChange={(e) => setFormData({ ...formData, equipoId: e.target.value })}
              required fullWidth size="small" />
            <TextField label="Horómetro" type="number" value={formData.horometro}
              onChange={(e) => setFormData({ ...formData, horometro: e.target.value })}
              fullWidth size="small" />
            <TextField label="Descripción de la Falla" value={formData.descripcionFalla}
              onChange={(e) => setFormData({ ...formData, descripcionFalla: e.target.value })}
              required fullWidth size="small" multiline rows={3} />
            <TextField label="Fecha y Hora de Avería" type="datetime-local" value={formData.fechaHoraAveria}
              onChange={(e) => setFormData({ ...formData, fechaHoraAveria: e.target.value })}
              required fullWidth size="small" InputLabelProps={{ shrink: true }} />
            {editing && (
              <>
                <TextField label="Horómetro de Atención" type="number" value={formData.horometroAtencion || ''}
                  onChange={(e) => setFormData({ ...formData, horometroAtencion: e.target.value })}
                  fullWidth size="small" />
                <TextField label="Fecha y Hora de Atención" type="datetime-local" value={formData.fechaHoraAtencion || ''}
                  onChange={(e) => setFormData({ ...formData, fechaHoraAtencion: e.target.value })}
                  fullWidth size="small" InputLabelProps={{ shrink: true }} />
                <TextField label="Acción Realizada" value={formData.accionRealizada || ''}
                  onChange={(e) => setFormData({ ...formData, accionRealizada: e.target.value })}
                  fullWidth size="small" multiline rows={3} />
                <TextField label="Estado de Avería" value={formData.estadoAveria || ''}
                  fullWidth size="small" InputProps={{ readOnly: true }} />
              </>
            )}
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
          <Typography>¿Estás seguro de eliminar la avería <strong>{itemToDelete?.id}</strong>?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setItemToDelete(null) }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={evidenceOpen} onClose={closeEvidence} maxWidth="md" fullWidth>
        <DialogTitle>Evidencias Fotográficas — Avería #{evidenceAveriaId}</DialogTitle>
        <DialogContent>
          {evidenceLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : evidenceError ? (
            <Alert severity="info">{evidenceError}</Alert>
          ) : evidenceItems.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>No hay evidencias registradas para esta avería.</Typography>
          ) : (
            <ImageList cols={3} gap={8}>
              {evidenceItems.map(item => (
                <ImageListItem key={item.numeroFoto} sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    const url = evidenceImages[item.numeroFoto]
                    if (url) { setViewerUrl(url); setViewerOpen(true) }
                  }}>
                  {evidenceImages[item.numeroFoto] ? (
                    <img src={evidenceImages[item.numeroFoto]} alt={`Foto ${item.numeroFoto}`}
                      style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <Box sx={{ width: '100%', height: 180, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Sin imagen</Typography>
                    </Box>
                  )}
                  <ImageListItemBar
                    title={`Foto ${item.numeroFoto}`}
                    subtitle={`${item.nombreArchivo} · ${(item.tamanioBytes / 1024).toFixed(0)} KB`}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEvidence}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { bgcolor: 'black', height: '100%' } }}>
        <IconButton onClick={() => setViewerOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, color: 'white' }}>
          <Typography sx={{ fontSize: 28, lineHeight: 1 }}>&times;</Typography>
        </IconButton>
        {viewerUrl && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
            <img src={viewerUrl} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </Box>
        )}
      </Dialog>
    </Box>
  )
}
