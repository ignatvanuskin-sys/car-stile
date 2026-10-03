/* ==========================================================================
   Car Stile — интерактив страницы
   ========================================================================== */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '77711000221';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Год в подвале ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Шапка при скролле ---------- */
  var header = $('#header');
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Мобильное меню ---------- */
  var drawer = $('#drawer');
  var burger = $('#burger');
  var drawerClose = $('#drawerClose');
  var lastFocusDrawer = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocusDrawer = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('is-open'); });
    if (burger) burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var first = $('.drawer__close', drawer);
    if (first) first.focus();
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    window.setTimeout(function () { drawer.hidden = true; }, 300);
    if (lastFocusDrawer && lastFocusDrawer.focus) lastFocusDrawer.focus();
  }
  if (burger) burger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawer) {
    drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });
    $$('.drawer__link, .drawer__foot a', drawer).forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* ---------- FAQ-аккордеон ---------- */
  $$('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (!panel) return;
      panel.style.maxHeight = expanded ? '0px' : panel.scrollHeight + 'px';
    });
  });
  window.addEventListener('resize', function () {
    $$('.faq__q[aria-expanded="true"]').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  });

  /* ---------- Сравнение «до / после» ---------- */
  $$('[data-compare]').forEach(function (box) {
    var range = $('.compare__range', box);
    if (!range) return;
    var apply = function () { box.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', apply);
    apply();
  });

  /* ---------- Лайтбокс галереи ---------- */
  var lightbox = $('#lightbox');
  var lightboxImg = $('#lightboxImg');
  var lightboxCap = $('#lightboxCap');
  var lightboxClose = $('#lightboxClose');
  var lastFocusBox = null;

  function openLightbox(figure) {
    var img = $('img', figure);
    if (!img || !lightbox) return;
    lastFocusBox = document.activeElement;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';
    lightboxCap.textContent = figure.getAttribute('data-cap') || '';
    lightbox.hidden = false;
    requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () { lightbox.hidden = true; lightboxImg.removeAttribute('src'); }, 250);
    if (lastFocusBox && lastFocusBox.focus) lastFocusBox.focus();
  }
  $$('[data-lightbox]').forEach(function (fig) {
    fig.setAttribute('tabindex', '0');
    fig.addEventListener('click', function () { openLightbox(fig); });
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(fig); }
    });
  });
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

  /* ---------- Esc для наложений ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeLightbox();
    closeDrawer();
  });

  /* ---------- Появление блоков ---------- */
  var revealTargets = $$('.section__head, .task, .service, .review, .price-table, .faq__item, .cta-band, .map-wrap, .gallery figure');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('reveal', 'is-in'); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ================== Форма записи ================== */
  var form = $('#bookingForm');
  if (!form) return;

  var steps = $$('.step', form);
  var pills = $$('[data-step-pill]');
  var summary = {
    service: $('#sumService'), extras: $('#sumExtras'), car: $('#sumCar'),
    when: $('#sumWhen'), name: $('#sumName'), phone: $('#sumPhone'), contact: $('#sumContact')
  };
  var success = $('#success');
  var resultText = $('#resultText');
  var waLink = $('#waLink');
  var submitBtn = $('#submitBtn');
  var errorSummary = $('#errorSummary');
  var errorSummaryList = $('#errorSummaryList');
  var current = 1;

  // дата: не раньше сегодняшнего дня
  var dateInput = $('#date');
  if (dateInput) {
    var today = new Date();
    var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = iso;
  }

  // группе услуг нужен фокус-таргет для сводки ошибок
  var serviceFieldset = $('fieldset', $('[data-step="1"]', form));
  if (serviceFieldset) { serviceFieldset.id = 'serviceGroup'; serviceFieldset.setAttribute('tabindex', '-1'); }
  var consentField = $('#consent');
  if (consentField && consentField.closest('.field')) consentField.closest('.field').id = 'consentGroup';

  function showStep(n) {
    current = n;
    steps.forEach(function (s) {
      s.classList.toggle('is-active', Number(s.getAttribute('data-step')) === n);
    });
    pills.forEach(function (p) {
      var i = Number(p.getAttribute('data-step-pill'));
      p.setAttribute('data-state', i === n ? 'active' : (i < n ? 'done' : 'todo'));
    });
    updateSummary();
    var panel = $('.booking__panel');
    if (panel && window.innerWidth < 940) {
      var top = panel.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
  }

  function getChecked(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function getExtras() {
    return $$('input[name="extras"]:checked', form).map(function (i) { return i.value; });
  }

  function updateSummary() {
    var svc = getChecked('service');
    var extras = getExtras();
    var car = ($('#carModel') && $('#carModel').value.trim()) || '';
    var type = ($('#carType') && $('#carType').value) || '';
    var d = ($('#date') && $('#date').value) || '';
    var t = ($('#time') && $('#time').value) || '';
    var name = ($('#name') && $('#name').value.trim()) || '';
    var phone = ($('#phone') && $('#phone').value.trim()) || '';
    var contact = getChecked('contact');

    if (summary.service) summary.service.textContent = svc || '—';
    if (summary.extras) summary.extras.textContent = extras.length ? extras.join(', ') : '—';
    if (summary.car) summary.car.textContent = car ? (car + (type ? ' · ' + type : '')) : '—';
    if (summary.when) {
      var when = '';
      if (d) when = formatDate(d);
      if (t) when += (when ? ', ' : '') + t;
      summary.when.textContent = when || '—';
    }
    if (summary.name) summary.name.textContent = name || '—';
    if (summary.phone) summary.phone.textContent = phone || '—';
    if (summary.contact) summary.contact.textContent = contact || '—';
  }

  function formatDate(value) {
    var parts = value.split('-');
    if (parts.length !== 3) return value;
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return Number(parts[2]) + ' ' + months[Number(parts[1]) - 1] + ' ' + parts[0];
  }

  // ---- ошибки ----
  var lastErrors = [];

  function clearErrors() {
    $$('.error', form).forEach(function (e) { e.classList.remove('is-shown'); });
    $$('[aria-invalid="true"]', form).forEach(function (e) { e.removeAttribute('aria-invalid'); });
    lastErrors = [];
    renderErrorSummary();
  }

  // ключ ошибки для конкретного поля (совпадает с id в сводке)
  function fieldKey(el) {
    if (!el) return '';
    if (el.name === 'service') return 'serviceGroup';
    if (el.name === 'consent') return 'consentGroup';
    return el.id || '';
  }
  // id сообщения об ошибке рядом с полем
  function inlineErrorId(el) {
    if (!el) return null;
    if (el.name === 'service') return 'serviceError';
    if (el.name === 'consent') return 'consentError';
    var field = el.closest ? el.closest('.field') : null;
    var box = field ? $('.error', field) : null;
    return box ? box.id : null;
  }
  // снять ошибку с поля сразу после того, как его поправили
  function releaseField(el) {
    if (el && el.removeAttribute) el.removeAttribute('aria-invalid');
    var id = inlineErrorId(el);
    if (id) {
      var box = document.getElementById(id);
      if (box) box.classList.remove('is-shown');
    }
    var key = fieldKey(el);
    if (lastErrors.length && key) {
      var rest = lastErrors.filter(function (e) { return e.id !== key; });
      if (rest.length !== lastErrors.length) {
        lastErrors = rest;
        renderErrorSummary();
      }
    }
  }

  function renderErrorSummary() {
    if (!errorSummaryList || !errorSummary) return;
    errorSummaryList.innerHTML = '';
    if (!lastErrors.length) { errorSummary.classList.remove('is-shown'); return; }
    lastErrors.forEach(function (err) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + err.id;
      a.textContent = err.msg;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(err.id);
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
        }
      });
      li.appendChild(a);
      errorSummaryList.appendChild(li);
    });
    errorSummary.classList.add('is-shown');
  }

  function setFieldError(input, errorId, message) {
    if (input) input.setAttribute('aria-invalid', 'true');
    var el = errorId ? document.getElementById(errorId) : null;
    if (el) {
      if (message) el.textContent = message;
      el.classList.add('is-shown');
    }
  }

  function validateStep(n) {
    var errors = [];
    if (n === 1) {
      if (!getChecked('service')) {
        setFieldError(null, 'serviceError');
        errors.push({ id: 'serviceGroup', msg: 'Выберите услугу' });
      }
    }
    if (n === 2) {
      var carModel = $('#carModel');
      if (carModel && !carModel.value.trim()) {
        setFieldError(carModel, 'carModelError');
        errors.push({ id: 'carModel', msg: 'Укажите марку и модель автомобиля' });
      }
      if (dateInput && !dateInput.value) {
        setFieldError(dateInput, 'dateError');
        errors.push({ id: 'date', msg: 'Выберите дату' });
      }
      var timeInput = $('#time');
      if (timeInput && !timeInput.value) {
        setFieldError(timeInput, 'timeError');
        errors.push({ id: 'time', msg: 'Выберите удобное время' });
      }
    }
    if (n === 3) {
      var nameInput = $('#name');
      if (nameInput && !nameInput.value.trim()) {
        setFieldError(nameInput, 'nameError');
        errors.push({ id: 'name', msg: 'Укажите имя' });
      }
      var phoneInput = $('#phone');
      var digits = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';
      if (!digits) {
        setFieldError(phoneInput, 'phoneError', 'Введите номер телефона');
        errors.push({ id: 'phone', msg: 'Введите номер телефона' });
      } else if (digits.length < 10) {
        setFieldError(phoneInput, 'phoneError', 'Слишком короткий номер — проверьте, пожалуйста');
        errors.push({ id: 'phone', msg: 'Проверьте номер телефона' });
      }
      if (consentField && !consentField.checked) {
        setFieldError(null, 'consentError');
        errors.push({ id: 'consentGroup', msg: 'Нужно согласие на обработку данных' });
      }
    }
    return errors;
  }

  function reportErrors(errors) {
    if (!errors.length) return true;
    lastErrors = errors.slice();
    renderErrorSummary();
    if (errorSummary) {
      errorSummary.focus();
      errorSummary.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
    }
    return false;
  }

  // ---- навигация по шагам ----
  $$('[data-next]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      clearErrors();
      var errors = validateStep(current);
      if (errors.length) { reportErrors(errors); return; }
      showStep(Number(btn.getAttribute('data-next')));
    });
  });
  $$('[data-prev]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      clearErrors();
      showStep(Number(btn.getAttribute('data-prev')));
    });
  });

  // ---- живое обновление сводки и снятие ошибки с исправленного поля ----
  form.addEventListener('input', function (e) { updateSummary(); releaseField(e.target); });
  form.addEventListener('change', function (e) { updateSummary(); releaseField(e.target); });

  // ---- отправка ----
  function buildMessage() {
    var car = ($('#carModel') && $('#carModel').value.trim()) || '—';
    var type = ($('#carType') && $('#carType').value) || '';
    var d = ($('#date') && $('#date').value) || '';
    var t = ($('#time') && $('#time').value) || '';
    var comment = ($('#comment') && $('#comment').value.trim()) || '';
    var extras = getExtras();
    var lines = [
      'Заявка с сайта Car Stile',
      'Услуга: ' + (getChecked('service') || '—'),
      'Дополнительно: ' + (extras.length ? extras.join(', ') : '—'),
      'Автомобиль: ' + car + (type ? ' (' + type + ')' : ''),
      'Желаемая дата: ' + (d ? formatDate(d) : '—'),
      'Удобное время: ' + (t || '—'),
      'Имя: ' + (($('#name') && $('#name').value.trim()) || '—'),
      'Телефон: ' + (($('#phone') && $('#phone').value.trim()) || '—'),
      'Связь: ' + (getChecked('contact') || '—')
    ];
    if (comment) lines.push('Комментарий: ' + comment);
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    var all = validateStep(1).concat(validateStep(2), validateStep(3));
    if (all.length) {
      // перейти на первый проблемный шаг
      var firstId = all[0].id;
      var stepOf = { serviceGroup: 1, carModel: 2, date: 2, time: 2, name: 3, phone: 3, consentGroup: 3 };
      showStep(stepOf[firstId] || 1);
      reportErrors(all);
      return;
    }

    var message = buildMessage();
    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);

    if (submitBtn) {
      submitBtn.setAttribute('aria-disabled', 'true');
      submitBtn.innerHTML = '<svg><use href="#i-clock"></use></svg> Формируем заявку…';
    }

    window.setTimeout(function () {
      if (resultText) resultText.value = message;
      if (waLink) waLink.href = url;
      window.open(url, '_blank', 'noopener');
      $$('.step', form).forEach(function (s) { s.classList.remove('is-active'); });
      if (errorSummary) errorSummary.classList.remove('is-shown');
      if (success) {
        success.classList.add('is-shown');
        success.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
      }
      if (submitBtn) {
        submitBtn.removeAttribute('aria-disabled');
        submitBtn.innerHTML = '<svg><use href="#i-send"></use></svg> Отправить заявку';
      }
    }, 380);
  });

  // ---- копирование ----
  var copyBtn = $('#copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!resultText) return;
      var done = function () {
        var original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg><use href="#i-check"></use></svg> Скопировано';
        window.setTimeout(function () { copyBtn.innerHTML = original; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(resultText.value).then(done, function () {
          resultText.select(); document.execCommand('copy'); done();
        });
      } else {
        resultText.select(); document.execCommand('copy'); done();
      }
    });
  }

  // ---- новая заявка ----
  var resetBtn = $('#resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      form.reset();
      clearErrors();
      if (success) success.classList.remove('is-shown');
      updateSummary();
      showStep(1);
    });
  }

  /* ---------- Быстрая запись из карточек и плиток ---------- */
  function prefill(serviceValue) {
    var target = form.querySelector('input[name="service"][value="' + serviceValue + '"]');
    if (target) {
      target.checked = true;
    } else {
      var other = form.querySelector('input[name="service"][value="Другое / нужна консультация"]');
      if (other) other.checked = true;
      var comment = $('#comment');
      if (comment && !comment.value.trim()) comment.value = 'Услуга: ' + serviceValue;
    }
    clearErrors();
    updateSummary();
    showStep(1);
    var booking = $('#booking');
    if (booking) booking.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  $$('[data-book]').forEach(function (btn) {
    btn.addEventListener('click', function () { prefill(btn.getAttribute('data-book')); });
  });

  $$('.task[data-task]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-task');
      prefill(value);
      var comment = $('#comment');
      var label = btn.getAttribute('data-task-label');
      if (comment) {
        var line = 'Задача: ' + label + '. ';
        if (comment.value.indexOf(label) === -1) comment.value = line + comment.value;
      }
      updateSummary();
    });
  });

  // стартовое состояние
  updateSummary();
  showStep(1);
})();
