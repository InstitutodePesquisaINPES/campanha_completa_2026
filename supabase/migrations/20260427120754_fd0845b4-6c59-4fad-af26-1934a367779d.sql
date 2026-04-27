UPDATE storage.buckets
SET
  file_size_limit = 53687091200,
  allowed_mime_types = ARRAY[
    'text/csv',
    'text/plain',
    'application/csv',
    'application/vnd.ms-excel',
    'application/octet-stream'
  ]
WHERE id = 'tse-csv-uploads';