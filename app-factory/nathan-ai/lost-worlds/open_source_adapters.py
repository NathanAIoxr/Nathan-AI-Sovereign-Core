"""Adapters for existing geospatial libraries. Data files are user supplied."""
from pathlib import Path

def distance_km(a, b):
    from geographiclib.geodesic import Geodesic
    return round(Geodesic.WGS84.Inverse(float(a[0]),float(a[1]),float(b[0]),float(b[1]))['s12']/1000,3)

def polygon_matches(lat, lon, vector_path):
    import geopandas as gpd
    from shapely.geometry import Point
    path=Path(vector_path)
    if not path.is_file(): raise FileNotFoundError(path)
    layer=gpd.read_file(path)
    if layer.crs is None: raise ValueError('Missing CRS')
    layer=layer.to_crs('EPSG:4326')
    matches=layer[layer.geometry.intersects(Point(float(lon),float(lat)))]
    return [{k:str(v) for k,v in row.items() if k!='geometry'} for _,row in matches.iterrows()]

def raster_elevation_m(lat,lon,raster_path):
    import rasterio
    from rasterio.warp import transform
    path=Path(raster_path)
    if not path.is_file(): raise FileNotFoundError(path)
    with rasterio.open(path) as src:
        if src.crs is None: raise ValueError('Missing raster CRS')
        xs,ys=transform('EPSG:4326',src.crs,[float(lon)],[float(lat)])
        if not (src.bounds.left<=xs[0]<=src.bounds.right and src.bounds.bottom<=ys[0]<=src.bounds.top):
            raise ValueError('Coordinate outside raster coverage')
        value=next(src.sample([(xs[0],ys[0])],masked=True))[0]
        if getattr(value,'mask',False):return None
        if src.nodata is not None and float(value)==src.nodata:return None
        return float(value)

def import_geonames_tsv(path,db_path,countries=None):
    import csv,sqlite3
    count=0
    with sqlite3.connect(db_path) as conn,open(path,encoding='utf-8',errors='replace') as stream:
        conn.execute("""CREATE TABLE IF NOT EXISTS geonames(
            id INTEGER PRIMARY KEY,name TEXT,ascii_name TEXT,alternate_names TEXT,
            lat REAL,lon REAL,feature_class TEXT,feature_code TEXT,country_code TEXT,attribution TEXT)""")
        for r in csv.reader(stream,delimiter='\t'):
            if len(r)<9 or (countries and r[8] not in countries): continue
            try:
                conn.execute('INSERT OR REPLACE INTO geonames VALUES(?,?,?,?,?,?,?,?,?,?)',
                  (int(r[0]),r[1],r[2],r[3],float(r[4]),float(r[5]),r[6],r[7],r[8],'GeoNames CC BY 4.0'))
                count+=1
            except (ValueError,IndexError):pass
    return count
