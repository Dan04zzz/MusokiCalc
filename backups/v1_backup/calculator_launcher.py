import sys
import os
import http.server
import socketserver
import threading
import webbrowser
import socket
import tkinter as tk
from tkinter import messagebox

# Determine if we are running in a bundled PyInstaller exe or in dev mode
def get_resource_path():
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        return sys._MEIPASS
    except Exception:
        return os.path.abspath(".")

# Helper to dynamically resolve PC's local LAN IP address
def get_local_ip():
    try:
        # Create a temporary socket to check routing
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"

# Custom HTTP server that runs in a thread
class LocalWebServer:
    def __init__(self, directory, start_port=8000):
        self.directory = directory
        self.start_port = start_port
        self.port = start_port
        self.httpd = None
        self.thread = None

    def start(self):
        # Closure helper to pass the root directory
        directory_path = self.directory
        class Handler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=directory_path, **kwargs)
            def log_message(self, format, *args):
                # Suppress log printing in console
                pass

        # Try to find an available port
        while True:
            try:
                # Reuse address to prevent port conflicts on fast restarts
                socketserver.TCPServer.allow_reuse_address = True
                # Binds to "" (which represents INADDR_ANY / 0.0.0.0) to expose to the LAN
                self.httpd = socketserver.TCPServer(("", self.port), Handler)
                break
            except OSError:
                self.port += 1
                if self.port > 9000:
                    raise Exception("Could not find a free port between 8000 and 9000.")

        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        return self.port

    def stop(self):
        if self.httpd:
            self.httpd.shutdown()
            self.httpd.server_close()
            self.httpd = None
        if self.thread:
            self.thread.join(timeout=1.0)
            self.thread = None

