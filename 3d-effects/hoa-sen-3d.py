import turtle
import math
import random
import time

screen = turtle.Screen()
screen.setup(720, 720)
screen.bgcolor("black")
screen.title("Hoa 3D bằng Python")
screen.colormode(255)
screen.tracer(0)

t = turtle.Turtle()
t.hideturtle()
t.penup()
random.seed(7)

def rotate_x(x, y, z, angle):
    r = math.radians(angle)
    y2 = y * math.cos(r) - z * math.sin(r)
    z2 = y * math.sin(r) + z * math.cos(r)
    return x, y2, z2

def project(x, y, z, distance=900):
    f = distance / (distance + z)
    return x * f, y * f, f

count = 0
def draw(x, y, z, size, color):
    global count
    x, y, z = rotate_x(x, y, z, TILT)
    px, py, f = project(x, y, z)
    light = min(1.0, 0.6 + 0.4 * f)
    t.goto(px, py)
    t.dot(size * f, tuple(int(c * light) for c in color))
    count += 1
    if count % 10 == 0:
        screen.update()
        time.sleep(0.006)  # để thấy hoa nở dần

def mix(a, b, k):
    return tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))

def petal(angle, length, width, lift, color):
    a = math.radians(angle)
    for v in (-1, -0.5, 0, 0.5, 1):  # viền + gân cánh
        steps = 50 if abs(v) == 1 else 25
        for k in range(steps + 1):
            u = k / steps
            d = u * length
            s = v * width * math.sin(math.pi * u) ** 0.7
            z = -lift * u * u  # đầu cánh cong lên
            x = d * math.cos(a) - s * math.sin(a)
            y = d * math.sin(a) + s * math.cos(a)
            c = mix(color, LIGHT, (1 - u) * 0.5)  # gốc sáng
            draw(x, y, z, 4 if abs(v) == 1 else 2.5, c)

TILT = 30
PINK = (255, 90, 200)
PURPLE = (150, 90, 255)
LIGHT = (255, 190, 235)

# (số cánh, dài, rộng, độ cong, xoay lệch) – từ ngoài vào trong
LAYERS = [(12, 300, 62, 40, 0), (12, 240, 55, 90, 15),
          (10, 180, 48, 120, 0), (8, 120, 38, 130, 22),
          (6, 70, 26, 110, 0)]

for n, (petals, length, width, lift, offset) in enumerate(LAYERS):
    k = n / (len(LAYERS) - 1)
    color = mix(PURPLE, PINK, k)  # ngoài tím, trong hồng
    for p in range(petals):
        petal(offset + p * 360 / petals, length, width, lift, color)

for i in range(160):  # nhụy hoa xoắn ốc
    a = math.radians(i * 137.5)
    r = 2.6 * math.sqrt(i)
    z = -40 - (33 - r)  # nhụy hơi nhô lên
    draw(r * math.cos(a), r * math.sin(a), z, 4, (255, 215, 120))

for i in range(220):  # chấm lấp lánh
    a = random.uniform(0, 2 * math.pi)
    r = random.uniform(120, 380)
    size = random.choice((2, 2.5, 3.5))
    z = random.uniform(-80, 0)
    draw(r * math.cos(a), r * math.sin(a), z, size, (255, 220, 245))

screen.update()
turtle.done()
