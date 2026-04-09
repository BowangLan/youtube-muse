import math
import struct
import zlib
from pathlib import Path


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(lerp(a, b, t) for a, b in zip(c1, c2))


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def make_canvas(size, color=(0.0, 0.0, 0.0, 0.0)):
    r, g, b, a = color
    return [[[r, g, b, a] for _ in range(size)] for _ in range(size)]


def blend_pixel(dst, x, y, src):
    if not (0 <= x < len(dst) and 0 <= y < len(dst)):
        return
    sr, sg, sb, sa = src
    dr, dg, db, da = dst[y][x]
    out_a = sa + da * (1 - sa)
    if out_a == 0:
        dst[y][x] = [0.0, 0.0, 0.0, 0.0]
        return
    out_r = (sr * sa + dr * da * (1 - sa)) / out_a
    out_g = (sg * sa + dg * da * (1 - sa)) / out_a
    out_b = (sb * sa + db * da * (1 - sa)) / out_a
    dst[y][x] = [out_r, out_g, out_b, out_a]


def draw_circle(dst, cx, cy, radius, color, softness=1.5):
    x0 = int(cx - radius - softness - 1)
    x1 = int(cx + radius + softness + 1)
    y0 = int(cy - radius - softness - 1)
    y1 = int(cy + radius + softness + 1)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            dx = x + 0.5 - cx
            dy = y + 0.5 - cy
            dist = math.hypot(dx, dy)
            edge = dist - radius
            coverage = clamp(1 - edge / max(softness, 1e-6)) if edge > 0 else 1.0
            if coverage <= 0:
                continue
            sr, sg, sb, sa = color
            blend_pixel(dst, x, y, (sr, sg, sb, sa * coverage))


def draw_rect(dst, x0, y0, x1, y1, color, softness=1.5):
    for y in range(int(y0 - softness), int(y1 + softness) + 1):
        for x in range(int(x0 - softness), int(x1 + softness) + 1):
            dx = max(x0 - (x + 0.5), 0, (x + 0.5) - x1)
            dy = max(y0 - (y + 0.5), 0, (y + 0.5) - y1)
            dist = math.hypot(dx, dy)
            coverage = clamp(1 - dist / max(softness, 1e-6)) if dist > 0 else 1.0
            if coverage <= 0:
                continue
            sr, sg, sb, sa = color
            blend_pixel(dst, x, y, (sr, sg, sb, sa * coverage))


def paint_background(canvas):
    size = len(canvas)
    c1 = (0.118, 0.227, 0.541)  # #1e3a8a
    c2 = (0.059, 0.09, 0.165)  # #0f172a
    c3 = (0.231, 0.51, 0.965)  # #3b82f6
    for y in range(size):
        v = y / (size - 1)
        for x in range(size):
            u = x / (size - 1)
            base = mix(c1, c2, (u * 0.55 + v * 0.45))
            swirl = mix(base, c3, pow((u * 0.4 + (1 - v) * 0.6), 1.2))
            hx = x - size * 0.3
            hy = y - size * 0.22
            highlight = clamp(1 - math.hypot(hx, hy) / (size * 0.9))
            color = mix(swirl, (1.0, 1.0, 1.0), 0.18 * pow(highlight, 1.6))
            edge = math.hypot(x - size / 2, y - size / 2) / (size * 0.72)
            color = mix(color, (0.05, 0.05, 0.08), clamp(edge * 0.12))
            canvas[y][x] = [*color, 1.0]


