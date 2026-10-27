#!/usr/bin/env python3
"""Arma «Cómo funciona Eureka» (~1:30) a partir de las tomas grabadas con
e2e/demo/video-como-funciona.spec.ts. Cada toma deja un marcas.json con el segundo en que empieza
cada momento; aquí se corta por esas marcas, se pone cada corte sobre un fondo de marca con su
título y se une todo en un solo MP4 (1920×1080, H.264) en el Escritorio › Eureka-video.

    python3 specs/019-video-colegios/montar.py

Necesita Pillow y ffmpeg-static (lo instala exportar.sh en ~/.cache/eureka-ffmpeg).
"""
import glob
import json
import os
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.expanduser("~/Desktop/Eureka-video")
OUT = os.path.join(OUT_DIR, "eureka-como-funciona.mp4")
FF = os.path.expanduser("~/.cache/eureka-ffmpeg/node_modules/ffmpeg-static/ffmpeg")
BRAND = os.path.join(ROOT, "client/public/brand")
W, H, FPS = 1920, 1080, 30

CREAM = (251, 248, 241)
NAVY = (19, 74, 99)
TEAL = (43, 166, 164)
CORAL = (240, 128, 104)
INK = (55, 65, 81)
TITLE_FONT = "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf"
TEXT_FONT = "/System/Library/Fonts/HelveticaNeue.ttc"

# Cortes: (toma, marca de inicio, desfase, duración en la toma, velocidad, quién, título, texto)
# «hasta:marca» como duración corta hasta esa marca.
CUTS = [
    ("nino", "intereses", 0.0, 4.8, 1.0, "EL NIÑO", "Elige sus intereses",
     "Los problemas usan lo que le gusta: animales, música, el espacio…"),
    ("nino", "oferta_pausa", 0.0, 9.0, 1.0, "EL NIÑO", "Pausa de respiración",
     "Antes de empezar, un momento para calmarse y concentrarse."),
    ("nino", "p_error", 0.0, "hasta:p_error_fin", 1.0, "EL NIÑO", "Pregunta, respuesta y retroalimentación",
     "Si se equivoca, ve qué pasó y cómo se resuelve paso a paso."),
    ("nino", "p_bien_completa", -0.5, "hasta:p_bien_fin", 1.15, "EL NIÑO", "Aprende con lo que le gusta",
     "Los problemas hablan de sus intereses. Y cuando acierta, se celebra."),
    ("nino", "oferta_movimiento", 0.0, 8.5, 1.0, "EL NIÑO", "Pausa de movimiento",
     "Durante la práctica se mueve con un desafío matemático."),
    ("nino", "terminada", 0.0, 4.5, 1.0, "EL NIÑO", "Cierra contando cómo le fue",
     "Qué sintió y qué le costó: información para acompañarlo."),
    ("familia", "pin", -0.3, 11.5, 1.1, "LA FAMILIA", "Espacio familia, con PIN",
     "Su aprendizaje, cómo se siente y señales tempranas para conversar."),
    ("profesora", "curso", 0.0, 9.5, 1.2, "LA PROFESORA", "Panel docente",
     "Nivel de logro por OA y estudiante, y qué hacer esta semana."),
    ("profesora", "ficha", -0.5, 5.5, 1.1, "LA PROFESORA", "Ficha de cada estudiante",
     "Participación, errores frecuentes y notas privadas."),
    ("directivo", "panel", 0.0, 12.0, 1.3, "EL EQUIPO DIRECTIVO", "Panel directivo",
     "Logro por eje y curso, cursos paralelos y bienestar. Todo agregado, sin rankings."),
]
TAKES = {
    "nino": "oma-1-*-celular-hd",
    "familia": "oma-2-*-celular-hd",
    "profesora": "oma-3-*-computador",
    "directivo": "oma-4-*-computador",
}
PHONE = {"nino", "familia"}


def font(path, size):
    return ImageFont.truetype(path, size)


