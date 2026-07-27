// Astronomy Engine wrapper — transformacja RA/Dec → Alt/Az
// Uwaga: zapamiętujemy referencję do CDN-owej biblioteki PRZED zdefiniowaniem
// własnego globala — inaczej window.ZenitAstronomy nie mogłoby się nazywać
// tak samo jak biblioteka, ale musimy uważać żeby jej nie nadpisać (tak jak
// robił to poprzedni window.Astronomy = {...}, co samo siebie blokowało).
const AstronomyEngine = window.Astronomy;

window.ZenitAstronomy = {
  // raDeg: rektascensja w STOPNIACH (tak jak trzyma je CATALOG.stars[].ra)
  getAltAz(raDeg, decDeg, latitude, longitude, date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    // Astronomy.Horizon oczekuje RA w godzinach syderycznych (0-24), nie stopniach
    const raHours = raDeg / 15;

    const observer = new AstronomyEngine.Observer(latitude, longitude, 0);
    const horizontal = AstronomyEngine.Horizon(date, observer, raHours, decDeg, 'normal');

    return {
      altitude: horizontal.altitude,  // degrees above horizon
      azimuth: horizontal.azimuth     // degrees from north
    };
  },

  // Testuj czy gwiazda jest widoczna (powyżej horyzontu)
  isVisible(raDeg, decDeg, latitude, longitude, date) {
    const altAz = this.getAltAz(raDeg, decDeg, latitude, longitude, date);
    return altAz.altitude > 0;
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
