import mammoth from "mammoth";
import TurndownService from "turndown";

export const runtime = "nodejs";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

turndown.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

function toMarkdownFilename(originalName: string) {
  const base = originalName.replace(/\.docx?$/i, "");
  return `${base}.md`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return Response.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  const results: { name: string; markdown?: string; error?: string }[] = [];

  for (const file of files) {
    const lowerName = file.name.toLowerCase();

    if (!lowerName.endsWith(".docx") && !lowerName.endsWith(".doc")) {
      results.push({ name: file.name, error: "Formato no soportado. Usa .doc o .docx." });
      continue;
    }

    if (lowerName.endsWith(".doc")) {
      results.push({
        name: file.name,
        error: "El formato .doc (Word 97-2003) no es compatible. Convierte el archivo a .docx e inténtalo de nuevo.",
      });
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { value: html } = await mammoth.convertToHtml({ buffer });
      const markdown = turndown.turndown(html).trim() + "\n";
      results.push({ name: toMarkdownFilename(file.name), markdown });
    } catch (error) {
      results.push({
        name: file.name,
        error: error instanceof Error ? error.message : "Error desconocido al convertir el archivo.",
      });
    }
  }

  const successful = results.filter((r) => r.markdown);
  const status = successful.length === 0 ? 400 : 200;

  return Response.json({ results }, { status });
}
