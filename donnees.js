// Données des balades et du passeport (tracés indicatifs, à affiner sur le terrain)
const NIVEAUX = {1: "Tranquille", 2: "Découverte", 3: "Évasion"};

const CIRCUITS = [
  {
    id: "quais", niveau: 1, theme: "Patrimoine",
    titre: "Quais de l'Isère et vieille ville",
    resume: "La boucle idéale pour une première sortie : les quais, les bulles de la Bastille, le Musée de Grenoble et l'Île Verte, sans une seule côte.",
    distance: "9 km", denivele: "20 m", duree: "2 h",
    etapes: ["Place Grenette", "Jardin de Ville et téléphérique de la Bastille", "Quai Perrière", "Musée de Grenoble", "Les trois tours de l'Île Verte", "Place Notre-Dame"],
    trace: [[45.1907,5.7275],[45.1925,5.7290],[45.1944,5.7262],[45.1950,5.7318],[45.1965,5.7290],[45.1962,5.7360],[45.1953,5.7400],[45.1940,5.7430],[45.1932,5.7385],[45.1946,5.7330],[45.1925,5.7322],[45.1907,5.7275]]
  },
  {
    id: "jo68", niveau: 1, theme: "Histoire du sport",
    titre: "Grenoble 68, la ville olympique",
    resume: "Sur les traces des Jeux olympiques d'hiver de 1968 : les sites, les anecdotes et ce que les Jeux ont changé dans la ville.",
    distance: "14 km", denivele: "30 m", duree: "2 h 30",
    etapes: ["Place Notre-Dame", "Hôtel de ville et parc Paul-Mistral", "Tour Perret", "Palais des sports", "Anneau de vitesse", "Village olympique"],
    trace: [[45.1925,5.7322],[45.1880,5.7340],[45.1866,5.7347],[45.1860,5.7365],[45.1845,5.7350],[45.1830,5.7405],[45.1760,5.7400],[45.1700,5.7385],[45.1645,5.7370],[45.1690,5.7330],[45.1780,5.7320],[45.1860,5.7310],[45.1925,5.7322]]
  },
  {
    id: "noyarey", niveau: 2, theme: "Nature",
    titre: "Au fil de l'Isère vers Noyarey",
    resume: "On rejoint la Belle Via sur les digues de l'Isère, entre Vercors et Chartreuse, jusqu'aux premiers vergers. Premiers tampons du passeport.",
    distance: "30 km aller-retour", denivele: "60 m", duree: "Demi-journée",
    etapes: ["Quai Stéphane-Jay", "Esplanade", "Digue de l'Isère", "Saint-Égrève", "Noyarey"],
    trace: [[45.1944,5.7262],[45.1985,5.7200],[45.2030,5.7080],[45.2060,5.6930],[45.2120,5.6800],[45.2290,5.6830],[45.2350,5.6650],[45.2440,5.6280]]
  },
  {
    id: "vizille", niveau: 2, theme: "Histoire",
    titre: "Vizille, le château de la Révolution",
    resume: "Cap au sud par les berges du Drac et de la Romanche jusqu'au domaine de Vizille et son grand parc, berceau de la Révolution française.",
    distance: "40 km aller-retour", denivele: "150 m", duree: "Journée",
    etapes: ["Grenoble", "Berges du Drac", "Échirolles", "Jarrie", "Domaine de Vizille"],
    trace: [[45.1907,5.7275],[45.1800,5.7150],[45.1600,5.7100],[45.1450,5.7200],[45.1300,5.7400],[45.1150,5.7550],[45.0950,5.7650],[45.0780,5.7700]]
  },
  {
    id: "sappey", niveau: 3, theme: "Panoramas",
    titre: "Les balcons de Chartreuse",
    resume: "La montée vers Le Sappey-en-Chartreuse par le col de Vence, avec Grenoble et Belledonne à vos pieds. Pour les jambes entraînées ou en vélo électrique.",
    distance: "34 km aller-retour", denivele: "850 m", duree: "Journée",
    etapes: ["Grenoble", "La Tronche", "Corenc", "Col de Vence", "Le Sappey-en-Chartreuse"],
    trace: [[45.1907,5.7275],[45.1990,5.7350],[45.2040,5.7380],[45.2160,5.7500],[45.2250,5.7560],[45.2380,5.7620],[45.2500,5.7700],[45.2620,5.7780]]
  },
  {
    id: "gresivaudan", niveau: 3, theme: "Nature",
    titre: "La Belle Via dans le Grésivaudan",
    resume: "Une grande journée sur la Belle Via, de Grenoble à La Terrasse, entre Chartreuse et Belledonne. Retour en train, vélos à bord.",
    distance: "42 km + retour en TER", denivele: "80 m", duree: "Journée",
    etapes: ["Île Verte", "Meylan", "Montbonnot", "Crolles", "La Terrasse"],
    trace: [[45.1940,5.7430],[45.2000,5.7600],[45.2090,5.7790],[45.2260,5.8050],[45.2550,5.8450],[45.2850,5.8800],[45.3050,5.9100],[45.3230,5.9320]]
  }
];

