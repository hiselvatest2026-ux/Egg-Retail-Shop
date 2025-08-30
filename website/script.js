// Tiny JS – nav toggler, product filter, and basic year
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const open = navMenu.style.display === 'block';
      navMenu.style.display = open ? 'none' : 'block';
      navToggle.setAttribute('aria-expanded', String(!open));
    });
  }

  const filterInput = document.getElementById('filterInput');
  const grid = document.getElementById('productGrid');
  if (filterInput && grid) {
    filterInput.addEventListener('input', () => {
      const q = filterInput.value.trim().toLowerCase();
      Array.from(grid.children).forEach(li => {
        const tags = (li.getAttribute('data-tags') || '').toLowerCase();
        li.style.display = tags.includes(q) ? '' : 'none';
      });
    });
  }

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

