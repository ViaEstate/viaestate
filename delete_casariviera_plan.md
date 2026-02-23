# Plan för att ta bort Casariviera-fastigheter

## Bakgrund
Användaren vill ta bort de fastigheter som importerades från casariviera.xml från plattformen.

## Referenser att ta bort
Följande referenser finns i casariviera.xml:
- Ref. 829
- Ref. 908
- Ref. 823 (finns två gånger)
- Ref. 730
- Ref. 822
- Ref. 820
- Ref. 850
- Ref. 791
- Ref. 833
- Ref. 844
- Ref. 824
- Ref. 508

## SQL-fråga för att ta bort
```sql
DELETE FROM properties
WHERE xml_object_id IN (
    'Ref. 829',
    'Ref. 908',
    'Ref. 823',
    'Ref. 730',
    'Ref. 822',
    'Ref. 820',
    'Ref. 850',
    'Ref. 791',
    'Ref. 833',
    'Ref. 844',
    'Ref. 824',
    'Ref. 508'
);
```

## Verifiering först
För att se vilka som kommer tas bort:
```sql
SELECT id, title, xml_object_id FROM properties WHERE xml_object_id IN ('Ref. 829', 'Ref. 908', ...);
```

## Nästa steg
- Kör SELECT-frågan för att verifiera
- Kör DELETE-frågan om det ser rätt ut
- Kontrollera att fastigheterna är borttagna

## För att hitta återstående casariviera-fastighet
Om några finns kvar, kör denna fråga för att hitta alla importerade från XML:
```sql
SELECT id, title, xml_object_id FROM properties WHERE xml_object_id LIKE 'Ref. %';
```