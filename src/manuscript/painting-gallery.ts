import {paintings, paintingImage} from './paintings.js';

export function mountPaintingGallery() {
  const gallery = document.querySelector<HTMLElement>('.painting-gallery');
  const backdrop = document.querySelector<HTMLElement>('.painting');
  const panel = gallery?.querySelector<HTMLElement>('#painting-choices');
  const title = gallery?.querySelector<HTMLAnchorElement>('.painting-title');
  const credit = gallery?.querySelector<HTMLElement>('.painting-credit');
  const status = gallery?.querySelector<HTMLElement>('.painting-status');
  if (!gallery || !backdrop || !panel || !title || !credit || !status) return;

  const buttons = [...panel.querySelectorAll<HTMLButtonElement>('[data-painting]')];
  const storageKey = 'portfolio:painting:v1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected: string = paintings[0].id;
  let request = 0;
  let resize: Animation | null = null;
  let titleResize: Animation | null = null;

  function stopResize() {
    resize?.cancel(); resize = null;
    titleResize?.cancel(); titleResize = null;
    delete gallery!.dataset.resizing;
  }

  function updateContent(update: () => void) {
    // Start from the visible height, including an interrupted resize.
    const from = gallery!.getBoundingClientRect().height;
    const titleFrom = title!.getBoundingClientRect().height;
    stopResize();
    update();
    const to = gallery!.getBoundingClientRect().height;
    const titleTo = title!.getBoundingClientRect().height;
    if (reducedMotion.matches || !from || !to || Math.abs(from - to) < .5) return;
    gallery!.dataset.resizing = 'true';
    const timing = {duration: 650, easing: 'cubic-bezier(.42, 0, .18, 1)'};
    resize = gallery!.animate([{height: `${from}px`}, {height: `${to}px`}], timing);
    // Reveal extra title lines as their space opens. The credit follows in
    // normal flow, so it always stays below the visible title.
    if (Math.abs(titleFrom - titleTo) >= .5) {
      titleResize = title!.animate([{height: `${titleFrom}px`}, {height: `${titleTo}px`}], timing);
    }
    resize.onfinish = () => { resize = null; delete gallery!.dataset.resizing; };
  }
  window.addEventListener('resize', stopResize);
  reducedMotion.addEventListener('change', stopResize);

  async function select(id: string, remember = true) {
    const painting = paintings.find(item => item.id === id);
    if (!painting) return;
    const revision = ++request;
    updateContent(() => { status!.textContent = ''; delete status!.dataset.error; });
    if (id === selected) { gallery!.removeAttribute('aria-busy'); return; }
    gallery!.setAttribute('aria-busy', 'true');
    const image = new Image();
    image.src = paintingImage(id); image.alt = ''; image.className = 'painting-image';
    try {
      await image.decode();
      if (request !== revision) return;
      // The old painting stays visible until the replacement is decoded.
      backdrop!.replaceChildren(image);
      selected = id;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.painting === id)));
      updateContent(() => {
        title!.textContent = painting.title; title!.href = painting.source;
        credit!.textContent = `${painting.artist}, ${painting.year}`;
        status!.textContent = `${painting.title} by ${painting.artist}`;
      });
      if (remember) {
        try { localStorage.setItem(storageKey, id); } catch { /* Selection still works without storage. */ }
      }
    } catch {
      if (request === revision) {
        updateContent(() => {
          status!.textContent = "Couldn't load that painting. Please try again.";
          status!.dataset.error = 'true';
        });
      }
    } finally {
      if (request === revision) gallery!.removeAttribute('aria-busy');
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => { void select(button.dataset.painting!); }));
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) void select(saved, false);
  } catch { /* Use the default painting when storage is unavailable. */ }
}
