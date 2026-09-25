#!/usr/bin/env python3
"""
ElementLab Sand Simulator - Yerel Geliştirme Sunucusu
Hem Linux hem Windows ile tam uyumludur.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import time

DEFAULT_PORT = 5174

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        sys.stdout.write(f"[\033[93mElementLab\033[0m] {self.address_string()} - {args[0]}\n")

def find_available_port(start_port):
    port = start_port
    while port < start_port + 50:
        try:
            with socketserver.TCPServer(("", port), None) as s:
                return port
        except OSError:
            port += 1
    return start_port

def open_browser(url):
    time.sleep(0.6)
    webbrowser.open(url)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    port = find_available_port(DEFAULT_PORT)
    url = f"http://localhost:{port}"

    print("=" * 55)
    print("⚗️  \033[1mElementLab Simulator - Yerel Sunucu\033[0m")
    print("=" * 55)
    print(f"📂 Dizin:       {script_dir}")
    print(f"🌐 Adres:       \033[94m{url}\033[0m")
    print(f"👤 Geliştirici: \033[95m@devilteams-s\033[0m")
    print(f"🛑 Durdur:      Kapatmak için \033[91mCtrl + C\033[0m tuşlarına basın.")
    print("=" * 55 + "\n")

    threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer(("", port), CustomHTTPHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Sunucu kapatıldı. İyi çalışmalar!")
        sys.exit(0)

if __name__ == '__main__':
    main()
