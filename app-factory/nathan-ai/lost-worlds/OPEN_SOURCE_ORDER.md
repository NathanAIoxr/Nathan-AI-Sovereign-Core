# Open-source integration order — Nathan Tabor Lost Worlds

The existing local Atlas (SQLite, four workers, HTML UI) remains canonical. This PR includes reusable adapters, **not** the entire local ZIP app.

1. **Provenance** — SQLite records and CERO/UNO/DOS source labels; preserve original claims.
2. **Gazetteer** — GeoNames CC BY 4.0 bulk TSV `import_geonames_tsv` (offline) and Natural Earth public-domain vector layers.
3. **Antipodes / geodesy** — existing `antipode_core.py` plus GeographicLib `distance_km`.
4. **Vector terrain** — GeoPandas, Shapely, pyproj via `polygon_matches` on local sourced polygons, CRS converted to WGS84.
5. **Raster bathymetry** — GEBCO 2026 subset GeoTIFF via Rasterio `raster_elevation_m`; external grid must be downloaded and attributed.
6. **Large-scale spatial data** — DuckDB Spatial `ST_Read` as a later batch-query adapter; no unverified live connection.
7. **Research citations** — OpenAlex API metadata, on-demand only; no evidence claims without reading sources.
8. **Worker scheduling** — later deployment layer; existing jobs are run-on-demand, not a 24/7 background system.
9. **Browser visualization** — keep existing user interface and evidence distinctions.

Install adapters: `pip install -r requirements-geospatial.txt`. Provide the paths to legitimately sourced GeoJSON/GeoPackage and GeoTIFF data. No public Nominatim bulk scraping. Geometric overlap and antipodal proximity do not identify ancient civilizations.

Sources: https://www.gebco.net/data-products/gridded-bathymetry-data ; https://www.geonames.org/about.html ; https://geopandas.org/ ; https://duckdb.org/docs/stable/core_extensions/spatial/functions ; https://help.openalex.org/api/
