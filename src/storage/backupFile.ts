import { backupFileName, exportBackup, importBackup, parseBackup } from "./backup.ts";

/** Write the backup to a file: via the share sheet on phones that support it, else as a download. */
export async function saveBackupFile(): Promise<"shared" | "downloaded"> {
  const backup = await exportBackup();
  const text = JSON.stringify(backup);
  const name = backupFileName();
  const file = new File([text], name, { type: "application/json" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Toonvast back-up" });
      return "shared";
    } catch {
      // Cancelled or refused: fall through to a plain download.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}

let picker: HTMLInputElement | null = null;

/**
 * The file input lives in the document and is reused: iOS Safari never fires `change` on an input that was created
 * on the fly and left out of the DOM, so a restore there silently did nothing.
 */
function filePicker(): HTMLInputElement {
  if (picker && picker.isConnected) return picker;
  picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.setAttribute("aria-hidden", "true");
  picker.tabIndex = -1;
  Object.assign(picker.style, { position: "fixed", left: "-9999px", width: "1px", height: "1px", opacity: "0" });
  document.body.appendChild(picker);
  return picker;
}

/** Let the user pick a backup file and merge it in; resolves with the number of profiles in the file, null when cancelled. */
export function restoreBackupFile(): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const input = filePicker();
    input.value = "";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const backup = parseBackup(await file.text());
        if (backup.profiles.length === 0) throw new Error("Deze back-up bevat geen profielen.");
        const result = await importBackup(backup);
        resolve(result.profiles);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
