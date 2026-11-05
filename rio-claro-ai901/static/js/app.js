document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("invoice");
  const preview = document.getElementById("file-preview");
  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    preview.textContent = file
      ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : "";
  });
});
