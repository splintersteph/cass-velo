// Adresse qui reçoit les demandes : à remplacer par la vraie adresse
const EMAIL_CONTACT = "contact@exemple.fr";

// Menu mobile
const burger = document.querySelector(".burger");
const menu = document.querySelector(".menu");
if (burger) burger.addEventListener("click", () => {
  const ouvert = menu.classList.toggle("ouvert");
  burger.setAttribute("aria-expanded", ouvert);
});

document.querySelectorAll(".annee").forEach(e => e.textContent = new Date().getFullYear());
document.querySelectorAll(".lien-mail").forEach(a => a.href = "mailto:" + EMAIL_CONTACT);

// Formulaire de contact : ouvre la messagerie avec la demande pré-remplie
const form = document.getElementById("formulaire");
if (form) form.addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(form);
  const corps = `Nom : ${f.get("nom")}\nE-mail : ${f.get("email")}\nDemande : ${f.get("demande")}\n\n${f.get("message") || ""}`;
  location.href = `mailto:${EMAIL_CONTACT}?subject=${encodeURIComponent("Demande : " + f.get("demande"))}&body=${encodeURIComponent(corps)}`;
});

function fondDeCarte(carte) {
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 18
  }).addTo(carte);
}

// ---------- Page balades ----------
const zoneCarte = document.getElementById("carte");
if (zoneCarte && window.L) {
  const carte = L.map(zoneCarte, {scrollWheelZoom: false}).setView([45.2, 5.73], 11);
  fondDeCarte(carte);
  const couches = {};
  const liste = document.getElementById("circuits");

  CIRCUITS.forEach(c => {
    const fond = L.polyline(c.trace, {color: "#16243b", weight: 8, opacity: .85});
    const ligne = L.polyline(c.trace, {color: "#c8d63a", weight: 4});
    const depart = L.circleMarker(c.trace[0], {radius: 7, color: "#16243b", weight: 3, fillColor: "#fff", fillOpacity: 1});
    const groupe = L.featureGroup([fond, ligne, depart]).addTo(carte);
    groupe.on("click", () => choisir(c.id));
    couches[c.id] = groupe;

    const barres = [1, 2, 3].map(i => `<b class="${i <= c.niveau ? "on" : ""}"></b>`).join("");
    const el = document.createElement("article");
    el.className = "circuit";
    el.dataset.id = c.id;
    el.dataset.niveau = c.niveau;
    el.tabIndex = 0;
    el.innerHTML = `<span class="niveau"><i aria-hidden="true">${barres}</i>${NIVEAUX[c.niveau]}<span style="font-weight:400;color:var(--doux);margin-left:6px">${c.theme}</span></span>
      <h3>${c.titre}</h3><p>${c.resume}</p>
      <div class="chiffres"><span>${c.distance}</span><span>${c.denivele} D+</span><span>${c.duree}</span></div>
      <ol class="etapes">${c.etapes.map(e => `<li>${e}</li>`).join("")}</ol>
      <div class="photos-circuit"></div>`;
    const sesPhotos = PHOTOS.filter(ph => ph.circuit === c.id);
    sesPhotos.forEach((ph, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Agrandir : " + ph.legende);
      b.innerHTML = `<img src="img/${ph.id}-p.webp" alt="${ph.legende}" loading="lazy">`;
      b.addEventListener("click", e => { e.stopPropagation(); ouvrirPhoto(sesPhotos, k); });
      el.querySelector(".photos-circuit").appendChild(b);
    });
    el.addEventListener("click", () => choisir(c.id));
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choisir(c.id); } });
    liste.appendChild(el);
  });

  // Nos photos géolocalisées, en vignettes rondes sur la carte
  PHOTOS.forEach((ph, i) => {
    const icone = L.divIcon({className: "", html: `<div class="pin-photo" style="background-image:url(img/${ph.id}-p.webp)"></div>`, iconSize: [46, 46], iconAnchor: [23, 23]});
    L.marker(ph.pos, {icon: icone, title: ph.legende, keyboard: true}).on("click", () => ouvrirPhoto(PHOTOS, i)).addTo(carte);
  });

  const tout = L.featureGroup(Object.values(couches));
  carte.fitBounds(tout.getBounds(), {padding: [30, 30]});

  function choisir(id) {
    document.querySelectorAll(".circuit").forEach(el => el.classList.toggle("actif", el.dataset.id === id));
    Object.entries(couches).forEach(([k, g]) => {
      g.eachLayer(l => l.setStyle && l.setStyle({opacity: k === id ? 1 : .25, fillOpacity: k === id ? 1 : .25}));
      if (k === id) g.bringToFront();
    });
    carte.fitBounds(couches[id].getBounds(), {padding: [50, 50], maxZoom: 15});
  }

  document.querySelectorAll(".filtres button").forEach(b => b.addEventListener("click", () => {
    const n = +b.dataset.niveau;
    document.querySelectorAll(".filtres button").forEach(x => x.setAttribute("aria-pressed", x === b));
    const visibles = [];
    document.querySelectorAll(".circuit").forEach(el => {
      const ok = n === 0 || +el.dataset.niveau === n;
      el.hidden = !ok;
      if (ok) visibles.push(el.dataset.id);
    });
    Object.entries(couches).forEach(([k, g]) => {
      if (visibles.includes(k)) g.addTo(carte); else g.remove();
      g.eachLayer(l => l.setStyle && l.setStyle({opacity: 1, fillOpacity: 1}));
    });
    document.querySelectorAll(".circuit").forEach(el => el.classList.remove("actif"));
    carte.fitBounds(L.featureGroup(visibles.map(k => couches[k])).getBounds(), {padding: [30, 30]});
  }));
}

