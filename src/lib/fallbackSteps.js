// Statyczne kroki na wypadek błędu sieci — gwarantuje że appka nie ucichnie
window.FALLBACK_STEPS = [
  {
    target: "Wielki Wóz",
    narration: "Popatrz na północ. Szukaj siedmiu jasnych gwiazd, które razem wyglądają jak duża chochla do zupy. To Wielki Wóz, najjaśniejsza część gwiazdozbioru Wielkiej Niedźwiedzicy.",
    fact: "Dwie skrajne gwiazdy miski nazywają się Dubhe i Merak — od nich zaraz poprowadzimy dalej."
  },
  {
    target: "Gwiazda Polarna",
    narration: "Znajdź dwie gwiazdy na końcu miski Wozu — Dubhe i Merak. Narysuj w myślach linię przez nie i wydłuż ją około pięciokrotnie. Trafisz na gwiazdę, która prawie stoi w miejscu.",
    fact: "Całe nocne niebo obraca się wokół niej. Od tysięcy lat wędrowcy i żeglarze nawigowali właśnie po Gwieździe Polarnej."
  },
  {
    target: "Kasjopeja",
    narration: "Teraz cofnij się do Wielkiego Wozu. Po drugiej stronie Gwiazdy Polarnej — po przeciwnej stronie niż Wóz — szukaj gwiazdozbioru w kształcie litery W. To Kasjopeja.",
    fact: "W mitologii greckiej to królowa, która się pochwalała — ze względu na karę siedzi teraz do góry nogami na tronie na niebie."
  },
  {
    target: "Plejady",
    narration: "Wróć do Wielkiego Wozu. Poniżej i na prawo szukaj małej grupki bardzo bliskich sobie, słabszych gwiazd. Wyglądają jak mała chmurka. To Plejady — siedem sióstr.",
    fact: "Wszystkie gwiazdy Plejad narodziły się razem, około sto milionów lat temu. To jeden z najmłodszych znanych gwiazdzistych skupień."
  }
];
