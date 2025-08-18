// lib/pdf.worker.ts

import "./worker-shim.js"; // <-- THE FIX: Import the shim first!

import { expose } from "comlink";
import { renderPdfToBlob } from "./renderPdfToBlob"; // Adjust path if needed
import type { CatalogDocumentProps } from "@/components/app/CatalogBuilder/CatalogDocument";

/**
 * The API definition for our Web Worker.
 * This is what the main thread will interact with.
 */
const workerApi = {
  render: (props: CatalogDocumentProps) => renderPdfToBlob(props),
};

// Expose the API to the main thread
expose(workerApi);

// Export the type for type-safety on the main thread
export type PdfWorkerApi = typeof workerApi;