// ---------- Page passeport ----------
const zoneTampons = document.getElementById("tampons");
if (zoneTampons) {
  const CLE = "cassavelo-passeport";
  let poses = [];
  try { poses = JSON.parse(localStorage.getItem(CLE)) || []; } catch (e) { poses = []; }
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(poses)); } catch (e) {} };

  let marqueurs = [];
  const zoneCarteVia = document.getElementById("carte-via");
  let carteVia = null;
  if (zoneCarteVia && window.L) {
    carteVia = L.map(zoneCarteVia, {scrollWheelZoom: false});
    fondDeCarte(carteVia);
    const ligne = ETAPES_VIA.map(e => e.pos);
    L.polyline(ligne, {color: "#3c86a8", weight: 4, dashArray: "2 8", lineCap: "round"}).addTo(carteVia);
    marqueurs = ETAPES_VIA.map((e, i) => L.circleMarker(e.pos, {radius: 9, weight: 3, color: "#16243b", fillColor: "#fff", fillOpacity: 1})
      .bindTooltip(`${i + 1}. ${e.nom}`).on("click", () => basculer(i)).addTo(carteVia));
    carteVia.fitBounds(L.latLngBounds(ligne), {padding: [24, 24]});
  }

  const listeVia = document.getElementById("etapes-via");
  ETAPES_VIA.forEach((e, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tampon";
    b.style.setProperty("--r", `${(i * 37 % 30) - 15}deg`);
    b.textContent = e.nom;
    b.addEventListener("click", () => basculer(i, true));
    zoneTampons.appendChild(b);
    const li = document.createElement("li");
    li.innerHTML = `<strong>${i + 1}. ${e.nom}</strong><span></span>`;
    listeVia.appendChild(li);
  });

  function basculer(i, anime) {
    poses = poses.includes(i) ? poses.filter(x => x !== i) : [...poses, i];
    sauver();
    afficher(anime ? i : null);
  }

  function afficher(nouveau) {
    const tampons = zoneTampons.querySelectorAll(".tampon");
    tampons.forEach((t, i) => {
      const ok = poses.includes(i);
      t.classList.toggle("pose", ok);
      t.classList.toggle("vient", ok && i === nouveau);
      t.setAttribute("aria-pressed", ok);
      t.setAttribute("aria-label", `${ETAPES_VIA[i].nom} : ${ok ? "tamponné" : "pas encore tamponné"}`);
    });
    listeVia.querySelectorAll("li").forEach((li, i) => {
      const ok = poses.includes(i);
      li.classList.toggle("fait-etape", ok);
      li.querySelector("span").textContent = ok ? "Tamponné" : "À faire";
    });
    marqueurs.forEach((m, i) => m.setStyle({fillColor: poses.includes(i) ? "#7a5233" : "#fff"}));
    document.getElementById("compte").textContent = `${poses.length} / ${ETAPES_VIA.length}`;
    document.getElementById("barre").style.width = `${poses.length / ETAPES_VIA.length * 100}%`;
  }

  document.getElementById("raz").addEventListener("click", () => { poses = []; sauver(); afficher(); });
  afficher();
}