def wrap(draw, text, fnt, width):
    lines, line = [], ""
    for word in text.split():
        test = f"{line} {word}".strip()
        if draw.textlength(test, font=fnt) <= width:
            line = test
        else:
            lines.append(line)
            line = word
    return lines + [line]


def background():
    """Fondo crema con manchas suaves como la ilustración de la marca."""
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    d.ellipse((-260, -320, 520, 300), fill=(214, 238, 236))
    d.ellipse((1500, 760, 2300, 1400), fill=(214, 238, 236))
    d.ellipse((-300, 820, 420, 1400), fill=(250, 226, 216))
    return im


def logo(size_w):
    lg = Image.open(os.path.join(BRAND, "eureka-logo.png")).convert("RGBA")
    return lg.resize((size_w, round(lg.height * size_w / lg.width)), Image.LANCZOS)


def phone_card(who, title, text, step, total):
    im = background()
    d = ImageDraw.Draw(im)
    # Marco del celular (el video va encima, en PHONE_BOX).
    x, y, w, h = PHONE_BOX
    d.rounded_rectangle((x - 16, y - 16, x + w + 16, y + h + 16), radius=48, fill=NAVY)
    tx, tw = 900, 900
    d.text((tx, 300), who, font=font(TITLE_FONT, 34), fill=TEAL)
    ty = 360
    for line in wrap(d, title, font(TITLE_FONT, 76), tw):
        d.text((tx, ty), line, font=font(TITLE_FONT, 76), fill=NAVY)
        ty += 92
    ty += 24
    for line in wrap(d, text, font(TEXT_FONT, 42), tw):
        d.text((tx, ty), line, font=font(TEXT_FONT, 42), fill=INK)
        ty += 56
    dots(d, tx, 960, step, total)
    lg = logo(220)
    im.paste(lg, (W - lg.width - 60, 50), lg)
    return im


def desk_card(who, title, text, step, total):
    im = background()
    d = ImageDraw.Draw(im)
    x, y, w, h = DESK_BOX
    d.rounded_rectangle((x - 8, y - 8, x + w + 8, y + h + 8), radius=20, fill=NAVY)
    d.text((60, 22), who, font=font(TITLE_FONT, 26), fill=TEAL)
    d.text((60, 54), title, font=font(TITLE_FONT, 50), fill=NAVY)
    tw = d.textlength(title, font=font(TITLE_FONT, 50))
    d.text((60 + tw + 36, 70), text, font=font(TEXT_FONT, 30), fill=INK)
    lg = logo(150)
    im.paste(lg, (W - lg.width - 40, 14), lg)
    return im


def dots(d, x, y, step, total):
    for i in range(total):
        fill = CORAL if i == step else (220, 214, 202)
        d.ellipse((x + i * 34, y, x + i * 34 + 18, y + 18), fill=fill)


def title_card():
    im = background()
    hero = Image.open(os.path.join(BRAND, "eureka-hero.jpg")).convert("RGB")
    hero = hero.resize((1600, 600), Image.LANCZOS)
    im.paste(hero, (160, 150))
    d = ImageDraw.Draw(im)
    for text, fnt, y, color in [
        ("Cómo funciona", font(TITLE_FONT, 64), 800, NAVY),
        ("Práctica diaria de matemáticas · 1° a 6° básico", font(TEXT_FONT, 42), 890, INK),
    ]:
        d.text(((W - d.textlength(text, font=fnt)) / 2, y), text, font=fnt, fill=color)
    return im


