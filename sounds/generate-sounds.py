"""
Generates the placeholder sound set for farming-p5.

Everything here is synthesized from scratch - no samples, no downloads. The SFX are
short synth gestures; the ambient beds are layered pads + shaped noise + sparse
"events" (chirps, clucks, droplets, creaks).

Two tricks keep the ambient loops seamless:
  * every sustained tone is quantized to an exact whole number of cycles per loop,
    so it wraps with no discontinuity
  * the noise layers get a short head/tail crossfade
"""
import numpy as np, wave, os, sys

SR = 22050
OUT = sys.argv[1] if len(sys.argv) > 1 else 'sounds'
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def write(name, sig, peak=0.85):
    sig = np.asarray(sig, dtype=np.float64)
    m = np.max(np.abs(sig))
    if m > 0:
        sig = sig / m * peak
    # gentle soft-clip, then 16-bit
    sig = np.tanh(sig * 1.2) / np.tanh(1.2)
    data = (sig * 32767).astype('<i2')
    path = os.path.join(OUT, name)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f'{path:34s} {len(sig)/SR:5.2f}s  {os.path.getsize(path)/1024:7.1f} KB')


def t(dur):
    return np.arange(int(SR * dur)) / SR


def env_ad(n, attack, decay, curve=2.5):
    """attack-decay envelope, lengths in seconds"""
    a = max(1, int(SR * attack))
    d = max(1, n - a)
    return np.concatenate([np.linspace(0, 1, a) ** 0.6,
                           np.linspace(1, 0, d) ** curve])[:n]


def tone(freq, dur, kind='sine', detune=0.0):
    x = t(dur)
    f = freq * (1 + detune)
    if kind == 'sine':
        return np.sin(2 * np.pi * f * x)
    if kind == 'tri':
        return 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * x))
    if kind == 'saw':
        return 2 * (f * x - np.floor(0.5 + f * x))
    raise ValueError(kind)


def sweep(f0, f1, dur, kind='exp'):
    x = t(dur)
    if kind == 'exp':
        f = f0 * (f1 / f0) ** (x / dur)
    else:
        f = np.linspace(f0, f1, len(x))
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase)


def lowpass(sig, cutoff):
    """one-pole lowpass - crude but enough to take the fizz off noise"""
    a = np.exp(-2 * np.pi * cutoff / SR)
    out = np.empty_like(sig)
    acc = 0.0
    for i, s in enumerate(sig):
        acc = a * acc + (1 - a) * s
        out[i] = acc
    return out


def highpass(sig, cutoff):
    return sig - lowpass(sig, cutoff)


def noise(dur):
    return rng.normal(0, 1, int(SR * dur))


# ---------------------------------------------------------------- SFX --------

def add(out, seg, at_sec, gain=1.0):
    """add a segment at a time offset, clipped to the buffer"""
    st = int(SR * at_sec)
    if st >= len(out):
        return out
    k = min(len(seg), len(out) - st)
    out[st:st + k] += seg[:k] * gain
    return out


def sfx_collect():
    """bright two-note pluck - egg / milk / bacon pickup"""
    d = 0.16
    n = int(SR * d)
    out = np.zeros(int(SR * 0.28))
    add(out, tone(880, d, 'tri') * env_ad(n, 0.002, d, 3.0), 0.0)
    add(out, tone(1320, d, 'tri') * env_ad(n, 0.002, d, 3.5), 0.07, 0.7)
    # tiny transient so it reads as a "pick up" not a beep
    out[:400] += noise(400 / SR)[:400] * np.linspace(1, 0, 400) ** 3 * 0.4
    return out


def sfx_harvest():
    """leafy rustle + a small rising three-note figure"""
    d = 0.42
    n = int(SR * d)
    rustle = lowpass(noise(d), 2600) * env_ad(n, 0.01, d, 1.8) * 0.55
    rustle *= (1 + 0.5 * np.sin(2 * np.pi * 18 * t(d)))  # texture
    out = rustle
    for i, f in enumerate((660, 880, 1100)):
        ln = int(SR * 0.20)
        seg = tone(f, 0.20, 'tri') * env_ad(ln, 0.003, 0.20, 3.0)
        add(out, seg, 0.04 + i * 0.055, 0.5 - i * 0.08)
    return out


