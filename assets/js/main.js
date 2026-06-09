// Navigation year (gallery → gallery.js)
(function () {
  const yearEl = document.getElementById('y');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
