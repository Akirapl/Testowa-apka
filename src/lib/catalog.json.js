// Tier 1: ~20–30 ręcznie wyselekcjonowanych gwiazd
// Źródło: Yale Bright Star Catalogue, współrzędne na epoch J2000.0

window.CATALOG = {
  stars: [
    // Wielki Wóz (Ursa Major)
    {
      name: "Dubhe",
      const: "UMa",
      ra: 161.269, // degrees
      dec: 61.451,
      mag: 1.81,
      fact: "Dwie skrajne gwiazdy miski — razem wskazują na Gwiazdę Polarną"
    },
    {
      name: "Merak",
      const: "UMa",
      ra: 165.460,
      dec: 56.383,
      mag: 2.37,
      fact: "Wraz z Dubbhe tworzą „wskazówkę" na Polaris"
    },
    {
      name: "Alkaid",
      const: "UMa",
      ra: 206.886,
      dec: 49.313,
      mag: 1.86,
      fact: "Ostatnia gwiazda rączki Wielkiego Wozu"
    },

    // Gwiazda Polarna
    {
      name: "Polaris (α Ursae Minoris)",
      const: "UMi",
      ra: 37.954,
      dec: 89.264,
      mag: 2.02,
      fact: "Całe nocne niebo obraca się wokół niej — wędrowcy nawigowali po niej od tysięcy lat"
    },

    // Kasjopeja (Cassiopeia)
    {
      name: "Scheherazade (γ Cassiopeiae)",
      const: "Cas",
      ra: 0.676,
      dec: 60.717,
      mag: 2.47,
      fact: "Centrum charakterystycznego W gwiazdozbioru Kasjopei"
    },

    // Pas Oriona (zimą)
    {
      name: "Alnitak (ζ Orionis)",
      const: "Ori",
      ra: 85.266,
      dec: -1.943,
      mag: 1.93,
      fact: "Lewa gwiazda Pasa Oriona"
    },
    {
      name: "Alnilam (ε Orionis)",
      const: "Ori",
      ra: 94.975,
      dec: -1.202,
      mag: 1.70,
      fact: "Środkowa gwiazda Pasa Oriona"
    },
    {
      name: "Mintaka (δ Orionis)",
      const: "Ori",
      ra: 84.053,
      dec: -0.299,
      mag: 2.23,
      fact: "Prawa gwiazda Pasu Oriona"
    },

    // Betelgeuse
    {
      name: "Betelgeuse (α Orionis)",
      const: "Ori",
      ra: 88.793,
      dec: 7.407,
      mag: 0.45,
      fact: "Supergigant czerwony — jedna z największych znanych gwiazd"
    },

    // Rigel
    {
      name: "Rigel (β Orionis)",
      const: "Ori",
      ra: 78.634,
      dec: -8.202,
      mag: 0.13,
      fact: "Najjaśniejsza gwiazda Oriona — gaz supergigant niebieski"
    },

    // Trójkąt Letni (latem)
    {
      name: "Vega (α Lyrae)",
      const: "Lyr",
      ra: 279.235,
      dec: 38.785,
      mag: 0.03,
      fact: "Najjaśniejsza gwiazda Trójkąta Letniego — kiedyś był Gwiazdą Polarną!"
    },
    {
      name: "Deneb (α Cygni)",
      const: "Cyg",
      ra: 310.358,
      dec: 45.281,
      mag: 1.25,
      fact: "Końcówka skrzydła Łabędzia w Trójkącie Letnim"
    },
    {
      name: "Altair (α Aquilae)",
      const: "Aql",
      ra: 297.696,
      dec: 8.868,
      mag: 0.77,
      fact: "Gwiazda Orła w Trójkącie Letnim — szybko się porusza na niebie"
    },

    // Plejady
    {
      name: "Alcyone (η Tauri)",
      const: "Tau",
      ra: 56.866,
      dec: 24.105,
      mag: 2.87,
      fact: "Najjaśniejsza z Plejad — siedmiu sióstr z greckiej mitologii"
    },

    // Syrius
    {
      name: "Sirius (α Canis Majoris)",
      const: "CMa",
      ra: 101.287,
      dec: -16.643,
      mag: -1.46,
      fact: "Najjaśniejsza gwiazda na nocnym niebie — widać ją nawet za dnia"
    },

    // Procion
    {
      name: "Procyon (α Canis Minoris)",
      const: "CMi",
      ra: 114.829,
      dec: 5.225,
      mag: 0.40,
      fact: "Mały pies idący za Orionem — białą karłowata gwiazda"
    },

    // Antares
    {
      name: "Antares (α Scorpii)",
      const: "Sco",
      ra: 247.352,
      dec: -26.432,
      mag: 1.06,
      fact: "Serce Skorpiona — czerwony supergigant w przeciwieństwie Betelgeuse"
    }
  ],

  // Specjalne punkty odniesienia
  references: [
    {
      name: "Wielki Wóz",
      description: "Siedem jasnych gwiazd tworzących charakterystyczną chochlę",
      stars: ["Dubhe", "Merak", "Alkaid"]
    },
    {
      name: "Gwiazda Polarna",
      description: "Praktycznie na biegunie północnym — nie porusza się na niebie",
      stars: ["Polaris (α Ursae Minoris)"]
    }
  ]
};