def sfx_plant():
    """soft low thud + a scatter of soil"""
    d = 0.30
    n = int(SR * d)
    thud = sweep(190, 95, d) * env_ad(n, 0.002, d, 4.0) * 0.9
    soil = lowpass(noise(d), 1400) * env_ad(n, 0.004, d, 5.0) * 0.5
    pat = tone(520, d, 'sine') * env_ad(n, 0.001, 0.09, 4.0) * 0.18
    return thud + soil + pat


def sfx_trade():
    """bell arpeggio - a trade completing"""
    d = 0.85
    out = np.zeros(int(SR * d))
    for i, f in enumerate((523.25, 659.25, 783.99, 1046.50)):
        ln = int(SR * 0.55)
        # bell = fundamental + inharmonic partials
        seg = (tone(f, 0.55, 'sine')
               + 0.45 * tone(f * 2.01, 0.55, 'sine')
               + 0.22 * tone(f * 3.03, 0.55, 'sine'))
        seg *= env_ad(ln, 0.002, 0.55, 3.2)
        add(out, seg, i * 0.075, 0.75 - i * 0.1)
    click = noise(0.02) * np.linspace(1, 0, int(SR * 0.02)) ** 2 * 0.35
    out[:len(click)] += click
    return out


def sfx_whoosh(up=True):
    """doorway whoosh for entering / leaving a hub zone"""
    d = 0.45
    n = int(SR * d)
    f0, f1 = (280, 900) if up else (900, 280)
    body = sweep(f0, f1, d) * 0.35
    air = lowpass(noise(d), 3000) if up else lowpass(noise(d), 3000)
    # sweep the noise brightness with the pitch
    bright = np.linspace(0.2, 1.0, n) if up else np.linspace(1.0, 0.2, n)
    air = air * bright * 0.8
    env = np.sin(np.linspace(0, np.pi, n)) ** 1.4
    return (body + air) * env


# ------------------------------------------------------------ AMBIENT --------
LOOP = 10.0  # seconds


def q(freq, dur=LOOP):
    """quantize a frequency to a whole number of cycles per loop, so it wraps clean"""
    return max(1, round(freq * dur)) / dur


def pad(freqs, dur=LOOP, amp=0.25, drift=0.06):
    """sustained chord, loop-safe: every partial and every LFO completes whole cycles"""
    x = t(dur)
    out = np.zeros(len(x))
    for i, f in enumerate(freqs):
        fq = q(f, dur)
        lfo_rate = q(0.11 + 0.037 * i, dur)  # slow shimmer, also loop-safe
        lfo = 1 + drift * np.sin(2 * np.pi * lfo_rate * x)
        out += np.sin(2 * np.pi * fq * x) * lfo * (amp / (i + 1.4))
    return out


def bed_noise(dur, cutoff, amp, rate_hz=0.09, depth=0.45, xfade=0.6):
    """shaped noise with a slow swell, head/tail crossfaded so the loop is seamless"""
    n = int(SR * dur)
    x = t(dur)
    sig = lowpass(noise(dur + xfade), cutoff)
    swell = 1 + depth * np.sin(2 * np.pi * q(rate_hz, dur) * x)
    body = sig[:n] * swell * amp
    tail = sig[n:n + int(SR * xfade)] * amp
    k = len(tail)
    if k:
        ramp = np.linspace(0, 1, k)
        body[:k] = body[:k] * ramp + tail * (1 - ramp)
    return body


def place(out, seg, at_sec, gain=1.0):
    """drop a short event into the loop (skipping anything that would cross the seam)"""
    st = int(SR * at_sec)
    if st + len(seg) > len(out):
        return
    out[st:st + len(seg)] += seg * gain


def chirp(f0, f1, dur=0.09):
    n = int(SR * dur)
    return sweep(f0, f1, dur) * env_ad(n, 0.004, dur, 2.0)


def amb_field():
    """open farm: wind, a warm pad, occasional birds"""
    out = bed_noise(LOOP, 900, 0.30, rate_hz=0.07, depth=0.5)
    out += bed_noise(LOOP, 240, 0.22, rate_hz=0.043, depth=0.6)
    out += pad([196, 294, 392, 587], amp=0.16)
    birds = [(0.9, 2400, 3100), (2.4, 2900, 2300), (2.55, 3100, 2600),
             (4.6, 2200, 3000), (6.3, 3000, 2400), (6.45, 2600, 3200),
             (8.2, 2500, 2900)]
    for at, a, b in birds:
        place(out, chirp(a, b), at, 0.13)
    return out


