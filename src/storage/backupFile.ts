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

/** Let the user pick a backup file and merge it in; resolves with the number of profiles in the file. */
export function restoreBackupFile(): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const backup = parseBackup(await file.text());
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
