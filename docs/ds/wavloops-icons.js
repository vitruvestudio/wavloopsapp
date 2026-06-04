/* ============================================================
   Wavloops — Icon set
   wavloops-icons.js · the brand's own icon system
   ------------------------------------------------------------
   Geometric, editorial, premium. 24px grid · 1.7px stroke ·
   currentColor · round caps/joins. Filled glyphs (play, bolt,
   spark, dots) declare their own fill inline.

   USE — three ways:

   1) Inline attribute (vanilla HTML):
        <span data-wv-icon="upload"></span>
        <span data-wv-icon="play" data-size="32" data-stroke="2"></span>
      Then call WavloopsIcons.hydrate() (auto-runs on DOMContentLoaded).

   2) Web component:
        <wv-icon name="cart" size="20"></wv-icon>

   3) Programmatic (returns an SVG string):
        el.innerHTML = WavloopsIcons.svg('youtube', { size: 18 });

   Color follows currentColor — set `color:` on the element.
   List every name: WavloopsIcons.names()
   ============================================================ */
(function (root) {
  // name -> inner SVG markup (paths). Stroke icons: no fill.
  // Filled glyphs set fill="currentColor" stroke="none" on their paths.
  var ICONS = {
    /* ---- navigation / app shell ---- */
    upload:           '<path d="M12 16V5"/><path d="M8 9l4-4 4 4"/><path d="M5 19.5h14"/>',
    library:          '<path d="M4 19V6l5.5 1.4v12.2L4 19Z"/><path d="M14.5 7.4L20 6v12.2l-5.5 1.4V7.4Z"/><path d="M10 7.2v12.4"/>',
    'visual-library': '<rect x="4" y="4" width="6.4" height="6.4" rx="1.4"/><rect x="13.6" y="4" width="6.4" height="6.4" rx="1.4"/><rect x="4" y="13.6" width="6.4" height="6.4" rx="1.4"/><rect x="13.6" y="13.6" width="6.4" height="6.4" rx="1.4"/>',
    'producer-wall':  '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.6 2.4 14.4 0 17"/><path d="M12 3.5c-2.4 2.6-2.4 14.4 0 17"/>',
    queue:            '<rect x="4" y="5" width="16" height="15" rx="2.4"/><path d="M4 9.6h16"/><path d="M8.5 3v4"/><path d="M15.5 3v4"/><path d="M8 14h8M8 17h5"/>',
    settings:         '<circle cx="12" cy="12" r="3.1"/><path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.36 5.64l-1.7 1.7M7.34 16.66l-1.7 1.7M18.36 18.36l-1.7-1.7M7.34 7.34l-1.7-1.7"/>',
    home:             '<path d="M4 11l8-7 8 7"/><path d="M6 9.4V20h12V9.4"/><path d="M10 20v-5h4v5"/>',
    search:           '<circle cx="11" cy="11" r="6.4"/><path d="M15.8 15.8L20.5 20.5"/>',
    bell:             '<path d="M6.5 10a5.5 5.5 0 0111 0c0 4.6 2.1 5.8 2.1 5.8H4.4S6.5 14.6 6.5 10Z"/><path d="M10 19a2 2 0 004 0"/>',
    grid:             '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',

    /* ---- playback ---- */
    play:             '<path d="M8 5.4v13.2L19 12z" fill="currentColor" stroke="none"/>',
    pause:            '<rect x="7.5" y="5.5" width="3.2" height="13" rx="1.1" fill="currentColor" stroke="none"/><rect x="13.3" y="5.5" width="3.2" height="13" rx="1.1" fill="currentColor" stroke="none"/>',
    'skip-forward':   '<path d="M6 5.5v13l8.5-6.5z" fill="currentColor" stroke="none"/><rect x="15.6" y="5.5" width="2.6" height="13" rx="1" fill="currentColor" stroke="none"/>',
    'skip-back':      '<path d="M18 5.5v13L9.5 12z" fill="currentColor" stroke="none"/><rect x="5.8" y="5.5" width="2.6" height="13" rx="1" fill="currentColor" stroke="none"/>',
    shuffle:          '<path d="M4 6.5h3.2l9 11H20"/><path d="M4 17.5h3.2l3-3.6"/><path d="M13.5 9.1l3-2.6"/><path d="M17.5 4.2l3 2.3-3 2.3"/><path d="M17.5 14.8l3 2.7-3 2.5"/>',
    repeat:           '<path d="M4 9.5V8.5A3 3 0 017 5.5h10"/><path d="M14 2.6l3.2 2.9L14 8.4"/><path d="M20 14.5v1a3 3 0 01-3 3H7"/><path d="M10 21.4l-3.2-2.9L10 15.6"/>',
    volume:           '<path d="M4 9.4v5.2h3.4L13 19V5L7.4 9.4H4Z" fill="currentColor" stroke="none"/><path d="M16.2 9.2a4 4 0 010 5.6"/><path d="M18.8 6.6a7.5 7.5 0 010 10.8"/>',

    /* ---- audio / metadata ---- */
    waveform:         '<path d="M4 10v4"/><path d="M8 6.5v11"/><path d="M12 3v18"/><path d="M16 7.5v9"/><path d="M20 10v4"/>',
    bpm:              '<path d="M3 12.5h3.4l1.8-6 3 13 2.8-9 1.6 2H21"/>',
    key:              '<circle cx="8.3" cy="8.3" r="4.3"/><path d="M11.3 11.3l8.2 8.2"/><path d="M16.5 16.5l2-2"/><path d="M18.4 18.4l1.6-1.6"/>',
    mood:             '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 000 17V3.5Z" fill="currentColor" stroke="none" opacity="0.32"/>',
    'file-audio':     '<path d="M6 3.5h7.5L18 8v12.5H6Z"/><path d="M13.5 3.5V8H18"/><path d="M10.5 12.6l3.2-.8v3.4"/><circle cx="9.6" cy="16.2" r="1.3"/><circle cx="13.7" cy="14.8" r="1.3"/>',
    'file-wave':      '<path d="M6 3.5h7.5L18 8v12.5H6Z"/><path d="M13.5 3.5V8H18"/><path d="M8 14.5h1l1-2.4 1.6 4.4 1.1-3.2 1 1.2H15"/>',
    'file-stems':     '<path d="M6 3.5h7.5L18 8v12.5H6Z"/><path d="M13.5 3.5V8H18"/><path d="M9 12.4h6M9 15.2h6M9 18h4"/>',
    zip:              '<path d="M6 3.5h12v17H6Z"/><path d="M11 3.5v2M13 5.5v2M11 7.5v2M13 9.5v2"/><rect x="10.4" y="12.4" width="3.2" height="4.4" rx="1.2"/>',
    download:         '<path d="M12 4v11"/><path d="M8 11l4 4 4-4"/><path d="M5 19.5h14"/>',
    cover:            '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M5 18l4.6-4.6 3 3L16 13l3.5 3.5"/>',

    /* ---- commerce ---- */
    cart:             '<circle cx="9.6" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2.2l2.3 12h10l1.9-8.6H6"/>',
    'price-tag':      '<path d="M4 12.5V5a1 1 0 011-1h7.5L20 11.5a1.5 1.5 0 010 2.1l-6.4 6.4a1.5 1.5 0 01-2.1 0L4 12.5Z"/><circle cx="8.4" cy="8.4" r="1.2" fill="currentColor" stroke="none"/>',
    link:             '<path d="M9.6 14.4l4.8-4.8"/><path d="M8 11l-2 2a3.5 3.5 0 005 5l2-2"/><path d="M16 13l2-2a3.5 3.5 0 00-5-5l-2 2"/>',
    lock:             '<rect x="5" y="11" width="14" height="9" rx="2.4"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    unlock:           '<rect x="5" y="11" width="14" height="9" rx="2.4"/><path d="M8 11V8a4 4 0 017.8-1.4"/>',
    store:            '<path d="M4.2 9l1.1-4h13.4L19.8 9"/><path d="M4.2 9a2.4 2.4 0 004.8 0 2.4 2.4 0 004.8 0 2.4 2.4 0 004.8 0"/><path d="M5.2 9.6V20h13.6V9.6"/><path d="M9.6 20v-5h4.8v5"/>',
    wallet:           '<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 10.2h17"/><circle cx="16.4" cy="14.6" r="1.2" fill="currentColor" stroke="none"/>',

    /* ---- workflow / status ---- */
    check:            '<path d="M5 12.5l4.6 4.5L19 7"/>',
    'check-circle':   '<circle cx="12" cy="12" r="8.5"/><path d="M8.4 12.4l2.6 2.6 4.6-5"/>',
    x:                '<path d="M6 6l12 12M18 6L6 18"/>',
    plus:             '<path d="M12 5v14M5 12h14"/>',
    minus:            '<path d="M5 12h14"/>',
    'chevron-right':  '<path d="M9.5 5l7 7-7 7"/>',
    'chevron-down':   '<path d="M5 9.5l7 7 7-7"/>',
    'arrow-right':    '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
    'arrow-up-right': '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',
    bolt:             '<path d="M13 3L5 13.5h5.2L9 21l8-10.5h-5.2L13 3Z" fill="currentColor" stroke="none"/>',
    spark:            '<path d="M12 3l1.8 5.4L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-1.6L12 3Z" fill="currentColor" stroke="none"/>',
    target:           '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    clock:            '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.4V12l3.2 2"/>',
    calendar:         '<rect x="4" y="5" width="16" height="15" rx="2.4"/><path d="M4 9.6h16"/><path d="M8.5 3v4"/><path d="M15.5 3v4"/>',
    send:             '<path d="M20 4L3 11l6.2 2.6L20 4Z"/><path d="M20 4l-6.6 16-2.6-7L20 4Z"/>',

    /* ---- people / social ---- */
    user:             '<circle cx="12" cy="8.4" r="3.6"/><path d="M5.4 20c0-3.6 2.9-6 6.6-6s6.6 2.4 6.6 6"/>',
    'user-add':       '<circle cx="9" cy="8.4" r="3.6"/><path d="M3 20c0-3.6 2.7-6 6-6 1.3 0 2.5.4 3.5 1"/><path d="M18 13v6M15 16h6"/>',
    heart:            '<path d="M12 20S4 14.6 4 9.3A4.2 4.2 0 0112 6a4.2 4.2 0 018 3.3C20 14.6 12 20 12 20Z"/>',
    eye:              '<path d="M2.5 12S6 5.6 12 5.6 21.5 12 21.5 12 18 18.4 12 18.4 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    more:             '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    edit:             '<path d="M5 19h6"/><path d="M16.5 4.5l3 3L9 18l-4 1 1-4 10.5-10.5Z"/>',
    share:            '<circle cx="6" cy="12" r="2.6"/><circle cx="17" cy="6" r="2.6"/><circle cx="17" cy="18" r="2.6"/><path d="M8.4 10.8l6.2-3.6M8.4 13.2l6.2 3.6"/>',
    filter:           '<path d="M4 5h16l-6.2 7.2v6.3l-3.6 1.8v-8.1L4 5Z"/>',

    /* ---- platform marks (drawn in the Wavloops stroke style) ---- */
    youtube:          '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="M10.4 9.3l4.6 2.7-4.6 2.7z" fill="currentColor" stroke="none"/>',
    soundcloud:       '<path d="M3 14.5v3M6 11.5v6M9 9.5v8"/><path d="M12 17.5V9.5a4 4 0 017.8-1.3A3 3 0 0119 17.5h-7Z"/>',
    discord:          '<path d="M8 8.3a12 12 0 018 0"/><path d="M8 8.3C5.6 8.9 4.6 12.6 5 16.4c1.4 1 2.9 1.6 2.9 1.6l1-1.9"/><path d="M16 8.3c2.4.6 3.4 4.3 3 8.1-1.4 1-2.9 1.6-2.9 1.6l-1-1.9"/><circle cx="9.6" cy="13" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.4" cy="13" r="1.1" fill="currentColor" stroke="none"/>',
    instagram:        '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="16.6" cy="7.4" r="1" fill="currentColor" stroke="none"/>',
    email:            '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4.2 7.2l7.8 5.8 7.8-5.8"/>',

    /* ---- brand ---- */
    'wavloops-mark':  '<path d="M3 9c1.4 0 1.4 6 2.8 6S7.2 9 8.6 9s1.4 6 2.8 6S12.8 9 14.2 9s1.4 6 2.8 6S18.4 9 21 9"/>',
  };

  function svg(name, opts) {
    opts = opts || {};
    var size = opts.size || 24;
    var stroke = opts.stroke != null ? opts.stroke : 1.7;
    var color = opts.color || 'currentColor';
    var inner = ICONS[name];
    if (inner == null) {
      // graceful fallback: a dotted box so a missing name is visible, not invisible
      inner = '<rect x="4" y="4" width="16" height="16" rx="3" stroke-dasharray="2 3"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + stroke +
      '" stroke-linecap="round" stroke-linejoin="round" class="wv-icon" data-icon="' + name + '">' +
      inner + '</svg>';
  }

  function hydrate(rootEl) {
    (rootEl || document).querySelectorAll('[data-wv-icon]').forEach(function (el) {
      if (el.getAttribute('data-wv-hydrated') === '1') return;
      el.innerHTML = svg(el.getAttribute('data-wv-icon'), {
        size: +el.getAttribute('data-size') || 24,
        stroke: el.getAttribute('data-stroke') != null ? +el.getAttribute('data-stroke') : 1.7
      });
      el.setAttribute('data-wv-hydrated', '1');
      el.style.display = el.style.display || 'inline-flex';
    });
  }

  // optional web component: <wv-icon name="cart" size="20" stroke="1.7">
  if (root.customElements && !root.customElements.get('wv-icon')) {
    root.customElements.define('wv-icon', class extends HTMLElement {
      static get observedAttributes() { return ['name', 'size', 'stroke']; }
      connectedCallback() { this.render(); }
      attributeChangedCallback() { this.render(); }
      render() {
        this.style.display = 'inline-flex';
        this.style.lineHeight = '0';
        this.innerHTML = svg(this.getAttribute('name'), {
          size: +this.getAttribute('size') || 24,
          stroke: this.getAttribute('stroke') != null ? +this.getAttribute('stroke') : 1.7
        });
      }
    });
  }

  root.WavloopsIcons = {
    svg: svg,
    hydrate: hydrate,
    has: function (name) { return Object.prototype.hasOwnProperty.call(ICONS, name); },
    names: function () { return Object.keys(ICONS); },
    raw: ICONS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { hydrate(); });
  } else {
    hydrate();
  }
})(window);
