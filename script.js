'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu = $('.menu'), nav = $('.navigation');
  const closeMenu = (restoreFocus = false) => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
    if (restoreFocus) menu.focus();
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header')) closeMenu();
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  window.matchMedia('(min-width: 1001px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  if (!reduced && 'IntersectionObserver' in window) {
    document.body.classList.add('motion-enabled');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.06});
    $$('.reveal').forEach(element => observer.observe(element));
  }
  const header = $('.header'), progress = $('.scroll-progress');
  let scheduled = false;
  const updateScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
  }, {passive: true});
  updateScroll();
  $$('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

  // Búsqueda y categorías se combinan; las tildes no cambian los resultados.
  const search = $('#destination-search');
  if (search) {
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const filters = $$('[data-filter]'), cards = $$('[data-category]');
    const clearSearch = $('#clear-search'), empty = $('#catalog-empty');
    const searchable = cards.map(card => normalize(card.textContent + ' ' + card.dataset.search));
    let category = 'all';
    const updateCatalog = () => {
      const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      let count = 0;
      cards.forEach((card, index) => {
        const match = (category === 'all' || card.dataset.category.split(' ').includes(category)) && terms.every(term => searchable[index].includes(term));
        card.hidden = !match;
        if (match) { count++; card.classList.add('visible'); }
      });
      clearSearch.hidden = search.value.length === 0;
      empty.hidden = count > 0;
      $('#filter-count').textContent = count + (count === 1 ? ' lugar o interés' : ' lugares e intereses') + (terms.length || category !== 'all' ? (count === 1 ? ' encontrado' : ' encontrados') : '');
    };
    filters.forEach(button => button.addEventListener('click', () => {
      category = button.dataset.filter;
      filters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      updateCatalog();
    }));
    search.addEventListener('input', updateCatalog);
    search.addEventListener('search', updateCatalog);
    clearSearch.addEventListener('click', () => { search.value = ''; updateCatalog(); search.focus(); });
    $('#reset-catalog').addEventListener('click', () => {
      search.value = ''; category = 'all';
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === 'all')));
      updateCatalog(); search.focus();
    });
    $('#catalog-tools').hidden = false;
    updateCatalog();
  }

  const dialog = $('#photo-dialog');
  if (dialog) {
    const photo = $('#dialog-photo'), caption = $('#dialog-caption');
    let opener = null;
    $$('[data-photo]').forEach(button => button.addEventListener('click', () => {
      opener = button;
      photo.src = button.dataset.photo;
      photo.alt = button.dataset.caption;
      caption.textContent = button.dataset.caption;
      dialog.showModal();
    }));
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => { if (opener) opener.focus(); });
  }

  // La guía mantiene visible qué sección se está leyendo.
  const guideLinks = $$('.guide-nav a[href^="#"]');
  if (guideLinks.length && 'IntersectionObserver' in window) {
    guideLinks[0].setAttribute('aria-current', 'location');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        guideLinks.forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin: '-110px 0px -' + Math.round(window.innerHeight * 0.55) + 'px 0px', threshold: 0});
    guideLinks.forEach(link => { const section = $(link.hash); if (section) observer.observe(section); });
  }

  const form = $('#trip-form');
  if (!form) return;
  const controls = form.elements;
  const today = new Date();
  const localDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  controls.fecha.min = localDate;
  const interest = new URLSearchParams(location.search).get('interes');
  if (interest) {
    const match = Array.from(controls.interes.options).find(option => option.value === interest);
    if (match) controls.interes.value = match.value;
  }
  const journey = $('#journey-step'), details = $('#details-step');
  const result = $('#request-result'), output = $('#request-text'), status = $('#request-status');
  const errors = $('#form-errors'), errorList = $('#error-list');
  const stages = $$('[data-stage]');
  let step = 1;
  let copyTimer;
  const goToFocus = element => {
    element.focus({preventScroll: true});
    const bounds = element.getBoundingClientRect();
    if (bounds.top < 110 || bounds.bottom > window.innerHeight - 24) element.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'center'});
  };
  const formatDate = value => {
    if (!value) return 'Por definir';
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(year, month - 1, day));
  };
  const value = name => controls[name].value.trim();
  const addRows = (list, rows) => {
    list.replaceChildren();
    rows.forEach(([label, text]) => {
      const row = document.createElement('div'), term = document.createElement('dt'), definition = document.createElement('dd');
      term.textContent = label; definition.textContent = text;
      row.append(term, definition); list.append(row);
    });
  };
  const journeyRows = () => [
    ['Interés', value('interes') || 'Quiero orientación para elegir'],
    ['Fecha', formatDate(value('fecha'))],
    ['Viajeros', value('personas') || 'Por definir']
  ];
  const showStage = stage => {
    step = stage;
    stages.forEach(item => {
      const number = Number(item.dataset.stage);
      item.classList.toggle('complete', number < stage);
      if (number === stage) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    errors.hidden = true;
    form.hidden = stage === 3;
    result.hidden = stage !== 3;
    journey.hidden = stage !== 1;
    details.hidden = stage !== 2;
    $('.journey-summary').hidden = stage !== 2;
    if (stage === 2) addRows($('#journey-summary'), journeyRows());
  };
  const fieldMessage = field => {
    field.setCustomValidity('');
    if (field.required && !field.value.trim()) field.setCustomValidity(field.name === 'nombre' ? 'Escribe tu nombre y apellido.' : 'Escribe tu correo electrónico.');
    if (field.validity.valid) return '';
    if (field.validity.customError || field.validity.valueMissing) return field.validationMessage || 'Completa este dato.';
    if (field.validity.typeMismatch) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    if (field.validity.rangeUnderflow) return field.name === 'fecha' ? 'Elige una fecha a partir de hoy, o déjala en blanco.' : 'Indica al menos una persona.';
    if (field.validity.rangeOverflow) return 'Para grupos de más de 100 personas, indícalo en tu idea de viaje.';
    if (field.validity.badInput || field.validity.stepMismatch) return field.name === 'fecha' ? 'Completa una fecha válida, o déjala en blanco.' : 'Indica un número entero de personas.';
    if (field.validity.tooLong) return 'Acorta este texto para continuar.';
    return 'Revisa este dato antes de continuar.';
  };
  const markField = field => {
    const message = fieldMessage(field), hint = $('#' + field.name + '-error');
    if (hint) { hint.hidden = !message; hint.textContent = message; }
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return message;
  };
  const validate = fields => {
    errorList.replaceChildren();
    let count = 0;
    fields.forEach(field => {
      const message = markField(field);
      if (!message) return;
      count++;
      const li = document.createElement('li'), link = document.createElement('a');
      link.href = '#' + field.id; link.textContent = message;
      link.addEventListener('click', event => { event.preventDefault(); goToFocus(field); });
      li.append(link); errorList.append(li);
    });
    errors.hidden = count === 0;
    if (count) goToFocus(errors);
    return count === 0;
  };
  const journeyFields = [controls.fecha, controls.personas, controls.mensaje, controls.presupuesto];
  const personalFields = [controls.nombre, controls.correo];
  [...journeyFields, ...personalFields].forEach(field => field.addEventListener('input', () => {
    errors.hidden = true;
    if (field.getAttribute('aria-invalid') === 'true') markField(field);
    else field.setCustomValidity('');
  }));
  const next = () => {
    if (!validate(journeyFields)) return;
    showStage(2); goToFocus($('#details-title'));
  };
  $('#next-step').addEventListener('click', next);
  [$('#previous-step'), $('#change-journey')].forEach(button => button.addEventListener('click', () => {
    showStage(1); goToFocus($('#journey-title'));
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (step === 1) { next(); return; }
    if (!validate(personalFields)) return;
    // Vuelve al primer paso si el navegador restauró un dato fuera de rango.
    if (journeyFields.some(field => fieldMessage(field))) {
      showStage(1); validate(journeyFields); return;
    }
    const rows = [['Nombre', value('nombre')], ['Correo', value('correo')], ...journeyRows(), ['Presupuesto', value('presupuesto') || 'Por definir']];
    if (value('mensaje')) rows.push(['Mi idea', value('mensaje')]);
    addRows($('#review-details'), rows);
    output.value = 'SOLICITUD DE VIAJE — PALCAZU TRAVEL\n\n' + rows.map(([label, text]) => label + ': ' + text).join('\n') + '\n\nQuisiera consultar el recorrido, los servicios, la disponibilidad, el precio y las condiciones.';
    status.textContent = '';
    $('#request-transcript').open = false;
    showStage(3); goToFocus(result);
  });
  $('#edit-request').addEventListener('click', () => { showStage(1); goToFocus($('#journey-title')); });
  const copyButton = $('#copy-request');
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = 'Solicitud copiada. Ya puedes pegarla en tu canal de contacto.';
      copyButton.firstChild.textContent = 'Solicitud copiada ';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copyButton.firstChild.textContent = 'Copiar solicitud '; }, 4000);
    } catch {
      $('#request-transcript').open = true;
      goToFocus(output); output.select();
      status.textContent = 'Seleccionamos el texto. Usa la opción Copiar de tu dispositivo.';
    }
  });
  $('#download-request').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([output.value], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'Solicitud-Palcazu-Travel.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Descarga preparada: Solicitud-Palcazu-Travel.txt.';
  });
  form.noValidate = true;
  $('#form-progress').hidden = false;
  ['#next-step', '#previous-step', '#change-journey', '#step-caption'].forEach(selector => { $(selector).hidden = false; });
  $('#prepare-request').disabled = false;
  showStage(1);
})();
