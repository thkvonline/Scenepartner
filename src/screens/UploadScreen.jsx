import { useRef, useState } from 'react';
import { parseScriptText } from '../utils/scriptParser';

async function extractTextFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

export default function UploadScreen({ onScriptParsed }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const processFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      let text = '';
      if (file.name.endsWith('.pdf')) {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }
      const lines = parseScriptText(text);
      if (lines.length === 0) {
        setError('No dialogue found. Make sure lines are formatted as "CHARACTER: dialogue".');
        setLoading(false);
        return;
      }
      onScriptParsed(lines);
    } catch (err) {
      setError('Failed to read file: ' + err.message);
    }
    setLoading(false);
  };

  const onFileChange = (e) => processFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-black px-6 text-white">
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🎬</div>
        <h1 className="text-3xl font-bold tracking-tight">ScenePartner</h1>
        <p className="text-white/50 text-sm mt-2">Actor rehearsal tool</p>
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={loading}
        className={`w-full max-w-sm border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-all
          ${dragging ? 'border-white bg-white/10' : 'border-white/25 bg-white/5 hover:border-white/50 hover:bg-white/10'}
          ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        <div className="text-4xl">{loading ? '⏳' : '📄'}</div>
        <div className="text-base font-medium text-white/90">
          {loading ? 'Reading script…' : 'Upload script'}
        </div>
        <div className="text-xs text-white/40">.txt or .pdf</div>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".txt,.pdf"
        className="hidden"
        onChange={onFileChange}
      />

      {error && (
        <p className="mt-4 text-red-400 text-sm text-center max-w-sm">{error}</p>
      )}

      <p className="mt-8 text-white/25 text-xs text-center max-w-xs">
        Format your script as<br />
        <span className="text-white/40 font-mono">CHARACTER: dialogue text</span>
      </p>
    </div>
  );
}
