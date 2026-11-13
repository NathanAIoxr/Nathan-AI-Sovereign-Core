/* Nathan AI Desktop Game Support — additive, no gameplay engine replacement. */
(function () {
  'use strict';
  var loader = document.currentScript;
  if (!loader || !loader.src) return;
  var source = new URL(loader.src, document.baseURI);
  var websites = new URL('../nathan-ai/websites/', source);
  var atlas = new URL('../nathan-ai/games/', source);
  var carnival = new URL('../nathan-ai/games/political-carnival/', source);
  function element(tag, cls, content) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content) el.textContent = content;
    return el;
  }
  function init() {
    if (document.querySelector('[data-nathan-desktop-support]')) return;
    document.documentElement.classList.add('nathan-desktop-game');
    var main = document.querySelector('main') || document.body;
    var toolbar = element('section', 'nathan-desktop-toolbar');
    toolbar.setAttribute('data-nathan-desktop-support', '');
    toolbar.setAttribute('aria-label', 'Desktop game controls');
    var first = element('div', 'nathan-desktop-top');
    var label = element('strong', '', 'DESKTOP PLAY');
    var links = element('div', 'nathan-desktop-links');
    var back = element('a', '', 'Games & puzzles');
    back.href = atlas.href;
    var politicalCarnival = element('a', '', 'Political Carnival');
    politicalCarnival.href = carnival.href;
    var all = element('a', '', 'All Nathan AI websites');
    all.href = websites.href;
    links.append(back, politicalCarnival, all);
    first.append(label, links);
    var actions = element('div', 'nathan-desktop-actions');
    var focus = element('button', '', 'Focus gameplay');
    focus.type = 'button';
    focus.setAttribute('aria-label', 'Move keyboard focus into the game');
    var fullscreen = element('button', '', 'Fullscreen');
    fullscreen.type = 'button';
    fullscreen.setAttribute('aria-label', 'Enter or exit full screen game view');
    var help = element('details', 'nathan-desktop-help');
    var summary = element('summary', '', 'Keyboard & mouse help');
    var helpText = element('p', '', 'On desktop, use Tab and Shift+Tab to reach game controls. Press Enter or Space to activate the focused button. Use your mouse on game boards and canvases. Game-specific shortcuts shown in the game remain available. Press ? to open or close this help, and Escape to close it. Browser zoom remains available.');
    help.append(summary, helpText);
    var status = element('p', 'nathan-desktop-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    actions.append(focus, fullscreen, help);
    toolbar.append(first, actions, status);
    main.insertBefore(toolbar, main.firstChild);
    var canvases = main.querySelectorAll('canvas');
    canvases.forEach(function (canvas) {
      if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '0');
    });
    focus.addEventListener('click', function () {
      var els = main.querySelectorAll('canvas, button, [role="button"], input, select, textarea, a[href], [tabindex]');
      var target = Array.from(els).find(function (node) {
        if (toolbar.contains(node) || node.disabled || node.closest('[hidden], [aria-hidden="true"]')) return false;
        var rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (target) {
        if (!target.hasAttribute('tabindex') && !/^(BUTTON|INPUT|SELECT|TEXTAREA|A|CANVAS)$/.test(target.tagName)) target.setAttribute('tabindex', '0');
        target.focus({ preventScroll: false });
        status.textContent = 'Keyboard focus moved into gameplay.';
      } else status.textContent = 'No active game control is available in this view.';
    });
    fullscreen.addEventListener('click', function () {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) Promise.resolve(document.exitFullscreen()).catch(function () {
          status.textContent = 'Could not exit fullscreen. Press Escape.';
        });
        return;
      }
      if (!main.requestFullscreen) {
        status.textContent = 'Fullscreen is unavailable in this browser. Use the standard window controls.';
        return;
      }
      Promise.resolve(main.requestFullscreen()).catch(function () {
        status.textContent = 'Fullscreen was blocked by this browser.';
      });
    });
    function updateFullscreen() {
      fullscreen.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
      fullscreen.setAttribute('aria-pressed', String(!!document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', updateFullscreen);
    updateFullscreen();
    document.addEventListener('keydown', function (event) {
      if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
      var target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      if (event.key === '?' && !event.repeat) {
        help.open = !help.open;
      } else if (event.key === 'Escape' && help.open) {
        help.open = false;
      }
    });
    window.addEventListener('error', function (event) {
      if (!event.message) return;
      status.textContent = 'A script error occurred in this page. The original game remains available to reload.';
    });
    window.addEventListener('unhandledrejection', function () {
      status.textContent = 'A page operation failed. Reload the game if controls stop responding.';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
