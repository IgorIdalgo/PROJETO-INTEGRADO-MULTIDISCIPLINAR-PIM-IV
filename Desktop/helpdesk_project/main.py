import sys
import os

# Função para obter o caminho base correto (seja dev ou exe)
def get_base_path():
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

# Adiciona o caminho base ao sys.path
base_path = get_base_path()
if base_path not in sys.path:
    sys.path.append(base_path)

# Tenta importar o app
try:
    from desktop_interface.login import app
except ImportError as e:
    # Se falhar, abre uma janela de erro nativa do Windows
    import tkinter as tk
    from tkinter import messagebox
    
    root = tk.Tk()
    root.withdraw() # Esconde a janela principal do Tk vazia
    messagebox.showerror("Erro Fatal", f"Falha ao iniciar o sistema.\n\nErro: {e}\n\nDica: Verifique se 'requests' foi incluído no executável.")
    sys.exit(1)

if __name__ == "__main__":
    app.mainloop()