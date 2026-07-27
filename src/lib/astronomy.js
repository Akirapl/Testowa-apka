// Transformacja RA/Dec → Alt/Az — własna implementacja, bez zależności zewnętrznych.
//
// Wcześniej ta biblioteka opierała się na CDN-owym astronomy-engine, ale ten
// skrypt w praktyce nigdy nie ustawiał window.Astronomy w przeglądarce
// (potwierdzone realnie na wdrożonej stronie, nie tylko w środowisku deweloperskim) —
// prawdopodobnie plik pod tym adresem CDN to surowe źródło ES-modułowe, nie
// zbudowany UMD bundle. Zamiast dalej zgadywać poprawny adres, liczymy Alt/Az
// standardowym, podręcznikowym wzorem sferycznej astronomii — zero zależności,
// w pełni testowalne offline.
window.ZenitAstronomy = {
  // raDeg/decDeg: współrzędne równikowe w STOPNIACH (J2000.0)
  // latDeg/lonDeg: lokalizacja obserwatora w stopniach (lon dodatnia na wschód)
  // date: obiekt Date (UTC)
  getAltAz(raDeg, decDeg, latDeg, lonDeg, date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const toRad = (deg) => deg * Math.PI / 180;
    const toDeg = (rad) => rad * 180 / Math.PI;
    const norm360 = (deg) => ((deg % 360) + 360) % 360;

    // Julian Date z Unix epoch (2440587.5 = JD dla 1 stycznia 1970 00:00 UTC)
    const JD = date.getTime() / 86400000 + 2440587.5;
    const D = JD - 2451545.0; // dni od J2000.0

    // Greenwich Mean Sidereal Time — uproszczony wzór liniowy (wystarczająco
    // dokładny dla narracji głosowej; błąd rzędu ułamków sekundy kątowej/wiek)
    const gmstDeg = norm360(280.46061837 + 360.98564736629 * D);

    // Local Sidereal Time i kąt godzinny celu
    const lstDeg = norm360(gmstDeg + lonDeg);
    const hourAngleDeg = norm360(lstDeg - raDeg);

    const H = toRad(hourAngleDeg);
    const dec = toRad(decDeg);
    const lat = toRad(latDeg);

    // Standardowa transformacja współrzędnych horyzontalnych
    const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H);
    const altitude = toDeg(Math.asin(sinAlt));

    const y = -Math.sin(H) * Math.cos(dec);
    const x = Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(H);
    const azimuth = norm360(toDeg(Math.atan2(y, x))); // 0=północ, 90=wschód, 180=południe, 270=zachód

    return { altitude, azimuth };
  },

  // Testuj czy gwiazda jest widoczna (powyżej horyzontu)
  isVisible(raDeg, decDeg, latDeg, lonDeg, date) {
    return this.getAltAz(raDeg, decDeg, latDeg, lonDeg, date).altitude > 0;
  },

  // Opisz kierunek w naturalnym języku
  describeDirection(azimuth) {
    if (azimuth < 45) return "północ";
    if (azimuth < 135) return "wschód";
    if (azimuth < 225) return "południe";
    if (azimuth < 315) return "zachód";
    return "północ";
  }
};
