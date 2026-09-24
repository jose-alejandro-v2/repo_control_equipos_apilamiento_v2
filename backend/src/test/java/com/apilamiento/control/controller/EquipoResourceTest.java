package com.apilamiento.control.controller;

import com.apilamiento.control.dto.EquipoDTO;
import com.apilamiento.control.service.EquipoService;
import com.apilamiento.control.service.EquipoTimelineService;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoResourceTest {

    @Mock
    EquipoService service;

    @Mock
    EquipoTimelineService timelineService;

    @Mock
    SecurityContext securityContext;

    @Mock
    JsonWebToken jwt;

    private EquipoResource resource() {
        return new EquipoResource(service, timelineService);
    }

    private void simularToken(Long usuarioId) {
        when(securityContext.getUserPrincipal()).thenReturn(jwt);
        when(jwt.getSubject()).thenReturn(String.valueOf(usuarioId));
    }

    @Test
    void crear_deberiaAsignarUsuarioDelTokenComoUsuarioCreacion() {
        simularToken(17L);
        when(service.crear(any())).thenReturn(new EquipoDTO());

        resource().crear(new EquipoDTO(), securityContext);

        ArgumentCaptor<EquipoDTO> captor = ArgumentCaptor.forClass(EquipoDTO.class);
        verify(service).crear(captor.capture());
        assertEquals(17L, captor.getValue().getUsuarioCreacion());
    }

    @Test
    void actualizar_deberiaAsignarUsuarioDelTokenComoUsuarioActualizacion() {
        simularToken(17L);
        when(service.puedeAcceder(1L, 17L, false)).thenReturn(true);
        when(service.actualizar(eq(1L), any())).thenReturn(new EquipoDTO());

        resource().actualizar(1L, new EquipoDTO(), securityContext);

        ArgumentCaptor<EquipoDTO> captor = ArgumentCaptor.forClass(EquipoDTO.class);
        verify(service).actualizar(eq(1L), captor.capture());
        assertEquals(17L, captor.getValue().getUsuarioActualizacion());
    }

    @Test
    void actualizar_sinAcceso_deberiaRetornar404SinInvocarServicio() {
        simularToken(17L);

        Response response = resource().actualizar(1L, new EquipoDTO(), securityContext);

        assertEquals(404, response.getStatus());
        verify(service, never()).actualizar(any(), any());
    }
}
