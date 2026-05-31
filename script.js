/* ═══════════════════════════════════════════════════════════════
   kfr4k Portfolio — script.js
   Preloader · Custom cursor · Nav scroll · Gallery · Lightbox
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   PRELOADER
   Скрывается через ~1.8 секунды после загрузки
───────────────────────────────────────────── */
(function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // Минимальное время показа + ожидание загрузки страницы
  const hide = () => {
    setTimeout(() => {
      preloader.classList.add('done');
    }, 300);
  };

  if (document.readyState === 'complete') {
    setTimeout(hide, 1200);
  } else {
    window.addEventListener('load', () => setTimeout(hide, 1200));
  }
})();


/* ─────────────────────────────────────────────
   CUSTOM CURSOR
   Двойной курсор: точка + follower
───────────────────────────────────────────── */
(function initCursor() {
  // Не запускаем на тач-устройствах
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  if (!cursor || !follower) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // Точка — мгновенно
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Follower — с инерцией через requestAnimationFrame
  function animateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top  = followerY + 'px';
    rafId = requestAnimationFrame(animateFollower);
  }
  animateFollower();

  // Hover-эффект на интерактивных элементах
  const hoverTargets = 'a, button, .gallery-item, .tag, .social-card';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.remove('cursor-hover');
    }
  });

  // Скрываем курсор при уходе из окна
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity   = '0';
    follower.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity   = '1';
    follower.style.opacity = '1';
  });
})();


/* ─────────────────────────────────────────────
   NAVIGATION
   Добавляет backdrop при скролле + мобильное меню
───────────────────────────────────────────── */
(function initNav() {
  const nav     = document.getElementById('nav');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (!nav) return;

  // Класс .scrolled при скролле
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Мобильное меню
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = menuBtn.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
      // Блокируем скролл страницы при открытом меню
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Закрываем меню при клике на ссылку
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('open');
        mobileMenu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', false);
        mobileMenu.setAttribute('aria-hidden', true);
        document.body.style.overflow = '';
      });
    });
  }
})();


/* ─────────────────────────────────────────────
   SCROLL REVEAL
   Появление элементов при скролле через IntersectionObserver
───────────────────────────────────────────── */
(function initScrollReveal() {
  const items = document.querySelectorAll('.scroll-reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Небольшая задержка для каждого элемента в группе
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  // Добавляем cascade-задержки элементам в одном родителе
  const groups = {};
  items.forEach(item => {
    const parentId = item.parentElement?.id || item.parentElement?.className || 'root';
    groups[parentId] = groups[parentId] || [];
    groups[parentId].push(item);
  });

  Object.values(groups).forEach(group => {
    group.forEach((item, i) => {
      if (!item.dataset.delay) {
        item.dataset.delay = i * 80;
      }
    });
  });

  items.forEach(item => observer.observe(item));
})();


/* ─────────────────────────────────────────────
   LIGHTBOX
   Открытие фото по клику, навигация, закрытие
───────────────────────────────────────────── */
(function initLightbox() {
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightboxImg');
  const lightboxTitle    = document.getElementById('lightboxTitle');
  const lightboxSubtitle = document.getElementById('lightboxSubtitle');
  const closeBtn     = document.getElementById('lightboxClose');
  const prevBtn      = document.getElementById('lightboxPrev');
  const nextBtn      = document.getElementById('lightboxNext');

  if (!lightbox || !lightboxImg) return;

  // Собираем все фото в галерее
  let items = [];
  let currentIndex = 0;

  function buildItems() {
    items = Array.from(document.querySelectorAll('.gallery-item'));
  }

  function openLightbox(index) {
    buildItems();
    currentIndex = index;
    showImage(currentIndex);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Небольшая задержка перед сбросом src (анимация закрытия)
    setTimeout(() => {
      lightboxImg.src = '';
    }, 400);
  }

  function showImage(index) {
    const item = items[index];
    if (!item) return;

    const img = item.querySelector('img');
    const title    = item.dataset.title    || '';
    const subtitle = item.dataset.subtitle || '';

    // Анимация смены фото
    lightboxImg.style.opacity = '0';
    lightboxImg.style.transform = 'scale(0.97)';

    // Используем большой src если есть, иначе оригинальный
    lightboxImg.src = img?.src || '';
    lightboxImg.alt = img?.alt || title;

    lightboxImg.onload = () => {
      requestAnimationFrame(() => {
        lightboxImg.style.transition = 'opacity 0.4s ease, transform 0.5s ease';
        lightboxImg.style.opacity = '1';
        lightboxImg.style.transform = 'scale(1)';
      });
    };

    lightboxTitle.textContent    = title;
    lightboxSubtitle.textContent = subtitle;
  }

  function prev() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    showImage(currentIndex);
  }

  function next() {
    currentIndex = (currentIndex + 1) % items.length;
    showImage(currentIndex);
  }

  // Клик на кнопку раскрытия внутри gallery-item
  document.addEventListener('click', (e) => {
    const expandBtn = e.target.closest('.gallery-expand');
    if (expandBtn) {
      buildItems();
      const item = expandBtn.closest('.gallery-item');
      const index = items.indexOf(item);
      if (index !== -1) openLightbox(index);
      return;
    }

    // Клик на саму картинку тоже открывает
    const galleryItem = e.target.closest('.gallery-item');
    if (galleryItem && !lightbox.contains(e.target)) {
      buildItems();
      const index = items.indexOf(galleryItem);
      if (index !== -1) openLightbox(index);
    }
  });

  // Закрытие
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn)  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  if (nextBtn)  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

  // Клик на фон
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Клавиатура
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   prev();
    if (e.key === 'ArrowRight')  next();
  });

  // Свайп на мобильных
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx > 0 ? prev() : next();
    }
  });
})();


/* ─────────────────────────────────────────────
   SMOOTH SCROLL для якорей
───────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();


/* ─────────────────────────────────────────────
   PARALLAX на hero background (subtle)
───────────────────────────────────────────── */
(function initParallax() {
  const heroGlow = document.querySelector('.hero-glow');
  if (!heroGlow) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroGlow.style.transform = `translate(-50%, calc(-50% + ${y * 0.2}px))`;
  }, { passive: true });
})();


/* ─────────────────────────────────────────────
   КАК ДОБАВИТЬ НОВЫЕ ФОТО В ГАЛЕРЕЮ:
   
   Открой index.html и найди <div class="gallery-grid">
   Скопируй блок .gallery-item и вставь его внутрь grid.
   Замени:
     - src="..." — путь к фото или URL
     - alt="..." — описание для доступности
     - data-title="..." — название фото
     - data-subtitle="..." — подпись (категория · год)
   
   Варианты размера:
     - обычный:  <div class="gallery-item ...">
     - широкий:  <div class="gallery-item gallery-item--wide ...">
     - высокий:  <div class="gallery-item gallery-item--tall ...">
─────────────────────────────────────────────── */
