/**
 * Saves a Blob as a file. The link is attached to the page while it's clicked and the
 * object URL is released a moment later: revoking it straight after click() can cancel the
 * download in Firefox and Safari.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
