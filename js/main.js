/* ===================================
   VBI WEBSITE - MAIN JAVASCRIPT
   Production-Quality, Vanilla JS
   ==================================== */

/* ==================
   UTILITY FUNCTIONS
   ================== */

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit how often a function is called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Add class to element
 * @param {HTMLElement} el - Element
 * @param {string} className - Class name to add
 */
function addClass(el, className) {
  if (el) el.classList.add(className);
}

/**
 * Remove class from element
 * @param {HTMLElement} el - Element
 * @param {string} className - Class name to remove
 */
function removeClass(el, className) {
  if (el) el.classList.remove(className);
}

/**
 * Toggle class on element
 * @param {HTMLElement} el - Element
 * @param {string} className - Class name to toggle
 */
function toggleClass(el, className) {
  if (el) el.classList.toggle(className);
}

/**
 * Check if element has class
 * @param {HTMLElement} el - Element
 * @param {string} className - Class name to check
 * @returns {boolean}
 */
function hasClass(el, className) {
  return el && el.classList.contains(className);
}

/* ==================
   DOM INITIALIZATION
   ================== */

document.addEventListener('DOMContentLoaded', function () {
  initNavigation();
  initSmoothScroll();
  initScrollAnimations();
  initStickyNav();
  initAccordion();
  initTestimonialCarousel();
  initStatsCounter();
  initNewsletterForm();
  initPricingToggle();
  initBackToTopButton();
  initMobileMenuClose();
});

/* ==================
   1. NAVIGATION MENU
   ================== */

let isMenuOpen = false;

function initNavigation() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav ul');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', toggleMenu);
  }
}

function toggleMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav ul');

  if (!menuToggle || !navMenu) return;

  isMenuOpen = !isMenuOpen;
  toggleClass(menuToggle, 'active');
  toggleClass(navMenu, 'active');
}

function closeMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav ul');

  if (menuToggle && navMenu) {
    removeClass(menuToggle, 'active');
    removeClass(navMenu, 'active');
    isMenuOpen = false;
  }
}

function initMobileMenuClose() {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* ==================
   2. SMOOTH SCROLL
   ================== */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));

      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ==================
   3. SCROLL ANIMATIONS
   ================== */

function initScrollAnimations() {
  // Create Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        addClass(entry.target, 'visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with fade-in class
  document.querySelectorAll('.fade-in, .card, .testimonial-card').forEach(el => {
    observer.observe(el);
  });
}

/* ==================
   4. STICKY NAVIGATION
   ================== */

function initStickyNav() {
  const header = document.querySelector('header');

  if (!header) return;

  const scrollHandler = throttle(function () {
    if (window.scrollY > 50) {
      addClass(header, 'scrolled');
    } else {
      removeClass(header, 'scrolled');
    }

    // Update active nav link based on scroll position
    updateActiveNavLink();
  }, 100);

  window.addEventListener('scroll', scrollHandler);
}

/**
 * Update active navigation link based on current scroll position
 */
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  let current = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;

    if (window.pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    removeClass(link, 'active');
    if (link.getAttribute('href') === `#${current}`) {
      addClass(link, 'active');
    }
  });
}

/* ==================
   5. FAQ ACCORDION
   ================== */

function initAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', toggleAccordion);
  });
}

function toggleAccordion(e) {
  const accordionItem = e.currentTarget.closest('.accordion-item');

  if (!accordionItem) return;

  // Close other items
  const allItems = document.querySelectorAll('.accordion-item');
  allItems.forEach(item => {
    if (item !== accordionItem && hasClass(item, 'active')) {
      removeClass(item, 'active');
    }
  });

  // Toggle current item
  toggleClass(accordionItem, 'active');
}

/* ==================
   6. TESTIMONIAL CAROUSEL
   ================== */

let currentTestimonialIndex = 0;
let testimonialAutoplayInterval;

function initTestimonialCarousel() {
  const testimonials = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.testimonial-dot');

  if (testimonials.length === 0) return;

  // Show first testimonial
  showTestimonial(0);

  // Add click handlers to dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      clearInterval(testimonialAutoplayInterval);
      showTestimonial(index);
      startTestimonialAutoplay();
    });
  });

  // Start autoplay
  startTestimonialAutoplay();
}

