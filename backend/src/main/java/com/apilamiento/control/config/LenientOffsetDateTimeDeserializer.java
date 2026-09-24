package com.apilamiento.control.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

/**
 * Deserializador tolerante para java.time.OffsetDateTime.
 * Acepta ISO con offset o Z (se interpreta tal cual) y cadenas sin offset
 * o solo fecha, las cuales se interpretan en la zona America/Lima.
 */
public class LenientOffsetDateTimeDeserializer extends StdDeserializer<OffsetDateTime> {

    private static final Pattern OFFSET_SUFFIX = Pattern.compile("(Z|[+-]\\d{2}:?\\d{2})$");
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final long serialVersionUID = 1L;

    public LenientOffsetDateTimeDeserializer() {
        super(OffsetDateTime.class);
    }

    @Override
    public OffsetDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p.currentToken() != JsonToken.VALUE_STRING) {
            return (OffsetDateTime) ctxt.handleUnexpectedToken(handledType(), p);
        }
        String text = p.getText().trim();
        if (text.isEmpty()) {
            throw JsonMappingException.from(p,
                    "Cannot deserialize value of type `java.time.OffsetDateTime` from empty String");
        }
        try {
            if (OFFSET_SUFFIX.matcher(text).find()) {
                return OffsetDateTime.parse(text, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            }
            if (text.length() == 10) {
                return LocalDate.parse(text, DateTimeFormatter.ISO_LOCAL_DATE)
                        .atStartOfDay(LIMA).toOffsetDateTime();
            }
            return LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    .atZone(LIMA).toOffsetDateTime();
        } catch (DateTimeParseException e) {
            throw JsonMappingException.from(p,
                    "Cannot deserialize value of type `java.time.OffsetDateTime` from String \""
                            + text + "\": " + e.getMessage());
        }
    }
}
