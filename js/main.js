// ============================================================================
// VBI Website - Main JavaScript
// Handles functionality across all pages (responsive, accessible, performant)
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initMobileNavigation();
  initStickyHeader();
  initScrollAnimations();
  initSmoothScroll();
  initFAQAccordion();
  initPricingToggle();
  initStatsCounter();
  initTestimonialCarousel();
  initFormHandling();
  initAnnouncementBar();
  initActiveNavLink();
  initBackToTopButton();
  initPartnerFilter();
  initEventDateFormatting();
  initNewsletterForm();
});

// ============================================================================
// 1. MOBILE NAVIGATION
// ============================================================================

function initMobileNavigation() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelectorAll('.nav-links a');
  const body = document.body;

  if (!hamburger) return;

  // Toggle menu on hamburger click
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    body.classList.toggle('nav-open');
  });

  // Close menu when clicking a nav link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('nav-open');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && !e.target.closest('.hamburger')) {
      body.classList.remove('nav-open');
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      body.classList.remove('nav-open');
    }
  });

  // Prevent body scroll when menu is open
  const observeNavState = () => {
    const isNavOpen = body.classList.contains('nav-open');
    body.style.overflow = isNavOpen ? 'hidden' : '';
  };

  hamburger.addEventListener('click', observeNavState);
  document.addEventListener('click', observeNavState);
}

// ============================================================================
// 2. STICKY HEADER
// ============================================================================

function initStickyHeader() {
  const header = document.querySelector('header');
  if (!header) return;

  let ticking = false;
  let lastScrollY = 0;

  function updateHeaderState() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  }

  function onScroll() {
    lastScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderState);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

// ============================================================================
// 3. SCROLL ANIMATIONS (Intersection Observer)
// ============================================================================

function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('animated');
        }, parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(element => {
    observer.observe(element);
  });
}

// ============================================================================
// 4. SMOOTH SCROLL
// ============================================================================

function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href === '#') return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;

    const headerHeight = 80; // Sticky header height
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  });
}

// ============================================================================
// 5. FAQ ACCORDION
// ============================================================================

function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const answer = item.querySelector('.faq-answer');
      const icon = question.querySelector('.faq-icon');
      const isActive = item.classList.contains('active');

      // Close all other FAQs
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherAnswer) {
            otherAnswer.style.maxHeight = '0px';
          }
          const otherIcon = otherItem.querySelector('.faq-icon');
          if (otherIcon) {
            otherIcon.textContent = '+';
          }
        }
      });

      // Toggle current FAQ
      if (isActive) {
        item.classList.remove('active');
        if (answer) {
          answer.style.maxHeight = '0px';
        }
        if (icon) {
          icon.textContent = '+';
        }
      } else {
        item.classList.add('active');
        if (answer) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
        if (icon) {
          icon.textContent = '−';
        }
      }
    });
  });
}

// ============================================================================
// 6. PRICING TOGGLE (Monthly/Annual)
// ============================================================================

function initPricingToggle() {
  const toggle = document.querySelector('.pricing-toggle-switch');
  if (!toggle) return;

  const monthlyPrices = document.querySelectorAll('[data-price-monthly]');
  const annualPrices = document.querySelectorAll('[data-price-annual]');
  const savingsBadges = document.querySelectorAll('[data-savings]');

  toggle.addEventListener('change', (e) => {
    const isAnnual = e.target.checked;

    monthlyPrices.forEach(element => {
      element.style.display = isAnnual ? 'none' : 'inline';
    });

    annualPrices.forEach(element => {
      element.style.display = isAnnual ? 'inline' : 'none';
    });

    savingsBadges.forEach(badge => {
      badge.style.display = isAnnual ? 'inline-block' : 'none';
    });
  });
}

// ============================================================================
// 7. STATS COUNTER ANIMATION
// ============================================================================

function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(stat => {
    observer.observe(stat);
  });
}

