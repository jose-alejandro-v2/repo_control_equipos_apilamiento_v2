package com.apilamiento.control.service;

import com.apilamiento.control.dto.AveriaDTO;
import com.apilamiento.control.entity.Averia;
import com.apilamiento.control.entity.Equipo;
import com.apilamiento.control.entity.EvidenciaAveria;
import com.apilamiento.control.mapper.AveriaMapper;
import com.apilamiento.control.mapper.EvidenciaAveriaMapper;
import com.apilamiento.control.repository.AveriaRepository;
import com.apilamiento.control.repository.EquipoRepository;
import com.apilamiento.control.repository.EvidenciaAveriaRepository;
import jakarta.ws.rs.WebApplicationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyShort;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AveriaServiceTest {

    @Mock
    AveriaRepository repository;

    @Mock
    EquipoRepository equipoRepository;

    @Mock
    EvidenciaAveriaRepository evidenciaRepository;

    @Mock
    NotificacionPushService notificacionPushService;

    AveriaMapper mapper = new AveriaMapper();
    EvidenciaAveriaMapper evidenciaMapper = new EvidenciaAveriaMapper();

    AveriaService service;

    @BeforeEach
    void setUp() {
        service = new AveriaService(repository, mapper, equipoRepository, evidenciaRepository, evidenciaMapper,
                notificacionPushService);
    }

    @Test
    void crear_deberiaGuardarHorometro() {
        AveriaDTO dto = new AveriaDTO();
        dto.setEquipoId(5L);
        dto.setDescripcionFalla("Falla en la horquilla del montacargas");
        dto.setHorometro(new BigDecimal("1234.5"));
        doAnswer(invocation -> {
            Averia e = invocation.getArgument(0);
            e.setId(9L);
            return null;
        }).when(repository).persist(any(Averia.class));
        Equipo equipo = new Equipo();
        when(equipoRepository.findById(5L)).thenReturn(equipo);

        AveriaDTO resultado = service.crear(dto);

        assertNotNull(resultado);
        assertEquals(new BigDecimal("1234.5"), resultado.getHorometro());
        verify(repository).persist(any(Averia.class));
        verify(notificacionPushService, never()).notificarAveriaReportada(any(), any());
    }

    @Test
    void confirmar_deberiaNotificarAveriaReportada() {
        Averia entity = new Averia();
        entity.setId(9L);
        entity.setEquipoId(5L);
        entity.setUsuarioCreacion(17L);
        when(repository.findById(9L)).thenReturn(entity);
        Equipo equipo = new Equipo();
        when(equipoRepository.findById(5L)).thenReturn(equipo);

        AveriaDTO resultado = service.confirmar(9L);

        assertNotNull(resultado);
        verify(notificacionPushService).notificarAveriaReportada(equipo, 17L);
    }

    @Test
    void actualizar_deberiaActualizarHorometro() {
        Averia entity = new Averia();
        entity.setId(1L);
        entity.setDescripcionFalla("Original");
        entity.setHorometro(new BigDecimal("100.5"));
        when(repository.findById(1L)).thenReturn(entity);

        AveriaDTO dto = new AveriaDTO();
        dto.setDescripcionFalla("Actualizada");
        dto.setHorometro(new BigDecimal("200.5"));

        AveriaDTO resultado = service.actualizar(1L, dto);

        assertNotNull(resultado);
        assertEquals(new BigDecimal("200.5"), resultado.getHorometro());
    }

    @Test
    void actualizar_noPisaEstadoDevueltoAlAtenderAveria() {
        Averia entity = new Averia();
        entity.setId(1L);
        entity.setEquipoId(5L);
        entity.setFechaHoraAveria(OffsetDateTime.now());
        when(repository.findById(1L)).thenReturn(entity);

        Equipo equipo = new Equipo();
        equipo.setId(5L);
        equipo.setEstadoOperativo("DEVUELTO");
        equipo.setFechaDevolucion(OffsetDateTime.now());
        when(equipoRepository.findById(5L)).thenReturn(equipo);

        AveriaDTO dto = new AveriaDTO();
        dto.setEstadoAveria("ATENDIDA");
        dto.setHorometroAtencion(new BigDecimal("200.5"));

        service.actualizar(1L, dto);

        assertEquals("DEVUELTO", equipo.getEstadoOperativo());
        assertNotNull(equipo.getFechaDevolucion());
        verify(notificacionPushService).notificarAveriaAtendida(equipo, 1L);
    }

    @Test
    void crear_deberiaGuardarFechaHoraAveriaDelDto() {
        AveriaDTO dto = new AveriaDTO();
        dto.setEquipoId(5L);
        dto.setDescripcionFalla("Falla de prueba");
        dto.setHorometro(new BigDecimal("100.5"));
        OffsetDateTime fecha = OffsetDateTime.of(2026, 6, 30, 10, 0, 0, 0, ZoneOffset.of("-05:00"));
        dto.setFechaHoraAveria(fecha);
        doAnswer(invocation -> {
            Averia e = invocation.getArgument(0);
            e.setId(9L);
            return null;
        }).when(repository).persist(any(Averia.class));

        AveriaDTO resultado = service.crear(dto);

        assertEquals(fecha, resultado.getFechaHoraAveria());
    }

    @Test
    void actualizar_atenderDeberiaGuardarHorometroAtencionYCalcularDias() {
        Averia entity = new Averia();
        entity.setId(1L);
        entity.setEquipoId(5L);
        entity.setHorometro(new BigDecimal("100.5"));
        entity.setFechaHoraAveria(OffsetDateTime.now().minusDays(2));
        when(repository.findById(1L)).thenReturn(entity);

        AveriaDTO dto = new AveriaDTO();
        dto.setEstadoAveria("ATENDIDA");
        dto.setHorometroAtencion(new BigDecimal("150.5"));
        dto.setAccionRealizada("Reparación realizada");

        AveriaDTO resultado = service.actualizar(1L, dto);

        assertNotNull(resultado);
        assertEquals(new BigDecimal("150.5"), entity.getHorometroAtencion());
        assertNotNull(entity.getFechaHoraAtencion());
        assertEquals(Integer.valueOf(2), entity.getDiasInactividad());
        assertEquals("ATENDIDA", entity.getEstadoAveria());
    }

    @Test
    void actualizar_atenderDeberiaPersistirFechaHoraAtencionEnviada() {
        Averia entity = new Averia();
        entity.setId(1L);
        entity.setEquipoId(5L);
        entity.setHorometro(new BigDecimal("100.5"));
        entity.setFechaHoraAveria(OffsetDateTime.of(2026, 8, 10, 8, 0, 0, 0, ZoneOffset.of("-05:00")));
        when(repository.findById(1L)).thenReturn(entity);

        OffsetDateTime atencion = OffsetDateTime.of(2026, 8, 11, 9, 0, 0, 0, ZoneOffset.of("-05:00"));
        AveriaDTO dto = new AveriaDTO();
        dto.setEstadoAveria("ATENDIDA");
        dto.setHorometroAtencion(new BigDecimal("150.5"));
        dto.setFechaHoraAtencion(atencion);

        service.actualizar(1L, dto);

        assertEquals(atencion, entity.getFechaHoraAtencion());
        assertEquals(Integer.valueOf(1), entity.getDiasInactividad());
    }

    @Test
    void actualizar_atenderFechaHoraAtencionAnteriorAveria_deberiaFallar() {
        Averia entity = new Averia();
        entity.setId(1L);
        entity.setEquipoId(5L);
        entity.setHorometro(new BigDecimal("100.5"));
        entity.setFechaHoraAveria(OffsetDateTime.of(2026, 8, 11, 9, 0, 0, 0, ZoneOffset.of("-05:00")));
        when(repository.findById(1L)).thenReturn(entity);

        AveriaDTO dto = new AveriaDTO();
        dto.setEstadoAveria("ATENDIDA");
        dto.setHorometroAtencion(new BigDecimal("150.5"));
        dto.setFechaHoraAtencion(OffsetDateTime.of(2026, 8, 10, 9, 0, 0, 0, ZoneOffset.of("-05:00")));

        WebApplicationException error = assertThrows(WebApplicationException.class,
                () -> service.actualizar(1L, dto));
        assertEquals(400, error.getResponse().getStatus());
    }

    @Test
    void actualizar_atenderSinHorometroAtencion_deberiaFallar() {
        Averia entity = new Averia();
        entity.setId(1L);
        entity.setEquipoId(5L);
        when(repository.findById(1L)).thenReturn(entity);

        AveriaDTO dto = new AveriaDTO();
        dto.setEstadoAveria("ATENDIDA");
        dto.setAccionRealizada("Reparación realizada");

        assertThrows(WebApplicationException.class, () -> service.actualizar(1L, dto));
    }

    @Test
    void actualizar_atenderHorometroAtencionMenorAlReportado_deberiaFallar() {
        Averia entity = new Averia();
        entity.setId(1L);
        entity.setEquipoId(5L);
        entity.setHorometro(new BigDecimal("200.5"));
        when(repository.findById(1L)).thenReturn(entity);

        AveriaDTO dto = new AveriaDTO();
        dto.setEstadoAveria("ATENDIDA");
        dto.setHorometroAtencion(new BigDecimal("100.5"));

        WebApplicationException error = assertThrows(WebApplicationException.class,
                () -> service.actualizar(1L, dto));
        assertEquals(400, error.getResponse().getStatus());
    }

    @Test
    void actualizar_reescribirAtendida_noSobrescribeFechaAtencion() {
        Averia entity = new Averia();
        entity.setId(1L);
        entity.setEquipoId(5L);
        entity.setEstadoAveria("ATENDIDA");
        entity.setHorometro(new BigDecimal("100.5"));
        entity.setHorometroAtencion(new BigDecimal("150.5"));
        OffsetDateTime atencion = OffsetDateTime.now().minusDays(1);
        entity.setFechaHoraAtencion(atencion);
        entity.setDiasInactividad(2);
        when(repository.findById(1L)).thenReturn(entity);

        AveriaDTO dto = new AveriaDTO();
        dto.setEstadoAveria("ATENDIDA");
        dto.setHorometroAtencion(new BigDecimal("155.5"));

        service.actualizar(1L, dto);

        assertEquals(atencion, entity.getFechaHoraAtencion());
        assertEquals(new BigDecimal("155.5"), entity.getHorometroAtencion());
    }

    @Test
    void guardarEvidencia_numeroFotoInvalido_deberiaFallar() {
        Averia averia = new Averia();
        averia.setId(1L);
        when(repository.findById(1L)).thenReturn(averia);

        assertThrows(WebApplicationException.class, () ->
                service.guardarEvidencia(1L, (short) 0, "foto.jpg", "image/jpeg", new byte[]{1}, 1L));
        assertThrows(WebApplicationException.class, () ->
                service.guardarEvidencia(1L, (short) 6, "foto.jpg", "image/jpeg", new byte[]{1}, 1L));
        verify(evidenciaRepository, never()).persist(any(EvidenciaAveria.class));
    }

    @Test
    void guardarEvidencia_mimeInvalido_deberiaFallar() {
        Averia averia = new Averia();
        averia.setId(1L);
        when(repository.findById(1L)).thenReturn(averia);

        assertThrows(WebApplicationException.class, () ->
                service.guardarEvidencia(1L, (short) 3, "foto.txt", "text/plain", new byte[]{1}, 1L));
        verify(evidenciaRepository, never()).persist(any(EvidenciaAveria.class));
    }

    @Test
    void guardarEvidencia_horometro_deberiaPersistirNumero3() {
        Averia averia = new Averia();
        averia.setId(1L);
        when(repository.findById(1L)).thenReturn(averia);
        when(evidenciaRepository.findByAveriaAndNumero(1L, (short) 3)).thenReturn(Optional.empty());
        doAnswer(invocation -> {
            EvidenciaAveria e = invocation.getArgument(0);
            e.setId(50L);
            return null;
        }).when(evidenciaRepository).persist(any(EvidenciaAveria.class));

        var dto = service.guardarEvidencia(1L, (short) 3, "horometro.jpg", "image/jpeg", new byte[]{1, 2, 3}, 1L);

        assertNotNull(dto);
        assertEquals((short) 3, dto.getNumeroFoto());
        verify(evidenciaRepository).persist(any(EvidenciaAveria.class));
    }

    @Test
    void guardarEvidencia_slot4HorometroAtencion_deberiaPersistir() {
        Averia averia = new Averia();
        averia.setId(1L);
        when(repository.findById(1L)).thenReturn(averia);
        when(evidenciaRepository.findByAveriaAndNumero(1L, (short) 4)).thenReturn(Optional.empty());
        doAnswer(invocation -> {
            EvidenciaAveria e = invocation.getArgument(0);
            e.setId(51L);
            return null;
        }).when(evidenciaRepository).persist(any(EvidenciaAveria.class));

        var dto = service.guardarEvidencia(1L, (short) 4, "hor_aten.jpg", "image/jpeg", new byte[]{1, 2, 3}, 1L);

        assertNotNull(dto);
        assertEquals((short) 4, dto.getNumeroFoto());
        verify(evidenciaRepository).persist(any(EvidenciaAveria.class));
    }

    @Test
    void guardarEvidencia_slot5EvidenciaServicio_deberiaPersistir() {
        Averia averia = new Averia();
        averia.setId(1L);
        when(repository.findById(1L)).thenReturn(averia);
        when(evidenciaRepository.findByAveriaAndNumero(1L, (short) 5)).thenReturn(Optional.empty());
        doAnswer(invocation -> {
            EvidenciaAveria e = invocation.getArgument(0);
            e.setId(52L);
            return null;
        }).when(evidenciaRepository).persist(any(EvidenciaAveria.class));

        var dto = service.guardarEvidencia(1L, (short) 5, "servicio.jpg", "image/jpeg", new byte[]{1, 2, 3}, 1L);

        assertNotNull(dto);
        assertEquals((short) 5, dto.getNumeroFoto());
        verify(evidenciaRepository).persist(any(EvidenciaAveria.class));
    }

    @Test
    void listarEvidencias_deberiaDelegarYMapAhorometro() {
        Averia averia = new Averia();
        averia.setId(1L);
        when(repository.findById(1L)).thenReturn(averia);

        EvidenciaAveria evidencia = new EvidenciaAveria();
        evidencia.setId(2L);
        evidencia.setAveriaId(1L);
        evidencia.setNumeroFoto((short) 3);
        when(evidenciaRepository.listByAveria(1L)).thenReturn(List.of(evidencia));

        var resultado = service.listarEvidencias(1L);

        assertEquals(1, resultado.size());
        assertEquals((short) 3, resultado.get(0).getNumeroFoto());
    }
}
