import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2, FolderOpen, Search } from 'lucide-react';
import { DjangoFileEntry } from '../types/resume';

export const DjangoCodebaseExplorer: React.FC = () => {
  const [files, setFiles] = useState<DjangoFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    fetch('/api/django-project/tree')
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load Django codebase.');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const loaded: DjangoFileEntry[] = data.files || [];
        setFiles(loaded);
        const preferred =
          loaded.find((f) => f.path === 'resumes/models.py') || loaded[0];
        if (preferred) setSelectedPath(preferred.path);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load files.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.content.toLowerCase().includes(q)
    );
  }, [files, search]);

  const activeFile = useMemo(
    () => files.find((f) => f.path === selectedPath) || filteredFiles[0] || null,
    [files, filteredFiles, selectedPath]
  );

  const groupedFiles = useMemo(() => {
    const map = new Map<string, DjangoFileEntry[]>();
    for (const file of filteredFiles) {
      const group = file.folder;
      const existing = map.get(group) || [];
      existing.push(file);
      map.set(group, existing);
    }
    return Array.from(map.entries());
  }, [filteredFiles]);

  const handleCopy = async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const totalLines = useMemo(
    () => files.reduce((sum, f) => sum + f.lines, 0),
    [files]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Python Django Project Source
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Complete MVT project package ready for college submission ·{' '}
            <span className="tabular-nums font-medium text-slate-800">
              {files.length} files
            </span>{' '}
            ·{' '}
            <span className="tabular-nums font-medium text-slate-800">
              {totalLines.toLocaleString()} lines
            </span>
          </p>
        </div>

        <a
          href="/api/django-project/download"
          download="django_resume_creator.zip"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          Download Django Project (.zip)
        </a>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">
          Loading Django source tree...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
          {/* File Explorer Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 flex flex-col">
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter files or symbols..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="p-2 overflow-y-auto max-h-[620px] space-y-3">
              {groupedFiles.map(([folder, items]) => (
                <div key={folder}>
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {folder === 'root' ? 'django_resume_project/' : folder}
                    </span>
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {items.map((file) => {
                      const isSelected = activeFile?.path === file.path;
                      return (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => setSelectedPath(file.path)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-900 text-white font-medium'
                              : 'text-slate-700 hover:bg-slate-200/70'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <FileCode2 className="w-3.5 h-3.5 shrink-0 opacity-80" />
                            <span className="truncate">{file.name}</span>
                          </span>
                          <span
                            className={`text-[10px] tabular-nums shrink-0 ${
                              isSelected ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            {file.lines}L
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Code Viewer */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col bg-slate-950 text-slate-100">
            {activeFile ? (
              <>
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
                  <div className="text-xs font-mono-code text-slate-200 truncate">
                    django_resume_project/{activeFile.path}
                    <span className="text-slate-400 ml-2">
                      · {activeFile.language} · {activeFile.lines} lines
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy File
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-auto max-h-[620px] p-4 font-mono-code text-xs leading-6">
                  <table className="w-full border-collapse">
                    <tbody>
                      {activeFile.content.split('\n').map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="select-none pr-4 text-right text-slate-600 tabular-nums w-10 align-top">
                            {idx + 1}
                          </td>
                          <td className="whitespace-pre text-slate-100">{line || ' '}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-slate-400">
                Select a file from the left tree to inspect its source code.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
