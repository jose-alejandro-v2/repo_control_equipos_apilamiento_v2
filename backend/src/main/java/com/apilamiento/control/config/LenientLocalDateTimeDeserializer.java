package com.apilamiento.control.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

/**
 * Deserializador tolerante para java.time.LocalDateTime.
 * Acepta:
 * - ISO local sin offset: 2026-09-24T14:30 / 2026-09-24T14:30:00
 * - ISO con offset (mobile): 2026-09-24T14:30:00-05:00 (se descarta el offset conservando la hora local)
 * - ISO UTC: 2026-09-24T19:30:00.000Z (se conserva la hora local tal cual)
 * - Solo fecha (web): 2026-09-24 (se interpreta a las 00:00)
 */
public class LenientLocalDateTimeDeserializer extends StdDeserializer<LocalDateTime> {

    private static final Pattern OFFSET_SUFFIX = Pattern.compile("(Z|[+-]\\d{2}:?\\d{2})$");
    private static final long serialVersionUID = 1L;

    public LenientLocalDateTimeDeserializer() {
        super(LocalDateTime.class);
    }

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p.currentToken() != JsonToken.VALUE_STRING) {
            return (LocalDateTime) ctxt.handleUnexpectedToken(handledType(), p);
        }
        String text = p.getText().trim();
        if (text.isEmpty()) {
            throw JsonMappingException.from(p,
                    "Cannot deserialize value of type `java.time.LocalDateTime` from empty String");
        }
        String normalized = OFFSET_SUFFIX.matcher(text).replaceFirst("");
        try {
            if (normalized.length() == 10) {
                return LocalDate.parse(normalized, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay();
            }
            return LocalDateTime.parse(normalized, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException e) {
            throw JsonMappingException.from(p,
                    "Cannot deserialize value of type `java.time.LocalDateTime` from String \""
                            + text + "\": " + e.getMessage());
        }
    }
}
