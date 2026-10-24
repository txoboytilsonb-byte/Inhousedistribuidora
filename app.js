// In House Distribuidora — JavaScript corrigido
'use strict';

const WA = '244975634292';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('on');
  clearTimeout(element._timer);
  element._timer = setTimeout(() => element.classList.remove('on'), 2600);
}

const linkWa = (message) => `https://wa.me/${WA}?text=${encodeURIComponent(message)}`;

function abrirModal(html) {
  const modal = $('#modal');
  const content = $('#modal .c');
  if (!modal || !content) return;
  content.innerHTML = html;
  modal.classList.add('on');
}
function fecharModal() {
  $('#modal')?.classList.remove('on');
}

// Clipboard: API may be unavailable on HTTP/local files, so handle failure safely.
async function copiar(texto, mensagem = 'Copiado!') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      toast('✅ ' + mensagem);
      return;
    }
  } catch (error) {
    // Try the compatibility fallback below.
  }
  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    toast(ok ? '✅ ' + mensagem : 'Selecione e copie manualmente o texto.');
  } catch (error) {
    toast('Não foi possível copiar automaticamente.');
  }
}

// Missing images are replaced with a visible fallback rather than a broken icon.
$$('img').forEach((img) => {
  const falha = () => {
    if (!img.isConnected) return;
    const fallback = document.createElement('div');
    fallback.className = 'ph';
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', img.alt || 'Imagem indisponível');
    fallback.textContent = img.alt || 'Imagem indisponível';
    img.replaceWith(fallback);
  };
  img.addEventListener('error', falha, { once: true });
  if (img.complete && !img.naturalWidth) falha();
});

// Theme
function mudarTema(theme) {
  document.documentElement.dataset.theme = theme;
  const button = $('#th');
  if (button) {
    button.textContent = theme === 'dark' ? '🌙' : '☀️';
    button.setAttribute('aria-label', theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
  }
  try { localStorage.setItem('th', theme); } catch (error) {}
}
let tema = 'dark';
try { tema = localStorage.getItem('th') || 'dark'; } catch (error) {}
mudarTema(tema);
$('#th')?.addEventListener('click', () => {
  mudarTema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

// Mobile menu: close after selecting a link.
const menu = $('#nv');
$('#burger')?.addEventListener('click', () => {
  if (!menu) return;
  const open = menu.classList.toggle('on');
  $('#burger').setAttribute('aria-expanded', String(open));
});
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  if (window.matchMedia('(max-width: 800px)').matches) menu.classList.remove('on');
}));

// Modal controls
$('#modal .x')?.addEventListener('click', fecharModal);
$('#modal')?.addEventListener('click', (event) => {
  if (event.target.id === 'modal') fecharModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') fecharModal();
});

// Back to top
$('#up')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
const atualizarTopo = () => $('#up')?.classList.toggle('on', window.scrollY > 400);
window.addEventListener('scroll', atualizarTopo, { passive: true });
atualizarTopo();

// Accordions
$$('.acc > button').forEach((button) => {
  button.setAttribute('aria-expanded', String(button.parentElement.classList.contains('open')));
  button.addEventListener('click', () => {
    const panel = button.parentElement;
    const open = panel.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });
});

// Reveal animation — do not break the rest of the page on older browsers.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.1 });
  $$('.rv').forEach((element) => observer.observe(element));
} else {
  $$('.rv').forEach((element) => element.classList.add('in'));
}

// ===== CONTADORES AUTOMÁTICOS (página Saber Mais) =====
// Cada número conta sozinho o que existe no site:
//   data-conta="noticias"   = notícias que estão no index.html
//   data-conta="categorias" = categorias (botões) do index.html
//   data-conta="planos"     = planos do servicos.html
// O número escrito em data-n é só um valor de reserva, usado quando o
// site é aberto direto do telemóvel (sem servidor). Online, conta sempre
// o que está nas páginas.
const FONTES_CONTAGEM = {
  noticias: { pagina: 'index.html', seletor: '#g .card' },
  categorias: { pagina: 'index.html', seletor: '#ch .chip' },
  planos: { pagina: 'servicos.html', seletor: '.plan' },
};
const paginasLidas = {};

