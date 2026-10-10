'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const data = window.PALCAZU_GUIDE;
  if (!data) return;
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const stopwords = new Set('de del la el los las un una y o en al a me mi para por que es se como cual puedo quiero necesito quisiera saber hay son tiene tienen mas con lo cuanto donde'.split(' '));
  const words = value => normalize(value).replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(word => word && !stopwords.has(word));
  const score = (terms, text, title, keywords) => terms.reduce((total, word) => total + (normalize(title).includes(word) ? 5 : 0) + (normalize(keywords).includes(word) ? 4 : 0) + (normalize(text).includes(word) ? 1 : 0), 0);
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const link = (href, text, className) => {
    const anchor = make('a', className, text);
    anchor.href = href;
    return anchor;
  };
  const more = $('.explore-menu');
  const closeMore = () => { if (more) more.open = false; };
  document.addEventListener('click', event => { if (more && !more.contains(event.target)) closeMore(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && more?.open) { closeMore(); more.querySelector('summary').focus(); }
  });
  more?.querySelectorAll('a').forEach(anchor => anchor.addEventListener('click', closeMore));

  const searchDialog = $('#site-search-dialog'), helpDialog = $('#travel-help-dialog');
  if (!searchDialog || !helpDialog || !('showModal' in searchDialog)) return;
  const openers = new Map();
  const open = (dialog, opener) => {
    [searchDialog, helpDialog].forEach(other => { if (other !== dialog && other.open) other.close(); });
    closeMore();
    const menu = $('.menu'), navigation = $('.navigation');
    navigation?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Abrir menú');
    openers.set(dialog, opener);
    if (!dialog.open) dialog.showModal();
  };
  [searchDialog, helpDialog].forEach(dialog => {
    dialog.querySelector('[data-close-utility]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      if (![searchDialog, helpDialog].some(other => other.open)) openers.get(dialog)?.focus();
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  const searchInput = $('#site-search-input'), searchResults = $('#site-search-results');
  const searchClear = $('#site-search-clear'), searchStatus = $('#site-search-status');
  const updateSearch = () => {
    const terms = words(searchInput.value);
    const pages = data.pages.map((page, index) => ({...page, index, score: score(terms, page.summary, page.title, page.keywords)}))
      .filter(page => !terms.length || page.score > 0).sort((a, b) => b.score - a.score || a.index - b.index);
    searchResults.replaceChildren();
    pages.forEach(page => {
      const row = link(page.href, undefined, 'search-result');
      const copy = make('span', 'search-result-copy');
      copy.append(make('small', 'eyebrow', page.group), make('strong', '', page.title), make('span', '', page.summary));
      const arrow = make('b', '', '↗'); arrow.setAttribute('aria-hidden', 'true');
      row.append(copy, arrow); searchResults.append(row);
    });
    searchClear.hidden = searchInput.value.length === 0;
    $('#site-search-empty').hidden = pages.length > 0;
    searchStatus.textContent = terms.length ? pages.length + (pages.length === 1 ? ' sección encontrada' : ' secciones encontradas') : 'Todas las secciones · 14 accesos';
  };
  searchInput.addEventListener('input', updateSearch);
  searchInput.addEventListener('search', updateSearch);
  searchClear.addEventListener('click', () => { searchInput.value = ''; updateSearch(); searchInput.focus(); });
  $$('[data-open-search]').forEach(anchor => anchor.addEventListener('click', event => {
    event.preventDefault(); updateSearch(); open(searchDialog, anchor); searchInput.focus();
  }));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); updateSearch(); open(searchDialog, document.activeElement); searchInput.focus();
    }
  });

  const guideInput = $('#help-guide-input'), guideResults = $('#help-guide-results');
  const guideStatus = $('#help-guide-status');
  const guideTopicButtons = $$('[data-guide-topic]');
  const showAnswers = (items, message) => {
    guideResults.replaceChildren();
    items.forEach(item => {
      const article = make('article', 'guide-answer');
      const links = make('div', 'guide-answer-links');
      links.append(link(item.href, item.linkLabel + ' ↗', 'text-link'), link(item.source, 'Fuente y contexto ↗', 'answer-source'));
      article.append(make('h3', '', item.title), make('p', '', item.answer), links); guideResults.append(article);
    });
    guideStatus.textContent = message;
    if (!items.length) {
      const empty = make('div', 'guide-empty');
      empty.append(make('h3', '', 'No hay una respuesta exacta en la guía.'), make('p', '', 'Prueba con un tema como clima, Pampa Limeña o precios. También puedes revisar las preguntas frecuentes.'), link('preguntas.html', 'Ver preguntas frecuentes ↗', 'text-link'));
      guideResults.append(empty);
    }
  };
  const updateGuide = () => {
    guideTopicButtons.forEach(button => button.removeAttribute('aria-pressed'));
    const terms = words(guideInput.value);
    if (!terms.length) {
      const items = ['pampa', 'paujil', 'precios'].map(id => data.knowledge.find(item => item.id === id));
      showAnswers(items, 'Respuestas para empezar'); return;
    }
    const items = data.knowledge.map(item => ({...item, score: score(terms, item.answer, item.title, item.keywords)}))
      .filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
    showAnswers(items, items.length ? 'Respuestas relacionadas con tu búsqueda' : 'Sin coincidencias');
  };
  $('#help-guide-form').addEventListener('submit', event => { event.preventDefault(); updateGuide(); });
  guideInput.addEventListener('search', updateGuide);
  guideTopicButtons.forEach(button => button.addEventListener('click', () => {
    const item = data.knowledge.find(entry => entry.id === button.dataset.guideTopic);
    guideTopicButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    guideInput.value = item.title;
    showAnswers([item], 'Guía rápida · ' + button.textContent);
  }));
  updateGuide();

  const tabs = $$('.help-tabs [role="tab"]');
  const availability = $('#assistant-availability');
  let availabilityPromise = null, aiAvailable = false;
  const checkAvailability = () => {
    if (availabilityPromise) return availabilityPromise;
    availabilityPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      try {
        if (!/^https?:$/.test(location.protocol)) throw new Error('offline');
        const response = await fetch('https://red-star-3179.tramitesvechiculares25.workers.dev', {signal: controller.signal, cache: 'no-store', credentials: 'same-origin'});
       aiAvailable = response.ok;
      } catch { aiAvailable = false; }
      finally { clearTimeout(timer); }
      availability.textContent = aiAvailable ? 'Asistente IA disponible' : 'Chat IA pendiente de habilitación';
      availability.classList.toggle('available', aiAvailable);
      $('#assistant-connected').hidden = !aiAvailable;
      $('#assistant-unavailable').hidden = aiAvailable;
      if (aiAvailable && !$('#assistant-messages').children.length) addMessage('assistant', 'Puedo orientarte sobre Palcazú, Pampa Limeña y el parque. ¿Qué te gustaría conocer?');
    })();
    return availabilityPromise;
  };
  const setTab = mode => {
    tabs.forEach((tab, index) => {
      const active = index === (mode === 'ai' ? 1 : 0);
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      $('#' + tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (mode === 'ai') checkAvailability();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setTab(index ? 'ai' : 'guide'));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
      setTab(next ? 'ai' : 'guide'); tabs[next].focus();
    });
  });
  $('#back-to-guide').addEventListener('click', () => { setTab('guide'); tabs[0].focus(); });
  $$('[data-open-help]').forEach(anchor => anchor.addEventListener('click', event => {
    event.preventDefault(); setTab(anchor.dataset.helpMode === 'ai' ? 'ai' : 'guide'); open(helpDialog, anchor); tabs[anchor.dataset.helpMode === 'ai' ? 1 : 0].focus();
  }));

  const messageList = $('#assistant-messages'), input = $('#assistant-input');
  const aiStatus = $('#assistant-status'), send = $('#assistant-send'), stop = $('#assistant-stop');
  const retry = $('#assistant-retry');
  let history = [], activeRequest = null, lastMessages = null;
  const addMessage = (role, text, links = []) => {
    const bubble = make('article', 'chat-message ' + role);
    bubble.append(make('span', 'chat-speaker', role === 'user' ? 'Tú' : 'Asistente IA'), make('p', 'chat-text', text));
    if (links.length) {
      const actions = make('div', 'chat-links');
      const allowed = new Set(data.pages.map(page => page.href));
      data.knowledge.forEach(entry => { allowed.add(entry.href); allowed.add(entry.source); });
      links.filter(item => allowed.has(item.href) && typeof item.label === 'string').slice(0, 3).forEach(item => actions.append(link(item.href, item.label + ' ↗', 'text-link')));
      bubble.append(actions);
    }
    messageList.append(bubble);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    messageList.scrollTo({top: messageList.scrollHeight, behavior: reduced ? 'auto' : 'smooth'});
  };
  const busy = value => {
    send.hidden = value; stop.hidden = !value; input.disabled = value;
    $('#assistant-reset').disabled = value;
    $('#assistant-form').setAttribute('aria-busy', String(value));
  };
  const ask = async messages => {
    if (activeRequest || !aiAvailable) return;
    lastMessages = messages; retry.hidden = true; busy(true);
    aiStatus.textContent = 'Preparando una respuesta…';
    const request = {controller: new AbortController(), timedOut: false, stopped: false};
    activeRequest = request;
    const timer = setTimeout(() => { request.timedOut = true; request.controller.abort(); }, 25000);
    try {
      const response = await fetch('https://red-star-3179.tramitesvechiculares25.workers.dev/', {
        method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({messages}), signal: request.controller.signal
      });
      const result = await response.json();
      if (!response.ok || typeof result.text !== 'string' || !result.text.trim()) {
        const error = new Error('request_failed'); error.code = result.code; throw error;
      }
      if (request.stopped) return;
      addMessage('assistant', result.text, Array.isArray(result.links) ? result.links : []);
      history = [...messages, {role: 'assistant', content: result.text.slice(0, 2000)}].slice(-8);
      lastMessages = null; aiStatus.textContent = '';
    } catch (error) {
      if (request.stopped) {
        aiStatus.textContent = 'Respuesta detenida. Puedes reintentar la pregunta.';
      } else if (request.timedOut) {
        aiStatus.textContent = 'La respuesta está tardando. Puedes reintentar o consultar la guía rápida.';
      } else if (error.code === 'not_configured') {
        aiStatus.textContent = 'El asistente no está disponible ahora. La guía rápida sigue disponible.';
      } else if (error.code === 'rate_limited') {
        aiStatus.textContent = 'Espera un minuto antes de hacer otra pregunta.';
      } else {
        aiStatus.textContent = 'No pudimos obtener la respuesta. Reintenta o consulta la guía rápida.';
      }
      retry.hidden = false;
    } finally {
      clearTimeout(timer); activeRequest = null; busy(false);
      if (helpDialog.open && !$('#ai-assistant-panel').hidden) input.focus();
    }
  };
  $('#assistant-form').addEventListener('submit', event => {
    event.preventDefault(); const content = input.value.trim();
    if (!content || content.length > 1000 || activeRequest || !aiAvailable) return;
    // Keep a failed unanswered turn so a new question preserves its context.
    const prior = lastMessages || history;
    const messages = [...prior, {role: 'user', content}].slice(-8);
    addMessage('user', content); input.value = ''; ask(messages);
  });
  retry.addEventListener('click', () => { if (lastMessages) ask(lastMessages); });
  stop.addEventListener('click', () => {
    if (activeRequest) { activeRequest.stopped = true; activeRequest.controller.abort(); }
  });
  $('#assistant-reset').addEventListener('click', () => {
    if (activeRequest) return;
    history = []; lastMessages = null; messageList.replaceChildren(); retry.hidden = true; input.value = ''; aiStatus.textContent = '';
    addMessage('assistant', 'Empezamos de nuevo. ¿Qué te gustaría conocer de Palcazú?'); input.focus();
  });
  helpDialog.addEventListener('close', () => {
    if (activeRequest) { activeRequest.stopped = true; activeRequest.controller.abort(); }
  });
})();
