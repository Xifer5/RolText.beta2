export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function deepClone(obj) { return structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)); }

/**
 * Resolve an icon field into a usable src URL.
 * Accepts:
 * - string emoji or full URL
 * - filename (e.g. "sword.png") which will be prefixed by window.ASSET_BASE or default './img/items/'
 * - object { type: 'img', src: 'sword.png' }
 */
export function resolveIconSrc(icon) {
	if (!icon) return null;
	if (typeof icon === 'object') {
		if (icon.type === 'img' && icon.src) return icon.src;
		return null;
	}
	if (typeof icon !== 'string') return null;
	// if looks like URL or contains a path, use as-is
	if (icon.startsWith('http') || icon.includes('/')) return icon;
	// if likely a filename, build using base
	if (/\.(png|jpe?g|gif|webp|svg)$/i.test(icon)) {
		const base = window.ASSET_BASE || './img/items/';
		return base + icon;
	}
	return null; // emoji or text will be handled as text elsewhere
}

export function createIconElement(icon, size = 40) {
	const src = resolveIconSrc(icon);
	if (src) {
		const img = document.createElement('img');
		img.src = src;
		img.width = size; img.height = size;
		img.alt = '';
		img.className = 'item-icon-img';
		// fallback: if image fails to load, switch to emoji/text so the UI doesn't show a broken URL
		img.onerror = () => {
			const txt = document.createElement('div');
			txt.className = 'item-icon-text';
			txt.style.width = size + 'px';
			txt.style.height = size + 'px';
			txt.style.display = 'flex'; txt.style.alignItems = 'center'; txt.style.justifyContent = 'center';
			txt.textContent = '✨';
			img.replaceWith(txt);
		};
		return img;
	}

	// fallback: render the icon as text (emoji or plain string)
	const wrapper = document.createElement('div');
	wrapper.className = 'item-icon-text';
	wrapper.style.width = size + 'px';
	wrapper.style.height = size + 'px';
	wrapper.style.display = 'flex';
	wrapper.style.alignItems = 'center';
	wrapper.style.justifyContent = 'center';
	wrapper.style.fontSize = Math.floor(size * 0.6) + 'px';
	wrapper.style.lineHeight = '1';
	wrapper.textContent = (typeof icon === 'string') ? icon : '✨';
	return wrapper;
}