// Étapes du passeport, de l'amont vers l'aval de l'Isère
const ETAPES_VIA = [
  {nom: "La Terrasse", pos: [45.3230,5.9320]},
  {nom: "Grenoble", pos: [45.1930,5.7290]},
  {nom: "Saint-Égrève", pos: [45.2330,5.6820]},
  {nom: "Noyarey", pos: [45.2440,5.6280]},
  {nom: "Saint-Quentin-sur-Isère", pos: [45.2830,5.5460]},
  {nom: "Tullins", pos: [45.3000,5.4860]},
  {nom: "Vinay", pos: [45.2090,5.4050]},
  {nom: "Saint-Marcellin", pos: [45.1520,5.3220]},
  {nom: "Saint-Nazaire-en-Royans", pos: [45.0600,5.2470]},
  {nom: "Romans-sur-Isère", pos: [45.0440,5.0510]}
];

// Photos de nos sorties (aucune personne sans casque : paysages, vélos, ou cycliste casqué)
const PHOTOS = [
  {id: "bv-003", jour: "Belle Via", lieu: "Près de Vinay", legende: "Entre les noyeraies, casque sur la tête", pos: [45.207, 5.436]},
  {id: "bv-004", jour: "Belle Via", lieu: "Vallée de l'Isère", legende: "La vallée de l'Isère au pied du Vercors", pos: [45.205, 5.456]},
  {id: "bv-009", jour: "Grenoble", lieu: "La Bastille", legende: "Grenoble et l'Isère depuis la Bastille", pos: [45.199, 5.724], circuit: "quais"},
  {id: "bv-013", jour: "Grenoble", lieu: "La Bastille", legende: "Les bulles de la Bastille au coucher du soleil", pos: [45.199, 5.725], circuit: "quais"},
  {id: "bv-017", jour: "Belle Via", lieu: "Meylan", legende: "L'Isère et Belledonne depuis la digue", pos: [45.207, 5.803], circuit: "gresivaudan"},
  {id: "bv-018", jour: "Belle Via", lieu: "Grésivaudan", legende: "Champs de maïs et falaises de Chartreuse", pos: [45.207, 5.804], circuit: "gresivaudan"},
  {id: "bv-023", jour: "Belle Via", lieu: "Grésivaudan", legende: "Au fil de l'Isère, vers les montagnes", pos: [45.207, 5.812], circuit: "gresivaudan"},
  {id: "bv-029", jour: "Savoie", lieu: "Combe de Savoie", legende: "Les vignes de la Combe de Savoie", pos: [45.500, 6.003]},
  {id: "bv-035", jour: "Savoie", lieu: "Lac du Bourget", legende: "Halte au bord du lac du Bourget", pos: [45.691, 5.893]},
  {id: "bv-042", jour: "Vercors", lieu: "Vercors", legende: "Les gorges du Vercors", pos: [45.065, 5.495]},
  {id: "bv-048", jour: "Vercors", lieu: "Vercors", legende: "Les alpages du plateau", pos: [45.044, 5.476]},
  {id: "bv-053", jour: "Vercors", lieu: "Vercors", legende: "Prairies et falaises calcaires", pos: [45.021, 5.449]},
  {id: "bv-087", jour: "Vercors", lieu: "Col du Rousset", legende: "Les lacets du col du Rousset", pos: [44.838, 5.398]},
  {id: "bv-102", jour: "Vercors", lieu: "Combe Laval", legende: "Le cirque de Combe Laval", pos: [44.978, 5.334]},
  {id: "bv-113", jour: "Vercors", lieu: "Combe Laval", legende: "Une mer de nuages sous les falaises", pos: [45.000, 5.334]}
];

// Photos d'illustration (Wikimedia Commons, licences libres, voir credits.html)
PHOTOS.push(
  {id: "c-000", jour: "Photo Ed Yourdon from New York City, USA", lieu: "CC BY-SA 2.0", legende: "Une maman aide sa fille à trouver l'équilibre"},
  {id: "c-001", jour: "Photo Trailnet", lieu: "CC BY-SA 2.0", legende: "Leçon de vélo pour une fillette"},
  {id: "c-005", jour: "Photo Rudolph.A.furtado", lieu: "Public domain", legende: "Une sortie d'enfants encadrée"},
  {id: "c-012", jour: "Photo Alaska DOT&PF", lieu: "CC BY 2.0", legende: "Une sortie à vélo vers l'école"},
  {id: "c-016", jour: "Photo U.S. Navy photo by Journalist 2nd Class Travis D. Eisele.", lieu: "Public domain", legende: "Un moniteur et des enfants entre les plots"},
  {id: "c-018", jour: "Photo Yuba Bicycles", lieu: "CC BY-SA 3.0", legende: "En vélo cargo avec trois enfants"},
  {id: "c-044", jour: "Photo Tenlittlesoldiers", lieu: "CC BY-SA 4.0", legende: "Prêt pour une sortie en handbike"},
  {id: "c-074", jour: "Photo Bill Branson (Photographer)", lieu: "Public domain", legende: "On ajuste les casques avant de partir"},
  {id: "c-134", jour: "Photo Matthias Ledwinka", lieu: "CC BY-SA 4.0", legende: "Balade en famille sur une voie verte"},
  {id: "c-136", jour: "Photo 35mmMan", lieu: "CC BY 2.0", legende: "Balade avec un compagnon à quatre pattes"}
);

const LIEN_TQA = "https://thequietadventure.com/voyages/belle-via-et-vercors/";
