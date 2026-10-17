// Visor de PDF dentro de la propia tarjeta digital.
//
// El cliente pidió que los PDF ya no abran una pestaña nueva: al pulsar el
// botón del menú o los "Ver PDF", el documento se muestra aquí mismo, en una
// capa a pantalla completa, con un botón para volver al menú. El botón "atrás"
// del teléfono también cierra el visor en vez de salir de la página.
//
// El motor que dibuja el PDF (pdf.js) se descarga solo la primera vez que
// alguien abre un documento, así que no pesa nada en la carga inicial.
//
// Los enlaces originales (.pdf en Firebase Storage) se conservan intactos:
// siguen funcionando si el JavaScript no carga y sirven para "abrir en otra
// pestaña" cuando alguien quiere imprimir o guardar el documento.
import { useEffect, useRef, useState } from 'react';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

interface Documento {
  url: string;
  titulo: string;
}

export default function PdfViewer() {
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState({ pintadas: 0, total: 0 });

  const contenido = useRef<HTMLDivElement | null>(null);
  const abierto = useRef(false);
  const scrollPrevio = useRef(0);
  const entradaHistorial = useRef(false);

  function abrir(siguiente: Documento) {
    scrollPrevio.current = window.scrollY;
    setDocumento(siguiente);
    setError('');
    setCargando(true);
    setProgreso({ pintadas: 0, total: 0 });
    abierto.current = true;
    document.body.style.overflow = 'hidden';

    // Una entrada en el historial para que el botón "atrás" del teléfono
    // cierre el visor en lugar de salir de la tarjeta.
    if (!entradaHistorial.current) {
      window.history.pushState({ zabdiPdf: true }, '', location.href);
      entradaHistorial.current = true;
    }
  }

  function cerrar(desdeHistorial = false) {
    if (!abierto.current) return;
    abierto.current = false;
    setDocumento(null);
    setCargando(false);
    setError('');
    document.body.style.overflow = '';

    // La navegación de la página vuelve arriba al cambiar de vista; devolvemos
    // al visitante a donde estaba leyendo.
    const y = scrollPrevio.current;
    window.requestAnimationFrame(() => window.scrollTo(0, y));

    if (!desdeHistorial && entradaHistorial.current) {
      entradaHistorial.current = false;
      window.history.back();
    }
  }

  // Cualquier enlace marcado con data-pdf-viewer abre el documento aquí.
  useEffect(() => {
    function alPulsar(evento: MouseEvent) {
      const destino = evento.target as HTMLElement | null;
      if (!destino || typeof destino.closest !== 'function') return;
      const enlace = destino.closest('a[data-pdf-viewer]') as HTMLAnchorElement | null;
      if (!enlace) return;
      // Con Ctrl/Cmd/Shift respetamos la pestaña nueva: es intencional.
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;

      const url = enlace.getAttribute('href');
      if (!url) return;

      evento.preventDefault();
      abrir({ url, titulo: enlace.getAttribute('data-pdf-title') || 'Documento' });
    }

    document.addEventListener('click', alPulsar);
    return () => document.removeEventListener('click', alPulsar);
  }, []);

  // Botón "atrás" del teléfono.
  useEffect(() => {
    function alVolver() {
      if (!abierto.current) return;
      entradaHistorial.current = false;
      cerrar(true);
    }

    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  // Esc para cerrar en computadora.
  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if (evento.key === 'Escape') cerrar();
    }

    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  // Dibujado del documento: una página por lienzo, en orden.
  useEffect(() => {
    if (!documento) return;
    const caja = contenido.current;
    if (!caja) return;

    let cancelado = false;
    let tareaPdf: { destroy: () => Promise<void> } | null = null;
    caja.replaceChildren();

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        if (cancelado) return;

        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        const tarea = pdfjs.getDocument({ url: documento.url });
        tareaPdf = tarea as unknown as { destroy: () => Promise<void> };
        const pdf = await tarea.promise;
        if (cancelado) return;

        setProgreso({ pintadas: 0, total: pdf.numPages });

        for (let numero = 1; numero <= pdf.numPages; numero++) {
          if (cancelado) return;

          const pagina = await pdf.getPage(numero);
          if (cancelado) return;

          // Ancho disponible real, con el doble de resolución en pantallas
          // nítidas para que el texto no se vea borroso.
          const ancho = Math.min(caja.clientWidth || 720, 900);
          const base = pagina.getViewport({ scale: 1 });
          const densidad = Math.min(window.devicePixelRatio || 1, 2);
          const vista = pagina.getViewport({ scale: (ancho / base.width) * densidad });

          const lienzo = document.createElement('canvas');
          lienzo.width = Math.floor(vista.width);
          lienzo.height = Math.floor(vista.height);
          lienzo.style.width = '100%';
          lienzo.style.height = 'auto';
          lienzo.className =
            'mx-auto block w-full max-w-[900px] rounded-lg bg-white shadow-[0_2px_18px_rgba(0,0,0,0.10)]';
          lienzo.setAttribute('role', 'img');
          lienzo.setAttribute('aria-label', `Página ${numero} de ${pdf.numPages}`);
          caja.appendChild(lienzo);

          await pagina.render({ canvas: lienzo, viewport: vista }).promise;
          if (cancelado) return;

          setProgreso({ pintadas: numero, total: pdf.numPages });
          if (numero === 1) setCargando(false);
        }
      } catch (fallo) {
        if (cancelado) return;
        console.error('No se pudo mostrar el PDF:', fallo);
        setCargando(false);
        setError('No pudimos mostrar el documento aquí.');
      }
    })();

    return () => {
      cancelado = true;
      caja.replaceChildren();
      if (tareaPdf) void tareaPdf.destroy().catch(() => {});
    };
  }, [documento]);

  if (!documento) return null;

  const terminado = progreso.total > 0 && progreso.pintadas >= progreso.total;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={documento.titulo}
      className="fixed inset-0 z-[100] flex flex-col bg-[#f4f2f0]"
    >
      <header className="flex items-center gap-3 border-b border-[#e4ded8] bg-white px-3 py-3 sm:px-6">
        <button type="button" className="td-back shrink-0" onClick={() => cerrar()} data-no-track>
          <span aria-hidden="true">←</span> Volver al menú
        </button>
        <p className="td-display min-w-0 flex-1 truncate text-center text-[1.05rem] font-bold text-[#7b5b46]">
          {documento.titulo}
        </p>
        <span className="w-[48px] shrink-0 sm:w-[132px]">
          <a
            href={documento.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-right text-xs font-bold uppercase tracking-wider text-[#cf3080] underline sm:inline"
          >
            Abrir en otra pestaña
          </a>
        </span>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6">
        {error ? (
          <div className="mx-auto mt-10 max-w-md rounded-xl bg-white p-6 text-center shadow">
            <p className="text-[#7b5b46]">{error}</p>
            <p className="mt-1 text-sm text-[#a3978c]">
              Puedes abrirlo en otra pestaña o intentarlo de nuevo.
            </p>
            <div className="td-actions mt-5">
              <a
                href={documento.url}
                target="_blank"
                rel="noopener noreferrer"
                className="td-pdf"
              >
                Abrir el PDF
              </a>
              <button type="button" className="td-back" onClick={() => cerrar()} data-no-track>
                <span aria-hidden="true">←</span> Volver al menú
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Aquí se añaden los lienzos de cada página. */}
            <div ref={contenido} className="space-y-4" />

            {terminado && (
              <div className="td-actions mt-8 mb-2">
                <button type="button" className="td-back" onClick={() => cerrar()} data-no-track>
                  <span aria-hidden="true">←</span> Volver al menú
                </button>
                <a
                  className="td-pdf"
                  href={documento.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track-label={`Abrir PDF en otra pestaña · ${documento.titulo}`}
                >
                  Abrir en otra pestaña
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {cargando && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <p
            role="status"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#7b5b46] shadow-lg"
          >
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#cf3080] border-t-transparent"
              aria-hidden="true"
            />
            {progreso.total > 1
              ? `Cargando página ${Math.min(progreso.pintadas + 1, progreso.total)} de ${progreso.total}…`
              : 'Abriendo el documento…'}
          </p>
        </div>
      )}
    </div>
  );
}