def paint_note(canvas):
    size = len(canvas)
    shadow = (0.02, 0.05, 0.08, 0.32)
    white = (0.95, 0.98, 1.0, 0.92)

    stem_w = size * 0.12
    stem_h = size * 0.46
    stem_x0 = size * 0.58
    stem_y0 = size * 0.24
    stem_x1 = stem_x0 + stem_w
    stem_y1 = stem_y0 + stem_h

    beam_x0 = size * 0.4
    beam_x1 = stem_x1
    beam_y0 = stem_y0
    beam_y1 = beam_y0 + size * 0.1

    head1_r = size * 0.12
    head1_cx = size * 0.38
    head1_cy = stem_y1 - head1_r * 0.3

    head2_r = size * 0.11
    head2_cx = stem_x0 + stem_w * 0.45
    head2_cy = stem_y1 - head2_r * 0.1

    offset = size * 0.02

    draw_rect(canvas, stem_x0 + offset, stem_y0 + offset, stem_x1 + offset, stem_y1 + offset, shadow)
    draw_rect(canvas, beam_x0 + offset, beam_y0 + offset, beam_x1 + offset, beam_y1 + offset, shadow)
    draw_circle(canvas, head1_cx + offset, head1_cy + offset, head1_r, shadow)
    draw_circle(canvas, head2_cx + offset, head2_cy + offset, head2_r, shadow)

    draw_rect(canvas, stem_x0, stem_y0, stem_x1, stem_y1, white)
    draw_rect(canvas, beam_x0, beam_y0, beam_x1, beam_y1, white)
    draw_circle(canvas, head1_cx, head1_cy, head1_r, white)
    draw_circle(canvas, head2_cx, head2_cy, head2_r, white)


def write_png(path, canvas):
    size = len(canvas)

    def chunk(tag, data):
        return struct.pack(
            ">I", len(data)
        ) + tag + data + struct.pack(
            ">I", zlib.crc32(tag + data) & 0xFFFFFFFF
        )

    raw_rows = []
    for row in canvas:
        packed = bytearray()
        for r, g, b, a in row:
            packed.extend(
                [
                    int(clamp(r) * 255 + 0.5),
                    int(clamp(g) * 255 + 0.5),
                    int(clamp(b) * 255 + 0.5),
                    int(clamp(a) * 255 + 0.5),
                ]
            )
        raw_rows.append(b"\x00" + bytes(packed))
    raw_data = b"".join(raw_rows)

    ihdr = struct.pack(
        ">IIBBBBB", size, size, 8, 6, 0, 0, 0
    )
    compressed = zlib.compress(raw_data, 9)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", compressed))
        f.write(chunk(b"IEND", b""))


def build_icon(size):
    canvas = make_canvas(size)
    paint_background(canvas)
    paint_note(canvas)
    return canvas


def write_ico(path, png_blobs):
    entries = []
    offset = 6 + 16 * len(png_blobs)
    for png in png_blobs:
        size = int.from_bytes(png[16:20], "big")
        width_byte = 0 if size == 256 else size
        entry = struct.pack(
            "BBBBHHII",
            width_byte,
            width_byte,
            0,
            0,
            1,
            32,
            len(png),
            offset,
        )
        entries.append(entry)
        offset += len(png)

    with open(path, "wb") as f:
        f.write(struct.pack("HHH", 0, 1, len(png_blobs)))
        for entry in entries:
            f.write(entry)
        for png in png_blobs:
            f.write(png)


def main():
    out_dir = Path("public")
    out_dir.mkdir(parents=True, exist_ok=True)

    sizes = [512, 192, 64, 32, 16]
    png_datas = []
    for size in sizes:
        canvas = build_icon(size)
        png_path = out_dir / f"icon-{size}.png"
        write_png(png_path, canvas)
        png_datas.append(png_path.read_bytes())

    (out_dir / "apple-touch-icon.png").write_bytes((out_dir / "icon-192.png").read_bytes())
    (out_dir / "favicon.png").write_bytes((out_dir / "icon-32.png").read_bytes())

    ico_pngs = [
        (out_dir / "icon-64.png").read_bytes(),
        (out_dir / "icon-32.png").read_bytes(),
        (out_dir / "icon-16.png").read_bytes(),
    ]
    write_ico(out_dir / "favicon.ico", ico_pngs)


if __name__ == "__main__":
    main()
