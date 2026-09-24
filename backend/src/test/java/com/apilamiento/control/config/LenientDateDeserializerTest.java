package com.apilamiento.control.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifica la matriz de formatos de fecha aceptada por la API.
 * Replica el orden de produccion: JavaTimeModule primero (customizer Quarkus,
 * prioridad 0) y luego JacksonDateCustomizer (prioridad MINIMUM, ultimo).
 */
class LenientDateDeserializerTest {

    static class LocalPayload {
        public LocalDateTime fechaPsr;
        public LocalDateTime fechaInicioUso;
        public LocalDateTime fechaFinUso;
        public LocalDateTime fechaIngreso;
    }

    static class OffsetPayload {
        public OffsetDateTime fechaInicio;
        public OffsetDateTime fechaFin;
        public OffsetDateTime fechaHoraAveria;
    }

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        new JacksonDateCustomizer().customize(mapper);
    }

    @Test
    void localDateTimeAceptaOffsetDelMobile() throws Exception {
        LocalPayload payload = mapper.readValue(
                "{\"fechaPsr\":\"2026-09-24T14:30:00-05:00\"}", LocalPayload.class);
        assertEquals(LocalDateTime.of(2026, 9, 24, 14, 30), payload.fechaPsr);
    }

    @Test
    void localDateTimeAceptaOffsetConFraccionDeSegundo() throws Exception {
        LocalPayload payload = mapper.readValue(
                "{\"fechaInicioUso\":\"2026-09-24T14:30:00.123-05:00\"}", LocalPayload.class);
        assertEquals(LocalDateTime.of(2026, 9, 24, 14, 30, 0, 123000000), payload.fechaInicioUso);
    }

    @Test
    void localDateTimeAceptaSoloFechaDelWeb() throws Exception {
        LocalPayload payload = mapper.readValue(
                "{\"fechaPsr\":\"2026-09-24\"}", LocalPayload.class);
        assertEquals(LocalDateTime.of(2026, 9, 24, 0, 0), payload.fechaPsr);
    }

    @Test
    void localDateTimeAceptaSinOffset() throws Exception {
        LocalPayload payload = mapper.readValue(
                "{\"fechaInicioUso\":\"2026-09-24T14:30\"}", LocalPayload.class);
        assertEquals(LocalDateTime.of(2026, 9, 24, 14, 30), payload.fechaInicioUso);
    }

    @Test
    void localDateTimeAceptaUtcZ() throws Exception {
        LocalPayload payload = mapper.readValue(
                "{\"fechaFinUso\":\"2026-09-24T19:30:00.000Z\"}", LocalPayload.class);
        assertEquals(LocalDateTime.of(2026, 9, 24, 19, 30), payload.fechaFinUso);
    }

    @Test
    void localDateTimeRechazaValorInvalido() {
        assertThrows(Exception.class, () -> mapper.readValue(
                "{\"fechaPsr\":\"not-a-date\"}", LocalPayload.class));
        assertThrows(Exception.class, () -> mapper.readValue(
                "{\"fechaPsr\":\"2026-13-45T14:30\"}", LocalPayload.class));
        assertThrows(Exception.class, () -> mapper.readValue(
                "{\"fechaPsr\":\"\"}", LocalPayload.class));
    }

    @Test
    void offsetDateTimeAceptaSinOffsetInterpretandoLima() throws Exception {
        OffsetPayload payload = mapper.readValue(
                "{\"fechaHoraAveria\":\"2026-09-24T14:30\"}", OffsetPayload.class);
        assertEquals(2026, payload.fechaHoraAveria.getYear());
        assertEquals(9, payload.fechaHoraAveria.getMonthValue());
        assertEquals(24, payload.fechaHoraAveria.getDayOfMonth());
        assertEquals(14, payload.fechaHoraAveria.getHour());
        assertEquals(30, payload.fechaHoraAveria.getMinute());
        assertEquals(ZoneOffset.ofHours(-5), payload.fechaHoraAveria.getOffset());
    }

    @Test
    void offsetDateTimeConservaOffsetExistente() throws Exception {
        OffsetPayload payload = mapper.readValue(
                "{\"fechaInicio\":\"2026-09-24T14:30:00-05:00\"}", OffsetPayload.class);
        assertEquals(ZoneOffset.ofHours(-5), payload.fechaInicio.getOffset());
        assertEquals(14, payload.fechaInicio.getHour());

        OffsetPayload utc = mapper.readValue(
                "{\"fechaFin\":\"2026-09-24T19:30:00.000Z\"}", OffsetPayload.class);
        assertEquals(ZoneOffset.UTC, utc.fechaFin.getOffset());
    }

    @Test
    void offsetDateTimeAceptaSoloFecha() throws Exception {
        OffsetPayload payload = mapper.readValue(
                "{\"fechaInicio\":\"2026-09-24\"}", OffsetPayload.class);
        assertEquals(LocalDate.of(2026, 9, 24), payload.fechaInicio.toLocalDate());
        assertEquals(0, payload.fechaInicio.getHour());
        assertEquals(ZoneOffset.ofHours(-5), payload.fechaInicio.getOffset());
    }

    @Test
    void offsetDateTimeRechazaValorInvalido() {
        assertThrows(Exception.class, () -> mapper.readValue(
                "{\"fechaInicio\":\"not-a-date\"}", OffsetPayload.class));
        assertThrows(Exception.class, () -> mapper.readValue(
                "{\"fechaInicio\":\"\"}", OffsetPayload.class));
    }

    @Test
    void nullSigueSiendoNull() throws Exception {
        LocalPayload payload = mapper.readValue("{\"fechaPsr\":null}", LocalPayload.class);
        assertNull(payload.fechaPsr);
    }

    @Test
    void serializacionNoCambia() throws Exception {
        String json = mapper.writeValueAsString(LocalDateTime.of(2026, 9, 24, 14, 30));
        assertEquals("\"2026-09-24T14:30:00\"", json);

        OffsetPayload payload = new OffsetPayload();
        payload.fechaInicio = LocalDateTime.of(2026, 9, 24, 14, 30).atOffset(ZoneOffset.ofHours(-5));
        String offsetJson = mapper.writeValueAsString(payload.fechaInicio);
        assertTrue(offsetJson.contains("2026-09-24T14:30:00-05:00"), offsetJson);
    }
}