function animateCounter(element) {
  const target = parseInt(element.dataset.target);
  if (isNaN(target)) return;

  const duration = 2000;
  const start = Date.now();
  const startValue = 0;

  function easeOutQuad(t) {
    return t * (2 - t);
  }

  function update() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuad(progress);
    const current = Math.floor(startValue + (target - startValue) * eased);

    let displayValue = current.toLocaleString();

    // Restore prefix/suffix
    const originalText = element.dataset.target;
    if (originalText.includes('+')) {
      displayValue += '+';
    }
    if (originalText.includes('%')) {
      displayValue += '%';
    }
    if (originalText.startsWith('$')) {
      displayValue = '$' + displayValue;
    }

    element.textContent = displayValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  update();
}

// ============================================================================
// 8. TESTIMONIAL CAROUSEL
// ============================================================================

function initTestimonialCarousel() {
  const carousel = document.querySelector('.testimonial-carousel');
  if (!carousel) return;

  const slides = carousel.querySelectorAll('.testimonial-slide');
  const dots = carousel.querySelectorAll('.carousel-dot');
  if (!slides.length) return;

  let currentSlide = 0;
  let autoPlayInterval;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    showSlide((currentSlide + 1) % slides.length);
  }

  function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
  }

  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      resetAutoPlay();
    });
  });

  // Pause on hover
  carousel.addEventListener('mouseenter', () => {
    clearInterval(autoPlayInterval);
  });

  carousel.addEventListener('mouseleave', startAutoPlay);

  // Swipe support on mobile
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    resetAutoPlay();
  }, { passive: true });

  function handleSwipe() {
    const threshold = 50;
    if (touchStartX - touchEndX > threshold) {
      nextSlide();
    } else if (touchEndX - touchStartX > threshold) {
      showSlide((currentSlide - 1 + slides.length) % slides.length);
    }
  }

  // Initialize
  startAutoPlay();
}

// ============================================================================
// 9. FORM HANDLING
// ============================================================================

function initFormHandling() {
  // Contact form — POST to Cloudflare Worker
  const contactForm = document.querySelector('[data-form="contact"]');
  if (contactForm) {
    initContactForm(contactForm);
    return;
  }

  // Partner form — POST to Cloudflare Worker
  const partnerForm = document.querySelector('[data-form="partner"]');
  if (partnerForm) {
    initPartnerForm(partnerForm);
    return;
  }

  // Generic forms (non-contact, non-newsletter) — keep original behavior
  const forms = document.querySelectorAll('form:not(.newsletter-form):not([data-form])');
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;

      const successMessage = document.createElement('div');
      successMessage.className = 'form-success-message';
      successMessage.innerHTML = '\u2713 Thank you! We\'ll be in touch soon.';
      form.appendChild(successMessage);

      setTimeout(() => {
        form.reset();
        successMessage.remove();
      }, 3000);
    });
  });
}