// ---------- Scène « voyage » de l'accueil ----------
const voyage = document.getElementById("voyage");
if (voyage) {
  const scene = voyage.querySelector(".scene");
  const pistes = [...voyage.querySelectorAll(".piste")].map(el => ({el, f: +el.dataset.f}));
  const chapitres = [...voyage.querySelectorAll(".chapitre")];
  const astre = voyage.querySelector(".astre");
  const etoiles = voyage.querySelector(".etoiles");
  const km = document.getElementById("km");
  const avance = document.getElementById("avance");
  const roues = [...voyage.querySelectorAll(".roue")];
  const pedalier = voyage.querySelector(".pedalier");
  const jambeAv = voyage.querySelector(".jambe.avant");
  const jambeAr = voyage.querySelector(".jambe.arriere");
  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Couleurs du ciel au fil de la journée : [progression, haut, bas]
  const CIEL = [
    [0, "#f2b48f", "#fde3c6"], [0.28, "#6fb6dc", "#d4edf7"], [0.6, "#5aa7d6", "#dcf0f7"],
    [0.78, "#ef8a4c", "#f9cd85"], [0.9, "#2e3268", "#c96d5c"], [1, "#0d1634", "#27325f"]
  ];
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => "rgb(" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t)).join(",") + ")";
  const lisse = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));

  function couleurCiel(p) {
    for (let i = 1; i < CIEL.length; i++) if (p <= CIEL[i][0]) {
      const [p0, h0, b0] = CIEL[i - 1], [p1, h1, b1] = CIEL[i];
      const t = (p - p0) / (p1 - p0);
      return [mix(h0, h1, t), mix(b0, b1, t)];
    }
    return [CIEL.at(-1)[1], CIEL.at(-1)[2]];
  }

  // Jambe : de la hanche à la pédale, genou calculé (cinématique inverse simple)
  const HANCHE = [86, 64], L = 40, PEDALIER = [96, 128], R = 15;
  function jambe(angle) {
    const pied = [PEDALIER[0] + R * Math.cos(angle), PEDALIER[1] + R * Math.sin(angle)];
    const dx = pied[0] - HANCHE[0], dy = pied[1] - HANCHE[1];
    const d = Math.min(Math.hypot(dx, dy), 2 * L - 0.01);
    const h = Math.sqrt(L * L - (d / 2) ** 2);
    const mx = HANCHE[0] + dx / 2, my = HANCHE[1] + dy / 2;
    const n1 = [mx - h * dy / d, my + h * dx / d], n2 = [mx + h * dy / d, my - h * dx / d];
    const k = n1[0] > n2[0] ? n1 : n2; // le genou part vers l'avant (côté guidon)
    return { d: `M${HANCHE[0]} ${HANCHE[1]} L${k[0].toFixed(1)} ${k[1].toFixed(1)} L${pied[0].toFixed(1)} ${pied[1].toFixed(1)}`, pied };
  }

  let enAttente = false;
  function rendre() {
    enAttente = false;
    const course = voyage.offsetHeight - scene.offsetHeight;
    const p = calme ? 0.3 : Math.min(1, Math.max(0, (scrollY - voyage.offsetTop + 72) / course));
    const vw = innerWidth / 100;

    pistes.forEach(({el, f}) => el.style.transform = `translate3d(${-p * f * 300 * vw}px,0,0)`);
    scene.style.setProperty("--route-x", `${-p * 300 * vw}px`);

    const [haut, bas] = couleurCiel(p);
    scene.style.setProperty("--ciel-haut", haut);
    scene.style.setProperty("--ciel-bas", bas);
    scene.style.setProperty("--nuit", (lisse(0.74, 1, p) * 0.5).toFixed(3));
    scene.style.setProperty("--lumieres", lisse(0.8, 0.95, p).toFixed(2));
    scene.style.setProperty("--texte-scene", p > 0.86 ? "#ffffff" : "#16243b");
    etoiles.style.opacity = lisse(0.88, 1, p);

    // Le soleil traverse le ciel puis se couche ; la lune le remplace
    const t = Math.min(p / 0.9, 1);
    const x = 55 + t * 38, y = 64 - Math.sin(Math.PI * t) * 50;
    if (p < 0.9) {
      astre.style.background = mix("#fff6d0", "#ffb36b", lisse(0.6, 0.88, p));
      astre.style.transform = `translate(${(x - 70) * vw}px, ${(y - 60) * scene.offsetHeight / 100}px)`;
      astre.style.opacity = 1;
    } else {
      astre.style.background = "#f4f1e0";
      astre.style.transform = `translate(${(84 - 70) * vw}px, ${(12 - 60) * scene.offsetHeight / 100}px) scale(.6)`;
      astre.style.opacity = lisse(0.9, 0.97, p);
    }

    chapitres.forEach(c => c.classList.toggle("visible", p >= +c.dataset.de && p < +c.dataset.a));
    km.textContent = Math.round(p * 42);
    avance.style.width = `${p * 100}%`;

    // Roues et pédalage
    const tourRoue = p * 360 * 70, tourPedale = p * Math.PI * 2 * 48;
    roues.forEach(r => r.querySelector(".rayons").setAttribute("transform", `rotate(${tourRoue} ${r.dataset.cx} ${r.dataset.cy})`));
    const a = jambe(tourPedale), b = jambe(tourPedale + Math.PI);
    jambeAv.setAttribute("d", a.d);
    jambeAr.setAttribute("d", b.d);
    pedalier.setAttribute("d", `M${a.pied[0].toFixed(1)} ${a.pied[1].toFixed(1)} L${b.pied[0].toFixed(1)} ${b.pied[1].toFixed(1)}`);
  }
  const demander = () => { if (!enAttente) { enAttente = true; requestAnimationFrame(rendre); } };
  addEventListener("scroll", demander, {passive: true});
  addEventListener("resize", demander);
  rendre();
}

