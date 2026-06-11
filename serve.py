#!/usr/bin/env python3
"""Local dev server with caching disabled, so edits always show on refresh."""
import http.server

PORT = 4173


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler) as srv:
        print(f"Serving portfolio at http://127.0.0.1:{PORT}/ (cache disabled)")
        srv.serve_forever()
