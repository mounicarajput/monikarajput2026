"""Local preview server that never caches, so edits show up on a normal refresh.
Run: python serve.py   (then open http://localhost:3000)"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


ThreadingHTTPServer(("127.0.0.1", 3000), NoCache).serve_forever()