// ---------- Visionneuse photo ----------
let visListe = [], visIndex = 0;
const vis = document.createElement("div");
vis.className = "visionneuse";
vis.setAttribute("role", "dialog");
vis.setAttribute("aria-modal", "true");
vis.setAttribute("aria-label", "Photo agrandie");
vis.innerHTML = `<button class="vis-fermer" aria-label="Fermer">×</button><button class="vis-prec" aria-label="Photo précédente">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="vis-suiv" aria-label="Photo suivante">›</button>`;
document.body.appendChild(vis);
function visAfficher() {
  const ph = visListe[visIndex];
  vis.querySelector("img").src = `img/${ph.id}.webp`;
  vis.querySelector("img").alt = ph.legende;
  vis.querySelector("figcaption").innerHTML = `<span>${ph.jour}, ${ph.lieu}</span>${ph.legende}`;
  vis.querySelector(".vis-prec").hidden = vis.querySelector(".vis-suiv").hidden = visListe.length < 2;
}
function ouvrirPhoto(liste, i) {
  visListe = liste; visIndex = i; visAfficher();
  vis.classList.add("ouverte"); vis.querySelector(".vis-fermer").focus();
}
function fermerPhoto() { vis.classList.remove("ouverte"); }
vis.querySelector(".vis-fermer").onclick = fermerPhoto;
vis.querySelector(".vis-prec").onclick = () => { visIndex = (visIndex - 1 + visListe.length) % visListe.length; visAfficher(); };
vis.querySelector(".vis-suiv").onclick = () => { visIndex = (visIndex + 1) % visListe.length; visAfficher(); };
vis.addEventListener("click", e => { if (e.target === vis) fermerPhoto(); });
addEventListener("keydown", e => {
  if (!vis.classList.contains("ouverte")) return;
  if (e.key === "Escape") fermerPhoto();
  if (e.key === "ArrowLeft") vis.querySelector(".vis-prec").click();
  if (e.key === "ArrowRight") vis.querySelector(".vis-suiv").click();
});