// Lê uma página do site (uma só vez) para a poder contar
function lerPagina(endereco) {
  if (!paginasLidas[endereco]) {
    paginasLidas[endereco] = fetch(endereco, { cache: 'no-cache' })
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Erro ' + resposta.status);
        return resposta.text();
      })
      .then((html) => new DOMParser().parseFromString(html, 'text/html'));
  }
  return paginasLidas[endereco];
}

// Faz o número subir até ao total (sempre em cerca de 1 segundo)
function animarNumero(elemento, total) {
  let atual = 0;
  const passo = Math.max(1, Math.ceil(total / 25));
  elemento.textContent = '0';
  const relogioNumero = setInterval(() => {
    atual = Math.min(total, atual + passo);
    elemento.textContent = String(atual);
    if (atual >= total) clearInterval(relogioNumero);
  }, 40);
}

$$('[data-n]').forEach(async (elemento) => {
  let total = Number(elemento.dataset.n); // valor de reserva
  const fonte = FONTES_CONTAGEM[elemento.dataset.conta];
  if (fonte) {
    try {
      const pagina = await lerPagina(fonte.pagina);
      total = pagina.querySelectorAll(fonte.seletor).length;
    } catch (erro) {
      // Sem servidor: fica o número de reserva
    }
  }
  if (Number.isFinite(total)) animarNumero(elemento, total);
});

// Ordena as notícias pela data (data-data): a mais recente fica primeiro.
// Se duas tiverem a mesma data, fica primeiro a que está mais acima no HTML.
const listaNoticias = $('#g');
if (listaNoticias) {
  const ordenadas = $$('#g .card')
    .map((card, posicao) => ({ card, posicao, data: card.dataset.data || '' }))
    .sort((a, b) => b.data.localeCompare(a.data) || a.posicao - b.posicao);
  const aviso = $('#vazio');
  ordenadas.forEach((item) => listaNoticias.insertBefore(item.card, aviso));
}

// ===== SLIDER DE DESTAQUES =====
// Quantas notícias novas aparecem no destaque quando se escolhe uma categoria
const MAX_DESTAQUES_CATEGORIA = 3;

const slider = $('#slider');
let slides = [];
let pontos = [];
let atual = 0;
let relogio;

// Escolhe as notícias que vão para o destaque
function escolherDestaques(categoria) {
  const todas = $$('#g .card'); // já ordenadas: a mais nova primeiro
  // Dentro de uma categoria: as mais novas dessa categoria
  if (categoria && categoria !== 'gerais') {
    return todas.filter((card) => card.dataset.cat === categoria).slice(0, MAX_DESTAQUES_CATEGORIA);
  }
  // Notícias Gerais (início): a mais nova de cada categoria
  const vistas = new Set();
  return todas.filter((card) => {
    const cat = card.dataset.cat;
    if (!cat || vistas.has(cat)) return false;
    vistas.add(cat);
    return true;
  });
}

// Mostra o slide número n
function mostrar(n) {
  if (slides.length === 0) return;
  atual = (n + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle('on', k === atual));
  pontos.forEach((p, k) => p.classList.toggle('on', k === atual));
}

// Passa sozinho a cada 5 segundos
function reiniciar() {
  clearInterval(relogio);
  const parado = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (slides.length > 1 && !parado) relogio = setInterval(() => mostrar(atual + 1), 5000);
}

