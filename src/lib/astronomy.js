// Astronomy Engine wrapper — transformacja RA/Dec → Alt/Az
window.Astronomy = {
  // Przelicz RA/Dec na Alt/Az dla danej lokalizacji, daty i czasu
  getAltAz(raHours, decDeg, latitude, longitude, date) {
    // Konwertuj RA na degrees (15 degrees per hour)
    const raDeg = raHours * 15;

    // Astronomy Engine wymaga Date obiektu
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    // Astronomy Engine object
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    const equatorial = new Astronomy.EquatorialCoordinates(date, raDeg, decDeg);

    // Transformation RA/Dec → Alt/Az
    const horizontal = Astronomy.Horizon(date, observer, raDeg, decDeg, 'normal');

    return {
      altitude: horizontal.altitude,  // degrees above horizon
      azimuth: horizontal.azimuth     // degrees from north
    };
  },

  // Testuj czy gwiazda jest widoczna (powyżej horyzontu)
  isVisible(raHours, decDeg, latitude, longitude, date) {
    const altAz = this.getAltAz(raHours, decDeg, latitude, longitude, date);
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
