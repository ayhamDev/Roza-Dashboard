// lib/render-pdf.ts

import {
  CatalogDocument,
  type CatalogDocumentProps,
} from "@/components/app/CatalogBuilder/CatalogDocument";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";

/**
 * Renders the CatalogDocument component to a PDF Blob.
 * This function is designed to be run inside a Web Worker.
 * @param props The props required by the CatalogDocument component.
 * @returns A Promise that resolves with the generated PDF Blob.
 */

export const renderPdfToBlob = async (
  props: CatalogDocumentProps
): Promise<Blob> => {
  console.log("renderPdfToBlob");

  // Create the React element from your component and props
  const element = createElement(CatalogDocument, props);

  // Assert the type of the element to satisfy TypeScript
  // This tells TypeScript to trust that `element` is a valid input for `pdf()`
  const blob = await pdf(element as any)?.toBlob(); // <--- THE FIX IS HERE
  console.log(blob);

  return blob;
};