// Cria os slides da categoria escolhida
function montarSlider(categoria) {
  if (!slider) return;
  clearInterval(relogio);
  const destaques = escolherDestaques(categoria);
  slides = [];
  pontos = [];
  slider.innerHTML = '';
  slider.hidden = destaques.length === 0;
  if (destaques.length === 0) return;

  slider.innerHTML =
    '<div class="slides"></div>' +
    '<button class="ib s-prev" aria-label="Anterior">‹</button>' +
    '<button class="ib s-next" aria-label="Seguinte">›</button>' +
    '<div class="s-dots"></div>';
  const caixa = $('.slides', slider);
  const bolas = $('.s-dots', slider);

  destaques.forEach((card, n) => {
    const texto = (sel) => $(sel, card)?.textContent.trim() || '';
    const slide = document.createElement('a');
    slide.className = 'slide';
    slide.href = card.getAttribute('href');

    // Imagem (com o fundo desfocado)
    const foto = $('img', card)?.getAttribute('src') || '';
    const imgBox = document.createElement('div');
    imgBox.className = 's-img';
    const fundo = document.createElement('span');
    fundo.className = 's-bg';
    if (foto) fundo.style.backgroundImage = `url("${foto}")`;
    imgBox.appendChild(fundo);
    if (foto) {
      const img = document.createElement('img');
      img.src = foto;
      img.alt = texto('h3');
      img.addEventListener('error', () => img.remove());
      imgBox.appendChild(img);
    }

    // Texto: etiqueta, título, resumo e botão
    const txt = document.createElement('div');
    txt.className = 's-txt';
    const etiqueta = document.createElement('span');
    etiqueta.className = 'badge';
    etiqueta.textContent = '🆕 NOVO · ' + texto('.badge');
    const titulo = document.createElement('h2');
    titulo.textContent = texto('h3');
    const resumo = document.createElement('p');
    resumo.textContent = texto('.bd p');
    const botao = document.createElement('span');
    botao.className = 'btn';
    botao.textContent = 'Ler agora';
    txt.append(etiqueta, titulo, resumo, botao);

    slide.append(imgBox, txt);
    caixa.appendChild(slide);

    // Bolinha deste slide
    const bola = document.createElement('button');
    bola.setAttribute('aria-label', 'Ir para o destaque ' + (n + 1));
    bola.addEventListener('click', () => {
      mostrar(n);
      reiniciar();
    });
    bolas.appendChild(bola);
  });

  slides = $$('.slide', slider);
  pontos = $$('.s-dots button', slider);
  $('.s-prev', slider).addEventListener('click', () => {
    mostrar(atual - 1);
    reiniciar();
  });
  $('.s-next', slider).addEventListener('click', () => {
    mostrar(atual + 1);
    reiniciar();
  });
  // Só uma notícia: esconde setas e bolinhas
  if (slides.length < 2) $$('.s-prev, .s-next, .s-dots', slider).forEach((e) => (e.hidden = true));
  mostrar(0);
  reiniciar();
}

// Deslizar o dedo no telemóvel e pausar com o rato (ligado uma só vez)
if (slider) {
  let inicioX = 0;
  slider.addEventListener(
    'touchstart',
    (e) => {
      inicioX = e.touches[0].clientX;
      clearInterval(relogio);
    },
    { passive: true },
  );
  slider.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
    reiniciar();
  });
  slider.addEventListener('mouseenter', () => clearInterval(relogio));
  slider.addEventListener('mouseleave', reiniciar);
}

