CREATE TABLE IF NOT EXISTS graph_edges (rank INTEGER PRIMARY KEY, source TEXT NOT NULL, target TEXT NOT NULL);
INSERT OR IGNORE INTO graph_edges VALUES
  (1,'catalog','index'),(2,'index','archive'),(3,'archive','restore'),(4,'catalog','preview');
