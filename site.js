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
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
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
    const fond = L.polyline(c.trace, {color: "#ffffff", weight: 8, opacity: .9});
    const ligne = L.polyline(c.trace, {color: "#2f5d46", weight: 4});
    const depart = L.circleMarker(c.trace[0], {radius: 7, color: "#2f5d46", weight: 3, fillColor: "#fff", fillOpacity: 1});
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
    L.polyline(ligne, {color: "#2f5d46", weight: 3, dashArray: "2 8", lineCap: "round"}).addTo(carteVia);
    marqueurs = ETAPES_VIA.map((e, i) => L.circleMarker(e.pos, {radius: 9, weight: 3, color: "#2f5d46", fillColor: "#fff", fillOpacity: 1})
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
    marqueurs.forEach((m, i) => m.setStyle({fillColor: poses.includes(i) ? "#2f5d46" : "#fff"}));
    document.getElementById("compte").textContent = `${poses.length} / ${ETAPES_VIA.length}`;
    document.getElementById("barre").style.width = `${poses.length / ETAPES_VIA.length * 100}%`;
  }

  document.getElementById("raz").addEventListener("click", () => { poses = []; sauver(); afficher(); });
  afficher();
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

// ---------- Bande de photos de l'accueil ----------
document.querySelectorAll(".bande button").forEach((b, i, tous) => b.addEventListener("click", () => {
  ouvrirPhoto([...tous].map(x => PHOTOS.find(p => p.id === x.dataset.id)), i);
}));