// ===== PESQUISA, CATEGORIAS E TÍTULOS (página inicial) =====
if ($('#g')) {
  const cards = $$('#g .card');
  const chips = $$('.chip');
  const search = $('#q');
  const empty = $('#vazio');
  const tituloLista = $('#lista-titulo');
  const bannerCat = $('#cat-titulo');
  const categoriasValidas = new Set(chips.map((chip) => chip.dataset.k).filter(Boolean));

  // Avisa (na consola) se alguma notícia tiver a categoria escrita errada
  cards.forEach((card) => {
    if (!categoriasValidas.has(card.dataset.cat)) {
      console.warn('Notícia com data-cat inválido:', card.dataset.cat, card);
    }
    if (!card.dataset.data) console.warn('Notícia sem data-data:', card);
  });

  // Categoria escolhida pelo endereço (?cat=rap). Sem categoria = Notícias Gerais
  const params = new URLSearchParams(window.location.search);
  let categoria = params.get('cat') || 'gerais';
  if (!categoriasValidas.has(categoria)) categoria = 'gerais';
  let textoPesquisa = '';

  const nomeDaCategoria = () =>
    chips.find((chip) => chip.dataset.k === categoria)?.textContent.trim() || '';

  // Mostra só as notícias da categoria (Notícias Gerais mostra todas)
  const atualizarLista = () => {
    let visiveis = 0;
    cards.forEach((card) => {
      const combina =
        (categoria === 'gerais' || card.dataset.cat === categoria) &&
        card.textContent.toLocaleLowerCase().includes(textoPesquisa);
      card.hidden = !combina;
      if (combina) visiveis += 1;
    });
    if (empty) empty.hidden = visiveis !== 0;
    chips.forEach((chip) => {
      const ativo = chip.dataset.k === categoria;
      chip.classList.toggle('on', ativo);
      chip.setAttribute('aria-pressed', String(ativo));
    });
  };

  // Escolhe a categoria: lista, destaque e títulos mudam juntos
  const escolherCategoria = (nova) => {
    categoria = nova;
    atualizarLista();
    montarSlider(categoria);
    const nome = nomeDaCategoria();
    const emCategoria = categoria !== 'gerais';
    if (tituloLista) tituloLista.textContent = emCategoria ? '📚 Todas as notícias desta categoria' : nome;
    if (bannerCat) {
      bannerCat.hidden = !emCategoria;
      $('h2', bannerCat).textContent = nome;
    }
  };

  $('#ch')?.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip || !chip.dataset.k) return;
    escolherCategoria(chip.dataset.k);
    try {
      window.history.replaceState(null, '', '?cat=' + chip.dataset.k);
    } catch (error) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  search?.addEventListener('input', () => {
    textoPesquisa = search.value.trim().toLocaleLowerCase();
    atualizarLista();
  });
  escolherCategoria(categoria);
}

// Service plans: clicking a card opens its details; links inside the modal remain clickable.
$$('.plan').forEach((plan) => {
  const details = $('.detalhes', plan);
  if (!details) return;
  plan.setAttribute('tabindex', '0');
  plan.setAttribute('role', 'button');
  plan.setAttribute('aria-label', `Ver detalhes do plano ${$('h3', plan)?.textContent || ''}`);
  const showDetails = () => abrirModal(details.innerHTML);
  plan.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    showDetails();
  });
  plan.addEventListener('keydown', (event) => {
    if (event.target !== plan) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showDetails();
    }
  });
});

// Copy buttons
$$('[data-copy]').forEach((button) => {
  button.addEventListener('click', () => copiar(button.dataset.copy || '', button.dataset.msg || 'Copiado!'));
});

// Share and copy article text
$$('[data-share]').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: window.location.href });
      } else {
        await copiar(window.location.href, 'Link copiado!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') toast('Não foi possível partilhar. Copie o link da página.');
    }
  });
});
$$('[data-copytext]').forEach((button) => {
  button.addEventListener('click', () => {
    const articleText = $('.art .tx')?.innerText || document.querySelector('main')?.innerText || '';
    copiar(articleText, 'Texto copiado!');
  });
});

// Forms send a pre-filled message to WhatsApp.
$$('form#fm').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('#fn', form)?.value.trim();
    const message = $('#fx', form)?.value.trim();
    if (!name || !message) {
      form.reportValidity();
      return;
    }
    const url = linkWa(`Olá! Sou ${name}. ${message}`);
    const opened = window.open(url, '_blank');
    if (opened) opened.opener = null;
    else window.location.href = url;
    toast('A preparar a mensagem no WhatsApp…');
  });
});
