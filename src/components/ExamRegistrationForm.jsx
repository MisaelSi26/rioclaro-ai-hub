import { useRef, useState } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ExamRegistrationForm() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  function validateFile(file) {
    if (!file) {
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      fileInputRef.current.value = '';
      setSelectedFile(null);
      setFileError('Solo se permiten archivos PDF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      fileInputRef.current.value = '';
      setSelectedFile(null);
      setFileError('El PDF no puede superar los 10 MB.');
      return;
    }

    setSelectedFile(file);
    setFileError('');
  }

  function handleFileChange(event) {
    validateFile(event.target.files[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    validateFile(event.dataTransfer.files[0]);
  }

  function handleSubmit(event) {
    event.preventDefault();
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="nombre">Nombre completo <span aria-hidden="true">*</span></label>
        <input type="text" id="nombre" name="nombre" autoComplete="name" required />
      </div>

      <div className="field">
        <label htmlFor="telefono">Teléfono <span aria-hidden="true">*</span></label>
        <input type="tel" id="telefono" name="telefono" autoComplete="tel" required />
      </div>

      <div className="field">
        <label htmlFor="correo">Correo electrónico <span aria-hidden="true">*</span></label>
        <input type="email" id="correo" name="correo" autoComplete="email" required />
      </div>

      <div className="field">
        <label htmlFor="direccion">Dirección <small>(opcional)</small></label>
        <textarea id="direccion" name="direccion" autoComplete="street-address" />
      </div>

      <div className="field">
        <label htmlFor="edad">Edad <span aria-hidden="true">*</span></label>
        <input type="number" id="edad" name="edad" min="1" max="120" required />
      </div>

      <div className="field">
        <label htmlFor="documento">Documento PDF <span aria-hidden="true">*</span></label>
        <div
          className={`file-dropzone${fileError ? ' has-error' : ''}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openFilePicker();
            }
          }}
          role="button"
          tabIndex="0"
          aria-describedby={fileError ? 'documento-error' : 'documento-help'}
        >
          <strong>{selectedFile ? selectedFile.name : 'Arrastra tu PDF aquí'}</strong>
          <span>{selectedFile ? 'Archivo listo para cargar' : 'o haz clic para buscarlo en tu dispositivo'}</span>
          <small id="documento-help">Solo PDF · máximo 10 MB</small>
          <input
            ref={fileInputRef}
            type="file"
            id="documento"
            name="documento"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            required
          />
        </div>
        {fileError && <p className="field-error" id="documento-error" role="alert">{fileError}</p>}
      </div>

      <button type="submit">Registrarme al examen</button>
      <p className="note"><span aria-hidden="true">*</span> Campos obligatorios</p>
    </form>
  );
}

export default ExamRegistrationForm;