function showTestimonial(index) {
  const testimonials = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.testimonial-dot');

  if (testimonials.length === 0) return;

  // Wrap around
  currentTestimonialIndex = (index + testimonials.length) % testimonials.length;

  // Remove active from all
  testimonials.forEach(testimonial => removeClass(testimonial, 'active'));
  dots.forEach(dot => removeClass(dot, 'active'));

  // Add active to current
  addClass(testimonials[currentTestimonialIndex], 'active');
  addClass(dots[currentTestimonialIndex], 'active');
}

function startTestimonialAutoplay() {
  const testimonials = document.querySelectorAll('.testimonial-card');

  if (testimonials.length <= 1) return;

  testimonialAutoplayInterval = setInterval(() => {
    currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
    showTestimonial(currentTestimonialIndex);
  }, 5000); // Change every 5 seconds
}

/* ==================
   7. STATS COUNTER
   ================== */

let statsAnimated = false;

function initStatsCounter() {
  const statsSection = document.querySelector('.stats-container');

  if (!statsSection) return;

  const observerOptions = {
    threshold: 0.5
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsAnimated) {
        animateStats();
        statsAnimated = true;
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  observer.observe(statsSection);
}

function animateStats() {
  const statNumbers = document.querySelectorAll('.stat-number');

  statNumbers.forEach(stat => {
    const targetNumber = parseInt(stat.getAttribute('data-target') || stat.textContent);
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = targetNumber / steps;

    let currentNumber = 0;

    const counter = setInterval(() => {
      currentNumber += increment;

      if (currentNumber >= targetNumber) {
        stat.textContent = targetNumber.toLocaleString();
        clearInterval(counter);
      } else {
        stat.textContent = Math.floor(currentNumber).toLocaleString();
      }
    }, stepDuration);
  });
}

/* ==================
   8. NEWSLETTER FORM
   ================== */

function initNewsletterForm() {
  const forms = document.querySelectorAll('form[data-type="newsletter"]');

  forms.forEach(form => {
    form.addEventListener('submit', handleNewsletterSubmit);
  });
}

function handleNewsletterSubmit(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const emailInput = form.querySelector('input[type="email"]');
  const submitButton = form.querySelector('button[type="submit"]');

  // Validation
  if (!emailInput || !emailInput.value) {
    showValidationError(emailInput, 'Please enter your email address');
    return;
  }

  if (!isValidEmail(emailInput.value)) {
    showValidationError(emailInput, 'Please enter a valid email address');
    return;
  }

  // Clear previous errors
  clearValidationError(emailInput);

  // Disable button and show loading state
  if (submitButton) {
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Subscribing...';

    // Simulate API call
    setTimeout(() => {
      submitButton.disabled = false;
      submitButton.textContent = originalText;

      // Show success message
      showToast('success', 'Subscription Successful', 'Thank you for subscribing to our newsletter!');

      // Reset form
      form.reset();
    }, 1000);
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Show validation error
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showValidationError(input, message) {
  addClass(input, 'input-error');

  let errorEl = input.parentElement.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    input.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

/**
 * Clear validation error
 * @param {HTMLElement} input - Input element
 */
function clearValidationError(input) {
  removeClass(input, 'input-error');
  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.remove();
  }
}

/* ==================
   9. PRICING TOGGLE
   ================== */

function initPricingToggle() {
  const toggleSwitch = document.querySelector('.toggle-switch');

  if (!toggleSwitch) return;

  toggleSwitch.addEventListener('click', handlePricingToggle);
}

function handlePricingToggle(e) {
  const toggleSwitch = e.currentTarget;
  const isAnnual = hasClass(toggleSwitch, 'active');

  toggleClass(toggleSwitch, 'active');

  // Update pricing cards
  const pricingCards = document.querySelectorAll('.pricing-card');
  pricingCards.forEach(card => {
    const price = card.querySelector('.pricing-price');
    const period = card.querySelector('.pricing-period');

    if (price && period) {
      // Get annual and monthly prices from data attributes
      const monthlyPrice = price.getAttribute('data-monthly') || '0';
      const annualPrice = price.getAttribute('data-annual') || '0';

      if (isAnnual) {
        // Switch to monthly
        price.textContent = '$' + monthlyPrice;
        period.textContent = 'per month';
      } else {
        // Switch to annual
        price.textContent = '$' + annualPrice;
        period.textContent = 'per year';
      }
    }
  });
}

/* ==================
   10. BACK TO TOP
   ================== */

function initBackToTopButton() {
  const backToTopBtn = document.querySelector('.back-to-top');

  if (!backToTopBtn) return;

  window.addEventListener('scroll', throttle(function () {
    if (window.pageYOffset > 300) {
      addClass(backToTopBtn, 'show');
    } else {
      removeClass(backToTopBtn, 'show');
    }
  }, 100));

  backToTopBtn.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==================
   11. TOAST NOTIFICATIONS
   ================== */

/**
 * Show toast notification
 * @param {string} type - Type: 'success', 'error', 'info'
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showToast(type = 'info', title = '', message = '', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      ${title ? `<h4>${title}</h4>` : ''}
      <p>${message}</p>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/* ==================
   12. MODAL HANDLING
   ================== */

/**
 * Show modal
 * @param {string} modalId - Modal element ID
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    addClass(modal, 'active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide modal
 * @param {string} modalId - Modal element ID
 */
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    removeClass(modal, 'active');
    document.body.style.overflow = 'auto';
  }
}

/**
 * Initialize modal close handlers
 */
function initModals() {
  // Close on background click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) {
        hideModal(this.id);
      }
    });
  });

  // Close on close button click
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function () {
      const modal = this.closest('.modal');
      if (modal) {
        hideModal(modal.id);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initModals);

/* ==================
   13. FORM VALIDATION
   ================== */

/**
 * Generic form validation
 * @param {HTMLElement} form - Form element
 * @returns {boolean} - Returns true if form is valid
 */
function validateForm(form) {
  let isValid = true;

  // Check required fields
  form.querySelectorAll('[required]').forEach(field => {
    if (!field.value.trim()) {
      showValidationError(field, `${field.name || 'This field'} is required`);
      isValid = false;
    } else {
      clearValidationError(field);
    }
  });

  // Check email fields
  form.querySelectorAll('input[type="email"]').forEach(field => {
    if (field.value && !isValidEmail(field.value)) {
      showValidationError(field, 'Please enter a valid email address');
      isValid = false;
    }
  });

  return isValid;
}

/* ==================
   14. PODCAST PLAYER
   ================== */

/**
 * Initialize podcast player
 */
function initPodcastPlayer() {
  const playButtons = document.querySelectorAll('.play-button');

  playButtons.forEach(btn => {
    btn.addEventListener('click', togglePodcastPlay);
  });

  // Progress bar scrubbing
  const progressBars = document.querySelectorAll('.progress-bar');
  progressBars.forEach(bar => {
    bar.addEventListener('click', scrubPodcast);
  });
}

function togglePodcastPlay(e) {
  const btn = e.currentTarget;
  const player = btn.closest('.podcast-player');

  if (!player) return;

  // Toggle button state
  btn.classList.toggle('playing');

  // Update button text/icon
  if (hasClass(btn, 'playing')) {
    btn.textContent = '⏸';
  } else {
    btn.textContent = '▶';
  }

  // In a real application, you would control audio playback here
  console.log('Podcast player toggled');
}

function scrubPodcast(e) {
  const progressBar = e.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;

  const fill = progressBar.querySelector('.progress-fill');
  if (fill) {
    fill.style.width = (percent * 100) + '%';
  }

  // In a real application, you would update audio playback here
}

document.addEventListener('DOMContentLoaded', initPodcastPlayer);

/* ==================
   15. RESOURCE FILTERS
   ================== */

/**
 * Initialize resource filtering
 */
function initResourceFilters() {
  const filterTags = document.querySelectorAll('.tag[data-filter]');
  const resourceItems = document.querySelectorAll('.resource-item');

  filterTags.forEach(tag => {
    tag.addEventListener('click', handleResourceFilter);
  });

  function handleResourceFilter(e) {
    const selectedTag = e.currentTarget;
    const filterValue = selectedTag.getAttribute('data-filter');

    // Update active state
    filterTags.forEach(tag => removeClass(tag, 'active'));
    addClass(selectedTag, 'active');

    // Filter resources
    resourceItems.forEach(item => {
      const itemType = item.getAttribute('data-type');

      if (filterValue === 'all' || itemType === filterValue) {
        addClass(item, 'visible');
        removeClass(item, 'hidden');
      } else {
        removeClass(item, 'visible');
        addClass(item, 'hidden');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initResourceFilters);

/* ==================
   16. EVENT CALENDAR
   ================== */

/**
 * Initialize event calendar/list
 */
function initEventCalendar() {
  const eventCards = document.querySelectorAll('.event-card');

  eventCards.forEach(card => {
    card.addEventListener('mouseenter', highlightEvent);
    card.addEventListener('mouseleave', unhighlightEvent);
  });
}

function highlightEvent(e) {
  const eventCard = e.currentTarget;
  addClass(eventCard, 'highlighted');
}

function unhighlightEvent(e) {
  const eventCard = e.currentTarget;
  removeClass(eventCard, 'highlighted');
}

document.addEventListener('DOMContentLoaded', initEventCalendar);

/* ==================
   17. LAZY LOADING
   ================== */

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
  }
}

document.addEventListener('DOMContentLoaded', initLazyLoading);

/* ==================
   18. SEARCH FUNCTIONALITY
   ================== */

/**
 * Initialize search functionality
 */
function initSearch() {
  const searchInput = document.querySelector('[data-search]');
  const searchableElements = document.querySelectorAll('[data-searchable]');

  if (!searchInput) return;

  searchInput.addEventListener('input', debounce(function (e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
      searchableElements.forEach(el => removeClass(el, 'hidden'));
      return;
    }

    searchableElements.forEach(el => {
      const text = el.textContent.toLowerCase();
      if (text.includes(query)) {
        removeClass(el, 'hidden');
      } else {
        addClass(el, 'hidden');
      }
    });
  }, 300));
}

document.addEventListener('DOMContentLoaded', initSearch);

/* ==================
   19. WINDOW RESIZE HANDLER
   ================== */

/**
 * Handle window resize events
 */
window.addEventListener('resize', debounce(function () {
  // Close mobile menu on resize to desktop
  if (window.innerWidth > 767) {
    closeMenu();
  }
}, 200));

/* ==================
   20. KEYBOARD SHORTCUTS
   ================== */

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', function (e) {
    // Escape key closes modal and menu
    if (e.key === 'Escape') {
      closeMenu();
      document.querySelectorAll('.modal.active').forEach(modal => {
        hideModal(modal.id);
      });
    }

    // Ctrl/Cmd + K opens search (if implemented)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('[data-search]');
      if (searchInput) {
        searchInput.focus();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', initKeyboardShortcuts);

/* ==================
   21. PERFORMANCE OPTIMIZATION
   ================== */

/**
 * Preload critical resources
 */
function preloadResources() {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
  document.head.appendChild(link);
}

document.addEventListener('DOMContentLoaded', preloadResources);

/* ==================
   22. ERROR HANDLING
   ================== */

/**
 * Global error handler
 */
window.addEventListener('error', function (e) {
  console.error('Global error:', e.error);
  // In production, you might send this to an error tracking service
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', function (e) {
  console.error('Unhandled promise rejection:', e.reason);
  // In production, you might send this to an error tracking service
});

/* ==================
   23. EXPORT FUNCTIONS FOR GLOBAL USE
   ================== */

// Export utility functions for use in HTML
window.VBI = {
  showToast,
  showModal,
  hideModal,
  validateForm,
  isValidEmail,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  debounce,
  throttle
};

console.log('VBI JavaScript initialized successfully');
