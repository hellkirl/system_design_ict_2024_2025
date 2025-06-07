import React, { useState, useEffect } from 'react';
import { uploadFile, getStatus, getResults } from './api';
import DataVisualization from './DataVisualization';
import './styles.css';

export default function App() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    if (fileId && status !== 'done') {
      timer = setInterval(async () => {
        try {
          const resp = await getStatus(fileId);
          setStatus(resp.status);
        } catch (e) {
          setError(e.message);
          clearInterval(timer);
        }
      }, 2000);
    }
    if (status === 'done' && fileId) {
      getResults(fileId)
        .then(data => setResults(data))
        .catch(e => setError(e.message));
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [fileId, status]);

  const handleUpload = async e => {
    e.preventDefault();
    setError('');
    setResults(null);
    try {
      const { file_id } = await uploadFile(file);
      setFileId(file_id);
      setStatus('running');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="container">
      <h1 className="heading">Big Data Processor</h1>

      <form onSubmit={handleUpload} className="form">
        <input
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
          className="input-file"
        />
        <button
          type="submit"
          disabled={!file}
          className="button"
        >
          Upload & Analyze
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {fileId && (
        <div className="status">
          <p><strong>File ID:</strong> {fileId}</p>
          <p><strong>Status:</strong> {status}</p>
        </div>
      )}

      {results && <DataVisualization results={results} />}

      {results && (
        <div className="results">
          <h2>Raw JSON Results</h2>
          <details>
            <summary>Click to view raw data</summary>
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}