class App:
    def __init__(self, root):
        self.root = root
        self.root.title("Musoki Calc Launcher")
        self.root.geometry("460x280")
        self.root.resizable(False, False)
        
        # Color Palette - Sleek Dark/Indigo Theme
        self.bg_color = "#12121A"        # Main Background
        self.card_color = "#1E1E2F"      # Inner Panel Background
        self.text_color = "#FFFFFF"      # Header Text
        self.sub_text_color = "#8E8EA8"  # Subtitles
        self.accent_green = "#2EC4B6"    # Start Color (Teal/Green)
        self.accent_red = "#FF3366"      # Stop Color (Coral/Red)
        self.status_stopped = "#FF9F1C"  # Status Stopped (Orange)
        
        self.root.configure(bg=self.bg_color)
        
        # Resolve assets path
        self.assets_path = get_resource_path()
        self.server = None
        self.port = None

        # Build GUI
        self.setup_ui()

    def setup_ui(self):
        # Header Panel
        header_frame = tk.Frame(self.root, bg=self.bg_color)
        header_frame.pack(fill=tk.X, pady=(20, 10))

        title_lbl = tk.Label(
            header_frame, 
            text="Heart Gold Migliorato", 
            font=("Segoe UI", 16, "bold"), 
            bg=self.bg_color, 
            fg=self.text_color
        )
        title_lbl.pack()

        subtitle_lbl = tk.Label(
            header_frame, 
            text="Calcolatore Danni Offline Launcher", 
            font=("Segoe UI", 10), 
            bg=self.bg_color, 
            fg=self.sub_text_color
        )
        subtitle_lbl.pack(pady=(2, 0))

        # Status Container (Card design)
        self.status_card = tk.Frame(self.root, bg=self.card_color, bd=0, highlightthickness=1, highlightbackground="#2A2A40")
        self.status_card.pack(fill=tk.X, padx=30, pady=10, ipady=8)

        self.status_title_lbl = tk.Label(
            self.status_card,
            text="STATO DEL SERVER",
            font=("Segoe UI", 8, "bold"),
            bg=self.card_color,
            fg=self.sub_text_color
        )
        self.status_title_lbl.pack()

        self.status_lbl = tk.Label(
            self.status_card, 
            text="Disattivato", 
            font=("Segoe UI", 12, "bold"), 
            bg=self.card_color, 
            fg=self.status_stopped
        )
        self.status_lbl.pack(pady=(2, 0))

        # Mobile Connection Container (Hidden by default)
        self.mobile_card = tk.Frame(self.root, bg=self.card_color, bd=0, highlightthickness=1, highlightbackground="#2A2A40")

        # Buttons Container
        self.btn_frame = tk.Frame(self.root, bg=self.bg_color)
        self.btn_frame.pack(fill=tk.X, padx=30, pady=(15, 0))

        # Custom Start Button
        self.start_btn = tk.Button(
            self.btn_frame, 
            text="START", 
            font=("Segoe UI", 11, "bold"), 
            bg=self.accent_green, 
            fg=self.bg_color, 
            activebackground="#1EAF9F",
            activeforeground=self.bg_color,
            bd=0, 
            cursor="hand2",
            padx=10, 
            pady=8,
            command=self.start_calculator
        )
        self.start_btn.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

        # Custom Stop Button
        self.stop_btn = tk.Button(
            self.btn_frame, 
            text="STOP", 
            font=("Segoe UI", 11, "bold"), 
            bg="#3E3E50", 
            fg=self.sub_text_color, 
            activebackground="#5A5A70",
            activeforeground=self.sub_text_color,
            bd=0, 
            cursor="arrow",
            padx=10, 
            pady=8,
            state=tk.DISABLED,
            command=self.stop_calculator
        )
        self.stop_btn.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(10, 0))

        # Bind hover effects
        self.start_btn.bind("<Enter>", lambda e: self.on_enter_btn(self.start_btn, "#48D1C3"))
        self.start_btn.bind("<Leave>", lambda e: self.on_leave_btn(self.start_btn, self.accent_green))

        # Intercept window close (X button)
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def on_enter_btn(self, btn, color):
        if str(btn['state']) != tk.DISABLED:
            btn.configure(bg=color)

    def on_leave_btn(self, btn, color):
        if str(btn['state']) != tk.DISABLED:
            btn.configure(bg=color)

    def start_calculator(self):
        try:
            self.status_lbl.configure(text="Avvio in corso...", fg="#FFFFFF")
            self.root.update()

            self.server = LocalWebServer(self.assets_path)
            self.port = self.server.start()
            
            # Fetch local network IP
            local_ip = get_local_ip()

            # Update GUI state
            self.status_lbl.configure(text=f"Attivo su http://localhost:{self.port}", fg="#4CAF50")
            
            # Build and pack Mobile connection details
            for widget in self.mobile_card.winfo_children():
                widget.destroy()

            mobile_title = tk.Label(
                self.mobile_card,
                text="CONNESSIONE MOBILE / TABLET / IPAD",
                font=("Segoe UI", 8, "bold"),
                bg=self.card_color,
                fg=self.sub_text_color
            )
            mobile_title.pack(pady=(4, 0))

            mobile_url = f"http://{local_ip}:{self.port}/index.html?data=hgimproved"
            mobile_link = tk.Label(
                self.mobile_card,
                text=mobile_url,
                font=("Segoe UI", 10, "bold"),
                bg=self.card_color,
                fg=self.accent_green,
                cursor="hand2"
            )
            mobile_link.pack(pady=(2, 0))
            mobile_link.bind("<Button-1>", lambda e: webbrowser.open(mobile_url))

            mobile_info = tk.Label(
                self.mobile_card,
                text="Connetti il dispositivo allo stesso Wi-Fi e digita questo link!",
                font=("Segoe UI", 8, "italic"),
                bg=self.card_color,
                fg=self.sub_text_color
            )
            mobile_info.pack(pady=(2, 4))

            # Rearrange UI layout with the expanded card
            self.mobile_card.pack(fill=tk.X, padx=30, pady=5, ipady=4)
            self.btn_frame.pack_configure(pady=(10, 0))
            
            # Expand window size dynamically to fit connection card nicely
            self.root.geometry("460x370")
            self.root.update()

            # Update buttons styling and states
            self.start_btn.configure(
                state=tk.DISABLED, 
                bg="#3E3E50", 
                fg=self.sub_text_color, 
                cursor="arrow"
            )
            self.stop_btn.configure(
                state=tk.NORMAL, 
                bg=self.accent_red, 
                fg=self.text_color, 
                cursor="hand2"
            )
            self.stop_btn.bind("<Enter>", lambda e: self.on_enter_btn(self.stop_btn, "#FF5580"))
            self.stop_btn.bind("<Leave>", lambda e: self.on_leave_btn(self.stop_btn, self.accent_red))

            # Open local web browser page on host PC
            url = f"http://localhost:{self.port}/index.html?data=hgimproved"
            webbrowser.open(url)

        except Exception as e:
            self.status_lbl.configure(text="Errore di avvio", fg=self.accent_red)
            messagebox.showerror("Errore", f"Impossibile avviare il server locale:\n{str(e)}")

    def stop_calculator(self):
        # Stop server
        if self.server:
            self.server.stop()
            self.server = None

        # Close the app immediately
        self.root.destroy()

    def on_closing(self):
        # Make sure server is stopped on window close
        if self.server:
            self.server.stop()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()
