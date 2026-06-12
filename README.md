# Doc2MD

Aplicación web para convertir múltiples archivos `.docx` a Markdown, lista para desplegarse en Vercel.

## Funcionalidad

- Sube uno o varios archivos `.docx` (arrastrar y soltar o selector de archivos).
- Cada archivo se convierte a Markdown en el servidor (usando `mammoth` + `turndown`).
- Descarga cada archivo `.md` individualmente o todos juntos en un `.zip`.
- Los archivos `.doc` (formato antiguo de Word 97-2003) no son compatibles; deben convertirse a `.docx` primero.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## Despliegue en Vercel

Este proyecto es una app Next.js estándar (App Router) y se puede desplegar directamente en [Vercel](https://vercel.com/new) sin configuración adicional.
