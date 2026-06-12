"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";

type ConvertResult = {
  name: string;
  markdown?: string;
  error?: string;
};

export default function Home() {
  const [results, setResults] = useState<ConvertResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsLoading(true);
    setResults([]);

    const files = Array.from(fileList);
    const allResults: ConvertResult[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("files", file);

      try {
        const response = await fetch("/api/convert", {
          method: "POST",
          body: formData,
        });

        const data = await response.json().catch(() => null);

        if (!data || !Array.isArray(data.results)) {
          allResults.push({
            name: file.name,
            error:
              response.status === 413
                ? "El archivo es demasiado grande para procesarlo."
                : "Ocurrió un error al convertir el archivo.",
          });
          continue;
        }

        allResults.push(...data.results);
      } catch {
        allResults.push({
          name: file.name,
          error: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
        });
      }
    }

    setResults(allResults);
    setIsLoading(false);
  };

  const downloadMarkdown = (result: ConvertResult) => {
    if (!result.markdown) return;
    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const successful = results.filter((r) => r.markdown);
    if (successful.length === 0) return;

    const zip = new JSZip();
    successful.forEach((result) => {
      zip.file(result.name, result.markdown ?? "");
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "markdown-files.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  const successCount = results.filter((r) => r.markdown).length;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-12">
        <header className="flex flex-col gap-2 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Doc2MD
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Sube uno o varios archivos <code className="font-mono">.docx</code> y conviértelos a
            Markdown.
          </p>
        </header>

        <section
          className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-10 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFiles(event.dataTransfer.files);
          }}
        >
          <p className="text-zinc-700 dark:text-zinc-300">
            Arrastra tus archivos aquí o
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-300"
          >
            Seleccionar archivos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Solo se admiten archivos .docx. Los archivos .doc antiguos deben convertirse primero a
            .docx.
          </p>
        </section>

        {isLoading && (
          <p className="text-center text-zinc-600 dark:text-zinc-400">Convirtiendo archivos…</p>
        )}

        {results.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                Resultados ({successCount}/{results.length})
              </h2>
              {successCount > 1 && (
                <button
                  type="button"
                  onClick={downloadAllAsZip}
                  className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  Descargar todo (.zip)
                </button>
              )}
            </div>

            <ul className="flex flex-col gap-3">
              {results.map((result, index) => (
                <li
                  key={`${result.name}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-black dark:text-zinc-50">{result.name}</span>
                    {result.error && (
                      <span className="text-sm text-red-600 dark:text-red-400">{result.error}</span>
                    )}
                  </div>
                  {result.markdown && (
                    <button
                      type="button"
                      onClick={() => downloadMarkdown(result)}
                      className="shrink-0 rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
                    >
                      Descargar .md
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