// ---------- Révélation photo et carnet de route (accueil) ----------
const calmeGlobal = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rev = document.getElementById("revelation");
const carnet = document.getElementById("carnet");
if (carnet) {
  carnet.querySelectorAll(".cliche").forEach(f => f.querySelector("button").addEventListener("click", () => ouvrirPhoto(PHOTOS, +f.dataset.i)));
}
function progression(section, vue) {
  const course = section.offsetHeight - vue.offsetHeight;
  return Math.min(1, Math.max(0, (scrollY + 72 - section.offsetTop) / Math.max(course, 1)));
}
if ((rev || carnet) && !calmeGlobal) {
  const piste = carnet && carnet.querySelector(".carnet-piste");
  const vueCarnet = carnet && carnet.querySelector(".carnet-vue");
  function dimensionner() {
    if (!carnet) return;
    const largeur = piste.scrollWidth - innerWidth;
    carnet.style.height = `${largeur + vueCarnet.offsetHeight + 72}px`;
  }
  let attente = false;
  function animer() {
    attente = false;
    if (rev) {
      const p = progression(rev, rev.querySelector(".rev-scene"));
      const e = Math.min(1, p / 0.6), ease = 1 - Math.pow(1 - e, 3);
      rev.style.setProperty("--rev-y", `${22 * (1 - ease)}%`);
      rev.style.setProperty("--rev-x", `${32 * (1 - ease)}%`);
      rev.style.setProperty("--rev-r", `${28 * (1 - ease)}px`);
      rev.style.setProperty("--rev-s", (1.25 - 0.25 * ease).toFixed(3));
      rev.style.setProperty("--rev-t", Math.min(1, Math.max(0, (p - 0.5) / 0.3)).toFixed(3));
    }
    if (carnet) {
      const p = progression(carnet, vueCarnet);
      piste.style.transform = `translate3d(${-p * (piste.scrollWidth - innerWidth)}px,0,0)`;
    }
  }
  const demande = () => { if (!attente) { attente = true; requestAnimationFrame(animer); } };
  addEventListener("scroll", demande, {passive: true});
  addEventListener("resize", () => { dimensionner(); demande(); });
  addEventListener("load", () => { dimensionner(); demande(); });
  dimensionner(); animer();
} else if (rev) {
  rev.style.setProperty("--rev-y", "0%"); rev.style.setProperty("--rev-x", "0%");
  rev.style.setProperty("--rev-s", "1"); rev.style.setProperty("--rev-t", "1");
}

// Mosaïque de l'accueil : ouvre la visionneuse
document.querySelectorAll(".mosaique-btn").forEach((b, i, tous) => b.addEventListener("click", () => {
  const liste = [...tous].map(x => PHOTOS.find(p => p.id === x.dataset.id));
  ouvrirPhoto(liste, i);
}));
