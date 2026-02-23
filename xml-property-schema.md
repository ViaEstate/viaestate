# XML Property Upload Schema

This document defines the XML schema for uploading properties through XML files. The system supports two XML formats:

## Format 1: Standard Format (Original)

```xml
<properties>
  <property>
    <title>Luxury Villa with Sea View</title>
    <description>A beautiful luxury villa with stunning sea views...</description>
    <country>Spain</country>
    <city>Barcelona</city>
    <price>850000</price>
    <property_type>villa</property_type>
    <bedrooms>4</bedrooms>
    <bathrooms>3</bathrooms>
    <area>250</area>
    <plot_area>1000</plot_area>
    <distance_to_city>5000</distance_to_city>
    <distance_to_sea>200</distance_to_sea>
    <distance_to_lake>1500</distance_to_lake>
    <images>
      <image>https://example.com/image1.jpg</image>
      <image>https://example.com/image2.jpg</image>
    </images>
    <videos>
      <video>https://example.com/video1.mp4</video>
    </videos>
  </property>
  <!-- Multiple properties can be in one file -->
  <property>
    <!-- ... -->
  </property>
</properties>
```

## Format 2: Extended Real Estate Format (xml2u.com compatible)

```xml
<properties>
  <Property>
    <propertyid>10765-MA234000E</propertyid>
    <lastUpdateDate>2025-12-03</lastUpdateDate>
    <category>Residential For Sale</category>
    <Address>
      <number/>
      <street/>
      <postcode>34340</postcode>
      <location>Marseillan</location>
      <subRegion>Herault</subRegion>
      <region>Languedoc-Roussillon</region>
      <country>France</country>
      <countryCodeISO3166-1-alpha2>FR</countryCodeISO3166-1-alpha2>
      <latitude/>
      <longitude/>
    </Address>
    <Price>
      <price>209000</price>
      <currency>EUR</currency>
      <reference>MA234000E</reference>
    </Price>
    <Description>
      <propertyType>House</propertyType>
      <bedrooms>3</bedrooms>
      <fullBathrooms>1</fullBathrooms>
      <title>Attractive Village House With 87 M2 Living Space And Roof Terrace In A Lively Seaside Town.</title>
      <shortDescription>Nice little town on the Etang de Thau...</shortDescription>
      <description>
        <en><![CDATA[ Detailed description here... ]]></en>
      </description>
      <terrace>Yes</terrace>
      <FloorSize>
        <floorSize>87</floorSize>
        <floorSizeUnits>sq meters</floorSizeUnits>
      </FloorSize>
      <PlotSize>
        <plotSize/>
        <plotSizeUnits/>
      </PlotSize>
    </Description>
    <images>
      <image number="1">
        <image>https://example.com/image1.jpg</image>
      </image>
      <image number="2">
        <image>https://example.com/image2.jpg</image>
      </image>
    </images>
    <link>
      <dataSource>https://example.com/property-link</dataSource>
    </link>
  </Property>
  <!-- Multiple properties can be in one file -->
  <Property>
    <!-- ... -->
  </Property>
</properties>
```

## Field Specifications

### Required Fields
- `title`: Property title (string)
- `description`: Property description (string)
- `country`: Country name (string)
- `city`: City name (string)
- `price`: Price in EUR (number)

### Optional Fields
- `property_type`: villa, apartment, house, penthouse, commercial, land (string)
- `bedrooms`: Number of bedrooms (integer)
- `bathrooms`: Number of bathrooms (integer)
- `area`: Living area in m² (integer)
- `plot_area`: Plot area in m² (integer)
- `distance_to_city`: Distance to city center in meters (integer)
- `distance_to_sea`: Distance to sea in meters (integer)
- `distance_to_lake`: Distance to lake in meters (integer)
- `images`: Array of image URLs (array of strings)
- `videos`: Array of video URLs (array of strings)

## Validation Rules

1. At least one property element must be present
2. Required fields must be non-empty strings
3. Price must be a positive number
4. Numeric fields must be valid integers when present
5. Image/video URLs must be valid HTTP/HTTPS URLs
6. Property type must be one of the allowed values

## Processing Logic

1. Parse XML and validate structure
2. For each property:
   - Validate required fields
   - Download images/videos from URLs
   - Upload media to Supabase storage
   - Create property record
   - Associate uploaded media URLs

## Error Handling

- Invalid XML structure: Reject entire file
- Missing required fields: Skip property with error message
- Invalid URLs: Skip media with warning
- Upload failures: Continue with other properties