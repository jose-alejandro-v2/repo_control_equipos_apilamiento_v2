package com.apilamiento.control.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import io.quarkus.jackson.ObjectMapperCustomizer;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

/**
 * Registra deserializadores flexibles de fechas sobre el ObjectMapper global.
 * Usa MINIMUM_PRIORITY para ejecutarse al final (despues del registro de
 * JavaTimeModule) y que estos deserializadores prevalezcan sobre los estandar.
 * Corrige el 400 al crear PSR/Equipos desde mobile (fechas con offset -05:00)
 * y desde web (solo fecha YYYY-MM-DD o datetime-local sin offset).
 */
@ApplicationScoped
public class JacksonDateCustomizer implements ObjectMapperCustomizer {

    @Override
    public void customize(ObjectMapper objectMapper) {
        SimpleModule module = new SimpleModule("lenient-date-formats");
        module.addDeserializer(LocalDateTime.class, new LenientLocalDateTimeDeserializer());
        module.addDeserializer(OffsetDateTime.class, new LenientOffsetDateTimeDeserializer());
        objectMapper.registerModule(module);
    }

    @Override
    public int priority() {
        return MINIMUM_PRIORITY;
    }
}
