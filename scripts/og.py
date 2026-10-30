#!/usr/bin/env python3
"""Regenerate assets/img/og-image.png (the link preview) from the live page."""
import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome")
    pg = b.new_page(viewport=dict(width=1200, height=630), device_scale_factor=1, reduced_motion="reduce")
    pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/index.html")
    pg.evaluate("document.fonts.ready")
    pg.evaluate("document.getElementById('clock').textContent='SGT'")
    pg.screenshot(path=str(ROOT / "assets/img/og-image.png"))
    b.close()
print("wrote assets/img/og-image.png")