def end_card():
    im = background()
    d = ImageDraw.Draw(im)
    lg = logo(640)
    im.paste(lg, ((W - lg.width) // 2, 150), lg)
    y = 150 + lg.height + 60
    for text, fnt, color in [
        ("Cada niño practica a su ritmo,", font(TITLE_FONT, 52), NAVY),
        ("la profesora sabe qué reforzar y la familia acompaña.", font(TITLE_FONT, 52), NAVY),
    ]:
        d.text(((W - d.textlength(text, font=fnt)) / 2, y), text, font=fnt, fill=color)
        y += 72
    return im


PHONE_BOX = (330, 56, 446, 966)  # 780×1688 escalado a alto 966
DESK_BOX = (184, 138, 1552, 932)  # 1366×820 escalado


def take_dir(name):
    found = glob.glob(os.path.join(ROOT, "e2e/test-results", f"*{TAKES[name]}"))
    if not found:
        raise SystemExit(f"No encontré la toma «{name}». Graba antes con video-como-funciona.spec.ts.")
    return found[0]


def with_answer_marks(marks):
    """Agrega p_error* y p_bien*: la primera pregunta respondida con error y la primera correcta."""
    for kind in ("error", "bien"):
        n = next((k[1:-len(kind) - 1] for k in marks if k.startswith("p") and k.endswith(f"_{kind}")), None)
        if n:
            for suffix in ("", "_completa", "_fin"):
                marks[f"p_{kind}{suffix}"] = marks[f"p{n}{suffix}"]
    return marks


def run(args):
    subprocess.run([FF, "-y", "-loglevel", "error", *args], check=True)


def still(png, seconds, out):
    run(["-loop", "1", "-t", str(seconds), "-i", png,
         "-vf", f"fps={FPS},format=yuv420p,fade=in:st=0:d=0.4:color=0xFBF8F1,fade=out:st={seconds - 0.4}:d=0.4:color=0xFBF8F1",
         "-r", str(FPS), "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "18", out])


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="eureka-montaje-")
    parts = []

    title_card().save(f"{tmp}/titulo.png")
    still(f"{tmp}/titulo.png", 3.5, f"{tmp}/00.mp4")
    parts.append(f"{tmp}/00.mp4")

    total = 0.0
    for i, (take, mark, off, dur, speed, who, title, text) in enumerate(CUTS, start=1):
        folder = take_dir(take)
        marks = with_answer_marks(json.load(open(os.path.join(folder, "marcas.json"))))
        start = marks[mark] + off
        if isinstance(dur, str):
            dur = marks[dur.split(":", 1)[1]] - start
        out_len = dur / speed
        print(f"{3.5 + total:5.1f}s  {title} ({out_len:.1f}s)")
        total += out_len
        phone = take in PHONE
        card = (phone_card if phone else desk_card)(who, title, text, i - 1, len(CUTS))
        card.save(f"{tmp}/{i:02d}.png")
        x, y, w, h = PHONE_BOX if phone else DESK_BOX
        fade = f"fade=in:st=0:d=0.3:color=0xFBF8F1,fade=out:st={out_len - 0.3:.2f}:d=0.3:color=0xFBF8F1"
        run(["-loop", "1", "-i", f"{tmp}/{i:02d}.png",
             "-ss", f"{start:.2f}", "-t", f"{dur:.2f}", "-i", os.path.join(folder, "video.webm"),
             "-filter_complex",
             f"[1:v]setpts=(PTS-STARTPTS)/{speed},fps={FPS},scale={w}:{h}:flags=lanczos[v];"
             f"[0:v][v]overlay={x}:{y}:shortest=1,format=yuv420p,{fade}",
             "-t", f"{out_len:.2f}", "-r", str(FPS), "-pix_fmt", "yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "18", f"{tmp}/{i:02d}.mp4"])
        parts.append(f"{tmp}/{i:02d}.mp4")

    end_card().save(f"{tmp}/fin.png")
    still(f"{tmp}/fin.png", 4.5, f"{tmp}/99.mp4")
    parts.append(f"{tmp}/99.mp4")

    with open(f"{tmp}/lista.txt", "w") as f:
        f.writelines(f"file '{p}'\n" for p in parts)
    run(["-f", "concat", "-safe", "0", "-i", f"{tmp}/lista.txt", "-c", "copy", "-movflags", "+faststart", OUT])
    print(f"Listo: {OUT} (~{total + 8:.0f} s)")


if __name__ == "__main__":
    main()