function initContactForm(form) {
  var WORKER_URL = 'https://vbi-contact-form.naren-6e3.workers.dev';
  var feedback = document.getElementById('form-feedback');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateForm(form)) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    feedback.textContent = '';
    feedback.className = '';

    var data = {
      name: form.querySelector('[name="name"]').value.trim(),
      email: form.querySelector('[name="email"]').value.trim(),
      subject: form.querySelector('[name="subject"]').value,
      message: form.querySelector('[name="message"]').value.trim(),
      'cf-turnstile-response': document.querySelector('[name="cf-turnstile-response"]') ? document.querySelector('[name="cf-turnstile-response"]').value : '',
      '_gotcha': document.getElementById('_gotcha') ? document.getElementById('_gotcha').value : '',
    };

    // Include phone if provided
    var phoneField = form.querySelector('[name="phone"]');
    if (phoneField && phoneField.value.trim()) {
      data.phone = phoneField.value.trim();
    }

    try {
      var res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      var result = await res.json();

      if (result.ok) {
        feedback.textContent = 'Message sent successfully! We\'ll respond within 1-2 business days.';
        feedback.className = 'form-success';
        form.reset();
      } else {
        feedback.textContent = result.error || 'Failed to send message. Please try again.';
        feedback.className = 'form-error';
      }
    } catch (err) {
      feedback.textContent = 'Network error. Please check your connection and try again.';
      feedback.className = 'form-error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function initPartnerForm(form) {
  var PARTNER_WORKER_URL = 'https://vbi-partner-inquiry.naren-6e3.workers.dev';
  var feedback = document.getElementById('partner-form-feedback');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateForm(form)) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    feedback.textContent = '';
    feedback.className = '';

    var data = {
      company_name: form.querySelector('[name="company_name"]').value.trim(),
      contact_name: form.querySelector('[name="contact_name"]').value.trim(),
      contact_email: form.querySelector('[name="contact_email"]').value.trim(),
      contact_phone: form.querySelector('[name="contact_phone"]').value.trim(),
      category: form.querySelector('[name="category"]').value,
      interest_level: form.querySelector('[name="interest_level"]').value,
      message: form.querySelector('[name="message"]').value.trim(),
      'cf-turnstile-response': document.querySelector('[name="cf-turnstile-response"]') ? document.querySelector('[name="cf-turnstile-response"]').value : '',
      '_gotcha': document.getElementById('_gotcha') ? document.getElementById('_gotcha').value : '',
    };

    try {
      var res = await fetch(PARTNER_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      var result = await res.json();

      if (result.ok) {
        feedback.textContent = 'Partnership request submitted! We\'ll review and reach out within 2-3 business days.';
        feedback.className = 'form-success';
        form.reset();
      } else {
        feedback.textContent = result.error || 'Failed to submit inquiry. Please try again.';
        feedback.className = 'form-error';
      }
    } catch (err) {
      feedback.textContent = 'Network error. Please check your connection and try again.';
      feedback.className = 'form-error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function validateForm(form) {
  let isValid = true;
  const inputs = form.querySelectorAll('[required]');

  inputs.forEach(input => {
    const errorElement = input.nextElementSibling;
    input.classList.remove('error');

    if (!input.value.trim()) {
      showError(input, 'This field is required');
      isValid = false;
    } else if (input.type === 'email' && !isValidEmail(input.value)) {
      showError(input, 'Please enter a valid email');
      isValid = false;
    } else {
      // Remove error message if it exists
      if (errorElement?.classList.contains('error-message')) {
        errorElement.remove();
      }
    }
  });

  return isValid;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showError(input, message) {
  input.classList.add('error');

  // Remove existing error message if present
  const existingError = input.nextElementSibling;
  if (existingError?.classList.contains('error-message')) {
    existingError.remove();
  }

  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  input.parentNode.insertBefore(errorElement, input.nextSibling);
}

// ============================================================================
// 10. ANNOUNCEMENT BAR
// ============================================================================

function initAnnouncementBar() {
  const announcementBar = document.querySelector('.announcement-bar');
  if (!announcementBar) return;

  const dismissBtn = announcementBar.querySelector('.announcement-close');
  if (!dismissBtn) return;

  // Check if already dismissed in this session
  if (sessionStorage.getItem('announcementDismissed')) {
    announcementBar.style.display = 'none';
    updateBodyPadding();
    return;
  }

  dismissBtn.addEventListener('click', () => {
    announcementBar.style.display = 'none';
    sessionStorage.setItem('announcementDismissed', 'true');
    updateBodyPadding();
  });

  function updateBodyPadding() {
    if (announcementBar.style.display === 'none') {
      document.body.style.paddingTop = '0';
    }
  }
}

// ============================================================================
// 11. ACTIVE NAV LINK
// ============================================================================

function initActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav-links a');
  if (!navLinks.length) return;

  const currentPath = window.location.pathname;
  const currentFileName = currentPath.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const linkFileName = href.split('/').pop() || 'index.html';

    if (href === '/' || href === '/index.html' || href === 'index.html') {
      if (currentFileName === '' || currentFileName === 'index.html') {
        link.classList.add('active');
      }
    } else if (href.includes(linkFileName) || currentFileName.includes(linkFileName)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ============================================================================
// 12. BACK TO TOP BUTTON
// ============================================================================

function initBackToTopButton() {
  const backToTopBtn = document.querySelector('.back-to-top');
  if (!backToTopBtn) return;

  let ticking = false;

  function updateButtonVisibility() {
    if (window.scrollY > 500) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateButtonVisibility);
      ticking = true;
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ============================================================================
// 13. PARTNER CATEGORY FILTER
// ============================================================================

function initPartnerFilter() {
  const filterButtons = document.querySelectorAll('.partner-filter-btn');
  const partnerCards = document.querySelectorAll('.partner-card');

  if (!filterButtons.length || !partnerCards.length) return;

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;

      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Filter cards with fade animation
      partnerCards.forEach(card => {
        const cardCategory = card.dataset.category;
        const shouldShow = category === 'all' || cardCategory === category;

        if (shouldShow) {
          card.style.display = '';
          setTimeout(() => {
            card.classList.add('fade-in');
          }, 10);
        } else {
          card.classList.remove('fade-in');
          card.style.display = 'none';
        }
      });
    });
  });
}

