// Pages modules : la démo se lance quand elle est visible (muette, en boucle),
// un clic met en pause ou relance, les chapitres sautent au bon moment.
// Avec « réduire les animations », rien ne démarre seul : bouton lecture.

const player = document.querySelector('.mod-player');
const video = player?.querySelector('.mod-video');
const playButton = player?.querySelector('.mod-play');
const bar = player?.querySelector('.mod-progress i');
const chapters = [...document.querySelectorAll('.mod-chapters button')];
const moduleName = document.querySelector('.mod-page')?.dataset.module ?? '';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let pausedByUser = false;
let tracked = false;

function track() {
  if (tracked) return;
  tracked = true;
  if (typeof window.plausible === 'function') window.plausible('Démo vidéo', { props: { module: moduleName } });
}

function play() {
  video.play().then(() => player.classList.add('is-playing')).catch(() => player.classList.remove('is-playing'));
}

function pause() {
  video.pause();
  player.classList.remove('is-playing');
}

if (video) {
  video.addEventListener('click', () => {
    if (video.paused) { pausedByUser = false; track(); play(); } else { pausedByUser = true; pause(); }
  });
  playButton?.addEventListener('click', () => { pausedByUser = false; track(); play(); });

  video.addEventListener('timeupdate', () => {
    if (bar && video.duration) bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
    // Chapitre actif = le dernier dont l'instant est passé
    let active = -1;
    chapters.forEach((c, i) => { if (video.currentTime + 0.2 >= Number(c.dataset.t)) active = i; });
    chapters.forEach((c, i) => c.classList.toggle('is-active', i === active));
  });

  chapters.forEach((c) => c.addEventListener('click', () => {
    video.currentTime = Number(c.dataset.t);
    pausedByUser = false;
    track();
    play();
    const r = player.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) player.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }));

  // Lien direct vers un chapitre : /module-x.html#t=21
  const hashT = /^#t=(\d+)$/.exec(location.hash);
  if (hashT) video.addEventListener('loadedmetadata', () => { video.currentTime = Number(hashT[1]); }, { once: true });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !pausedByUser) play(); else if (!e.isIntersecting && !video.paused) pause();
      });
    }, { threshold: 0.45 }).observe(video);
  }
}

// Boucle du héros : avec « réduire les animations », elle reste figée sur son poster.
const loop = document.querySelector('.mod-loop-video');
if (loop && reduceMotion) { loop.removeAttribute('autoplay'); loop.pause(); loop.controls = true; }