def amb_coop():
    """animal pen: darker bed, straw rustle, soft clucks"""
    out = bed_noise(LOOP, 500, 0.30, rate_hz=0.06, depth=0.55)
    out += bed_noise(LOOP, 1800, 0.10, rate_hz=0.13, depth=0.7)  # straw
    out += pad([147, 220, 294], amp=0.14)
    for at in (0.7, 1.05, 3.2, 3.45, 5.1, 7.4, 7.7, 8.6):
        n = int(SR * 0.11)
        f = 420 + rng.integers(-60, 60)
        cluck = tone(f, 0.11, 'saw') * env_ad(n, 0.006, 0.11, 2.2)
        cluck *= (1 + 0.6 * np.sin(2 * np.pi * 26 * t(0.11)))  # warble
        place(out, lowpass(cluck, 1800), at, 0.16)
    return out


def amb_water():
    """pond: lapping water, droplets, low pad"""
    out = bed_noise(LOOP, 1500, 0.26, rate_hz=0.16, depth=0.75)
    out += bed_noise(LOOP, 350, 0.24, rate_hz=0.055, depth=0.5)
    out += pad([131, 196, 262, 392], amp=0.15)
    for at in (1.3, 3.05, 4.8, 6.1, 8.4):
        n = int(SR * 0.12)
        drop = sweep(1500, 480, 0.12) * env_ad(n, 0.002, 0.12, 3.5)
        place(out, drop, at, 0.13)
    return out


def amb_indoor():
    """barn / market interior: low hum, distant murmur, wood creaks"""
    out = bed_noise(LOOP, 300, 0.30, rate_hz=0.05, depth=0.4)
    out += bed_noise(LOOP, 700, 0.14, rate_hz=0.11, depth=0.6)  # murmur
    out += pad([110, 165, 220, 330], amp=0.20, drift=0.09)
    for at, f0, f1 in ((1.8, 210, 180), (5.4, 160, 140), (8.1, 240, 205)):
        n = int(SR * 0.55)
        creak = sweep(f0, f1, 0.55) * env_ad(n, 0.12, 0.55, 1.6)
        creak *= (1 + 0.3 * np.sin(2 * np.pi * 7 * t(0.55)))
        place(out, creak, at, 0.09)
    return out


def sfx_water():
    """watering can: a short pour plus a couple of droplets"""
    d = 0.55
    n = int(SR * d)
    # the pour - bandpassed noise that opens up then tails off
    pour = highpass(lowpass(noise(d), 2800), 350)
    env = np.concatenate([np.linspace(0, 1, int(SR * 0.06)) ** 0.5,
                          np.linspace(1, 0, n - int(SR * 0.06)) ** 1.6])[:n]
    pour *= env * 0.7
    pour *= (1 + 0.35 * np.sin(2 * np.pi * 11 * t(d)))  # splashiness
    out = pour
    # droplets landing
    for at, f0 in ((0.10, 1500), (0.26, 1150), (0.40, 1750)):
        ln = int(SR * 0.10)
        drop = sweep(f0, f0 * 0.32, 0.10) * env_ad(ln, 0.002, 0.10, 3.2)
        add(out, drop, at, 0.30)
    return out


def sfx_wither():
    """dry, brittle rustle - clearing a dead plant"""
    d = 0.35
    n = int(SR * d)
    crackle = highpass(noise(d), 1200) * env_ad(n, 0.004, d, 2.6) * 0.6
    crackle *= (1 + 0.8 * np.sin(2 * np.pi * 31 * t(d)))
    body = sweep(240, 120, d) * env_ad(n, 0.003, d, 4.0) * 0.35
    return crackle + body


print('SFX')
write('sfx-collect.wav', sfx_collect())
write('sfx-harvest.wav', sfx_harvest())
write('sfx-plant.wav', sfx_plant())
write('sfx-trade.wav', sfx_trade())
write('sfx-enter.wav', sfx_whoosh(True))
write('sfx-exit.wav', sfx_whoosh(False))
write('sfx-water.wav', sfx_water())
write('sfx-wither.wav', sfx_wither())

print('\nambient loops')
write('amb-field.wav', amb_field(), peak=0.55)
write('amb-coop.wav', amb_coop(), peak=0.55)
write('amb-water.wav', amb_water(), peak=0.55)
write('amb-indoor.wav', amb_indoor(), peak=0.55)