// ============================================================================
// 14. EVENT DATE FORMATTING
// ============================================================================

function initEventDateFormatting() {
  const eventDates = document.querySelectorAll('[data-event-date]');
  if (!eventDates.length) return;

  eventDates.forEach(element => {
    const dateStr = element.dataset.eventDate;
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let badge = '';

    if (diffDays === 0) {
      badge = 'Today';
    } else if (diffDays === 1) {
      badge = 'Tomorrow';
    } else if (diffDays > 1 && diffDays <= 7) {
      badge = 'This week';
    } else if (diffDays > 0) {
      badge = `${diffDays} days away`;
    }

    if (badge) {
      const badgeElement = document.createElement('span');
      badgeElement.className = 'event-date-badge';
      badgeElement.textContent = badge;
      element.appendChild(badgeElement);
    }
  });
}

// ============================================================================
// 15. NEWSLETTER FORM
// ============================================================================

function initNewsletterForm() {
  var newsletterForm = document.querySelector('.newsletter-form');
  if (!newsletterForm) return;

  var WORKER_URL = 'https://vbi-newsletter.naren-6e3.workers.dev';
  var feedback = document.getElementById('newsletter-feedback');

  newsletterForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    var emailInput = newsletterForm.querySelector('input[name="email"]');
    if (!emailInput) return;

    var email = emailInput.value.trim();

    if (!email) {
      showNewsletterFeedback(feedback, 'Please enter your email address.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showNewsletterFeedback(feedback, 'Please enter a valid email address.', 'error');
      return;
    }

    var submitBtn = newsletterForm.querySelector('button[type="submit"]');
    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    feedback.textContent = '';
    feedback.className = '';

    try {
      var res = await fetch(WORKER_URL + '/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          'cf-turnstile-response': document.querySelector('.newsletter-form [name="cf-turnstile-response"]') ? document.querySelector('.newsletter-form [name="cf-turnstile-response"]').value : '',
          '_gotcha': document.querySelector('.newsletter-form #_gotcha') ? document.querySelector('.newsletter-form #_gotcha').value : '',
        }),
      });
      var result = await res.json();

      if (result.ok) {
        showNewsletterFeedback(feedback, 'Check your email to confirm your subscription!', 'success');
        emailInput.value = '';
      } else {
        showNewsletterFeedback(feedback, result.error || 'Something went wrong. Please try again.', 'error');
      }
    } catch (err) {
      showNewsletterFeedback(feedback, 'Network error. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function showNewsletterFeedback(el, message, type) {
  el.textContent = message;
  el.className = type === 'success' ? 'newsletter-success' : 'newsletter-error';
}

// ============================================================================
// 16. TURNSTILE CALLBACK
// ============================================================================

function onTurnstileSuccess(token) {
  // Enable submit buttons once Turnstile verification completes
  var form = document.querySelector('.cf-turnstile')?.closest('form');
  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }
}
