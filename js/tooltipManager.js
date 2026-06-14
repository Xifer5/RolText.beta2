// Tooltip global position:fixed — nunca se clipa por overflow:hidden en paneles.
// Lee [data-tooltip] y [data-tooltip-pos="bottom"] del elemento más cercano.

export function initTooltips() {
  const tip = document.createElement('div');
  tip.id = 'ui-tooltip';
  tip.setAttribute('aria-hidden', 'true');
  tip.hidden = true;
  document.body.appendChild(tip);

  let _timer;

  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-tooltip]');
    if (!el) return;
    clearTimeout(_timer);
    _timer = setTimeout(() => {
      tip.textContent = el.dataset.tooltip;
      tip.hidden = false;
      _place(tip, el);
    }, 350);
  });

  document.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-tooltip]');
    if (!el) return;
    if (!el.contains(e.relatedTarget)) {
      clearTimeout(_timer);
      tip.hidden = true;
    }
  });

  // Esconder al scroll para evitar tooltips huérfanos
  window.addEventListener('scroll', () => { clearTimeout(_timer); tip.hidden = true; }, true);
}

function _place(tip, el) {
  const r   = el.getBoundingClientRect();
  const pos = el.dataset.tooltipPos || 'top';
  const tw  = tip.offsetWidth;
  const th  = tip.offsetHeight;
  let t = pos === 'bottom' ? r.bottom + 8 : r.top - th - 8;
  let l = r.left + r.width / 2 - tw / 2;
  l = Math.max(8, Math.min(window.innerWidth  - tw - 8, l));
  t = Math.max(8, Math.min(window.innerHeight - th - 8, t));
  tip.style.top  = t + 'px';
  tip.style.left = l + 'px';
}
