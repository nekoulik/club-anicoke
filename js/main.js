// === Мерцающие звёзды ===
const starsBox = document.getElementById('stars');
for (let i = 0; i < 140; i++) {
    const s = document.createElement('span');
    const size = Math.random() * 2.4 + 0.6;
    s.style.width = s.style.height = size + 'px';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDuration = (2 + Math.random() * 4) + 's';
    s.style.animationDelay = (Math.random() * 4) + 's';
    starsBox.appendChild(s);
}

// === Падающие лепестки сакуры ===
const petalsBox = document.getElementById('petals');
function spawnPetal() {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 10 + Math.random() * 12;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
    const dur = 8 + Math.random() * 8;
    p.style.animationDuration = dur + 's,' + (2 + Math.random() * 3) + 's';
    petalsBox.appendChild(p);
    setTimeout(() => p.remove(), dur * 1000 + 500);
}
for (let i = 0; i < 8; i++) setTimeout(spawnPetal, i * 300);
setInterval(spawnPetal, 700);

// === Мобильное меню ===
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// === Плавное появление секций ===
const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// === Галерея: бесшовная карусель + большое окно ===
const gal = document.getElementById('galleryRow');
if (gal) {
    // 1) Клонируем карточки → бесконечная лента без «отмотки назад»
    const originals = [...gal.children];
    originals.forEach(el => gal.appendChild(el.cloneNode(true)));
    const N = originals.length;
    const wrapW = () => gal.children[N].offsetLeft - gal.children[0].offsetLeft;
    const cardStep = () => {
        const item = gal.querySelector('.g-item');
        return item ? item.offsetWidth + 24 : 440;
    };

    // 2) Своя плавная прокрутка с незаметным переносом
    let raf = null;
    const animateBy = (dx, dur = 650) => {
        cancelAnimationFrame(raf);
        const from = gal.scrollLeft, t0 = performance.now();
        const ease = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const frame = now => {
            const p = Math.min((now - t0) / dur, 1);
            let x = from + dx * ease(p);
            const W = wrapW();
            if (x >= W) x -= W;      // доехали до клона — прыгаем в начало,
            if (x < 0) x += W;       // визуально — едем дальше вправо
            gal.scrollLeft = x;
            if (p < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
    };

    document.getElementById('gNext').addEventListener('click', () => animateBy(cardStep()));
    document.getElementById('gPrev').addEventListener('click', () => {
        if (gal.scrollLeft < 10) gal.scrollLeft += wrapW();
        animateBy(-cardStep());
    });

    // Страховка для нативного скролла (свайп на телефоне)
    gal.addEventListener('scroll', () => {
        const W = wrapW();
        if (gal.scrollLeft >= W) gal.scrollLeft -= W;
    }, { passive: true });

    // 3) Перетаскивание мышью (тоже бесшовное)
    let gDown = false, gMoved = 0, gStartX = 0, gStartScroll = 0;
    gal.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse') return;
        if (gal.scrollLeft < 10) gal.scrollLeft += wrapW();
        gDown = true; gMoved = 0;
        gal.classList.add('dragging');
        gStartX = e.clientX; gStartScroll = gal.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
        if (!gDown) return;
        const dx = e.clientX - gStartX;
        gMoved = Math.max(gMoved, Math.abs(dx));
        const W = wrapW();
        let x = gStartScroll - dx;
        if (x >= W) { x -= W; gStartScroll -= W; }
        if (x < 0) { x += W; gStartScroll += W; }
        gal.scrollLeft = x;
    });
    window.addEventListener('pointerup', () => { gDown = false; gal.classList.remove('dragging'); });

    // 4) Большое окно: данные и плавная смена
    const stageImg = document.getElementById('gStageImg');
    const stageCap = document.getElementById('gStageCap');
    const data = originals.map(el => ({
        src: el.querySelector('img').src,
        cap: el.querySelector('.g-cap').textContent
    }));
    let stageIdx = 0;
    function showStage(i, force) {
        i = (i + N) % N;
        if (!force && i === stageIdx) return;
        stageIdx = i;
        stageImg.classList.add('fade');
        setTimeout(() => {
            stageImg.src = data[i].src;
            stageImg.alt = data[i].cap;
            stageCap.textContent = data[i].cap;
            stageImg.classList.remove('fade');
        }, 280);
    }

    // Окно синхронизируется с позицией ленты
    let syncTick = false;
    gal.addEventListener('scroll', () => {
        if (syncTick) return;
        syncTick = true;
        requestAnimationFrame(() => {
            syncTick = false;
            showStage(Math.round(gal.scrollLeft / cardStep()));
        });
    }, { passive: true });

    // Клик по карточке — показать её в большом окне
    gal.addEventListener('click', e => {
        if (gMoved > 6) return;                 // это было перетаскивание
        const item = e.target.closest('.g-item');
        if (!item) return;
        showStage([...gal.children].indexOf(item), true);
    });

    // 5) Автопрокрутка: всегда вправо, бесконечно
    let gAuto = null, gResume = null;
    const autoStart = () => { if (!gAuto) gAuto = setInterval(() => animateBy(cardStep()), 3500); };
    const autoStop = () => { clearInterval(gAuto); gAuto = null; };
    const autoPause = () => { autoStop(); clearTimeout(gResume); gResume = setTimeout(autoStart, 6000); };
    autoStart();
    gal.addEventListener('mouseenter', autoStop);
    gal.addEventListener('mouseleave', autoStart);
    gal.addEventListener('pointerdown', autoPause);
    gal.addEventListener('wheel', autoPause, { passive: true });
    gal.addEventListener('touchstart', autoPause, { passive: true });
}

