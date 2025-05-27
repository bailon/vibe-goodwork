// services/exportService.ts

/**
 * Exports a given text content as a downloadable file.
 * @param content The string content to export.
 * @param filename The desired filename for the downloaded file (e.g., "report.txt").
 * @returns True if the export was initiated, false if content was invalid.
 */
export const exportTextAsFile = (content: string | undefined, filename: string): boolean => {
  if (!content || content.trim() === "" || content.startsWith("Fehler:")) {
    console.warn(`Export skipped for ${filename}: No valid content or content indicates an error.`);
    return false; // Indicate failure or invalid content
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true; // Indicate success
};