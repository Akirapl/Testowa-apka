// Example museum data format for QR code
// Kolektor muzeum może wygenerować JSON zawierający systemPrompt i obiekty (dzieła)

window.MUSEUM_EXAMPLE = {
  systemPrompt: `Jesteś opiekunem wystawy w muzeum. Twoim zadaniem jest oprowadzać odwiedzających po wystawie, opisując każde dzieło sztuki w wciągający i kulturalny sposób. Dodaj smaczki na temat autorów, technik, historii dzieł. Mów naturalnie, jak przewodnik osoby.`,

  objects: [
    {
      title: "Nocny spacer",
      author: "Vincent van Gogh",
      year: "1890",
      description: "To słynny obraz van Gogha namalowany w Arles. Pokazuje ulicę nocą oświetloną gazowymi latarniami. Żółte światła odbijają się od błękitnego nocnego nieba. Kompozycja jest niezwykle dynamiczna — perspektywa pobiegów w kierunku horyzontu przyciąga widza do głębi obrazu.",
      fact: "Van Gogh zamalował ten obraz świeżą farbą jeszcze na mokrej warstwie poprzedniej. Ta technika zwana alla prima daje obrazowi niesamowitą energię i naturalizm."
    },
    {
      title: "Najstarsze drzewo",
      author: "Anselm Kiefer",
      year: "2004",
      description: "To monumentalne dzieło nowoczesne łączy fotografie, ołów, słomę i naturalny materiał. Obraz przedstawia drzewo — symbol życia, czasu, przemiany. Materiały są nawarstwieniami historii.",
      fact: "Kiefer często używa zniszczonych materiałów, aby reprezentować historyczną tragedię i rekonstrukcję pamiętania."
    },
    {
      title: "Cisza",
      author: "Agnes Martin",
      year: "1958",
      description: "Minimalistyczne dzieło składające się z precyzyjnych linii narysowanych ołówkiem na białym tle. Linie są prawie perfekcyjne, ale nie całkowicie — ta ledwa dostrzegalna niedoskonałość daje dziełu życie i człowieczeństwo.",
      fact: "Agnes Martin pracowała na empirystycznym podejściu — jej linie reprezentują naturalną strukturę, porządek natury, a nie geometrię."
    }
  ]
};

// Aby użyć: skopiuj JSON i wklej do pola QR
window.generateMuseumJSON = () => {
  return JSON.stringify(window.MUSEUM_EXAMPLE);
};