// === Мини-радио Anicoke FM (те же потоки, что и на anime-radio) ===
const rpStations = [
    { name: 'Anime', url: 'https://stream.laut.fm/anime' },
    { name: 'Nightcore', url: 'https://stream.laut.fm/nightcoreradio' },
    { name: 'Anime FM', url: 'https://stream.laut.fm/animefm' }
];
const rpAudio = new Audio();
rpAudio.preload = 'none';
let rpIndex = 0, rpPlaying = false, rpLoaded = false;

const rpBox = document.getElementById('radioPlayer');
const rpPlayBtn = document.getElementById('rpPlay');
const rpName = document.getElementById('rpName');

function rpLoad(i) {
    rpIndex = (i + rpStations.length) % rpStations.length;
    rpName.textContent = rpStations[rpIndex].name;
    if (rpPlaying) {
        rpAudio.src = rpStations[rpIndex].url;
        rpLoaded = true;
        rpAudio.play().catch(() => { });
    }
}

rpPlayBtn.addEventListener('click', () => {
    if (rpPlaying) {                      // стоп
        rpAudio.pause();
        rpPlaying = false;
        rpPlayBtn.textContent = '►';
        rpBox.classList.remove('playing');
    } else {                              // плей
        if (!rpLoaded) {
            rpAudio.src = rpStations[rpIndex].url;
            rpLoaded = true;
        }
        rpAudio.play().catch(() => { });
        rpPlaying = true;
        rpPlayBtn.textContent = '■';
        rpBox.classList.add('playing');
    }
});
document.getElementById('rpPrev').addEventListener('click', () => rpLoad(rpIndex - 1));
document.getElementById('rpNext').addEventListener('click', () => rpLoad(rpIndex + 1));

// === Интро-заставка ===
const intro = document.getElementById('intro');
if (intro) {
    const introFill = document.getElementById('introFill');
    const introStatus = document.getElementById('introStatus');
    const introBtn = document.getElementById('introBtn');
    document.body.classList.add('no-scroll');

    let introProgress = 0;
    const introTimer = setInterval(() => {
        introProgress += 7 + Math.random() * 16;
        if (introProgress >= 100) {
            introProgress = 100;
            clearInterval(introTimer);
            introStatus.textContent = 'Готово! Нажми, чтобы войти 🌸';
            introBtn.classList.add('show');
        } else {
            introStatus.textContent = 'Загрузка… ' + Math.floor(introProgress) + '%';
        }
        introFill.style.width = introProgress + '%';
    }, 160);

    introBtn.addEventListener('click', () => {
        intro.classList.add('hidden');
        document.body.classList.remove('no-scroll');
    });
}