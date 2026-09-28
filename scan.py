#!/usr/bin/env python3
"""Lekki skaner nagłówków bezpieczeństwa i ekspozycji ścieżek.

Uruchamiaj wyłącznie przeciwko hostom, które posiadasz lub masz pisemną zgodę
na ich testowanie.

Użycie:
    python3 scan.py https://staging.digitalwitness.me/
    python3 scan.py https://example.test/ --insecure   # pomija weryfikację TLS
"""
import argparse
import sys

import requests

# Nagłówki bezpieczeństwa, których obecność sprawdzamy.
SECURITY_HEADERS = [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
]

# Nagłówki ujawniające technologię (dobrze, gdy ich NIE ma).
FINGERPRINT_HEADERS = ["Server", "X-Powered-By", "X-AspNet-Version"]

# Ścieżki wrażliwe / typowe dla popularnych CMS-ów.
PATHS = [
    "/wp-login.php", "/wp-admin/", "/robots.txt", "/.env",
    "/.git/config", "/admin/", "/phpmyadmin/", "/backup/",
    "/xmlrpc.php", "/wp-content/uploads/", "/.git/HEAD",
    "/config.php.bak", "/.htaccess", "/server-status",
]

UA = "security-check/1.0 (+authorized scan)"


def fetch(session, url, verify, allow_redirects=False):
    try:
        return session.get(
            url, timeout=10, verify=verify, allow_redirects=allow_redirects
        )
    except requests.exceptions.RequestException as exc:
        return exc


def classify(path, resp):
    """Zwraca (znacznik, opis) dla wyniku sprawdzenia ścieżki."""
    if isinstance(resp, Exception):
        return "  ", f"blad: {resp.__class__.__name__}"
    code = resp.status_code
    size = len(resp.content)
    if code == 200:
        return "!!", f"DOSTEPNE (200, {size} B)"
    if code in (301, 302, 307, 308):
        loc = resp.headers.get("Location", "?")
        return "->", f"przekierowanie ({code}) -> {loc}"
    if code in (401, 403):
        # Istnieje, ale chronione — nadal warto odnotować.
        return " *", f"istnieje, chronione ({code})"
    if code == 404:
        return "  ", "brak (404)"
    return " ?", f"inny status ({code}, {size} B)"


def main():
    ap = argparse.ArgumentParser(description="Skaner nagłówków i ścieżek.")
    ap.add_argument("url", help="Bazowy URL, np. https://host/")
    ap.add_argument(
        "--insecure", action="store_true",
        help="Pomija weryfikacje certyfikatu TLS (domyslnie wlaczona).",
    )
    args = ap.parse_args()

    base = args.url.rstrip("/")
    verify = not args.insecure
    if not verify:
        requests.packages.urllib3.disable_warnings()

    session = requests.Session()
    session.headers.update({"User-Agent": UA})

    root = fetch(session, base + "/", verify, allow_redirects=True)
    if isinstance(root, Exception):
        print(f"[-] Brak polaczenia: {root}")
        return 1

    print(f"[+] URL koncowy:   {root.url}")
    print(f"[+] Status:        {root.status_code}")
    print(f"[+] Typ zawartosci:{root.headers.get('Content-Type', '?')}")

    print("\n== Odciski technologii ==")
    for h in FINGERPRINT_HEADERS:
        val = root.headers.get(h)
        flag = "ujawnia" if val else "ukryte"
        print(f"  [{flag}] {h}: {val or 'brak'}")

    print("\n== Naglowki bezpieczenstwa ==")
    for h in SECURITY_HEADERS:
        val = root.headers.get(h)
        mark = "OK " if val else "BRAK"
        print(f"  [{mark}] {h}: {val or '-- brak --'}")

    print("\n== Ekspozycja sciezek ==")
    for p in PATHS:
        resp = fetch(session, base + p, verify)
        mark, desc = classify(p, resp)
        # Wypisuj tylko wyniki istotne (pomijaj czyste 404).
        if desc != "brak (404)":
            print(f"  [{mark}] {p} -> {desc}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
