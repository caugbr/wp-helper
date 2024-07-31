class Color {
    input = '';
    hex;
    rgb;
    alpha = 1;
    invertedHex;
    invertedRgb;
    contrastBw;
    rate;
    output = 'hex';

    constructor(color) {
        if (color) {
            this.set(color);
        }
    }
    
    set(color) {
        this.input = color;
        let hex = this.toHex(color, false);
        if (hex.length !== 6) {
            throw new Error(`Invalid color: '${color}'`);
        }
        const r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16),
            rate = (r * 0.299 + g * 0.587 + b * 0.114),
            ir = (255 - r),
            ig = (255 - g),
            ib = (255 - b),
            sir = ir.toString(16),
            sig = ig.toString(16),
            sib = ib.toString(16);
        const ret = {
            hex: `#${hex}`,
            rgb: [r, g, b],
            invertedHex: `#${this.padZero(sir)}${this.padZero(sig)}${this.padZero(sib)}`,
            invertedRgb: [ir, ig, ib],
            rate,
            contrastBw: rate > 186 ? '#000000' : '#FFFFFF'
        };
        for (const key in ret) {
            this[key] = ret[key];
        }
        return ret;
    }

    print() {
        if (this.output == 'rgb' || this.validAlpha()) {
            return this.cssRgb();
        }
        return this.hex;
    }

    darken(percent) {
        const ret = pSBC(percent * -1, this.hex);
        return this.output == 'rgb' ? this.toRgb(ret) : ret;
    }

    lighten(percent) {
        const ret = pSBC(percent, this.hex);
        return this.output == 'rgb' ? this.toRgb(ret) : ret;
    }

    blend(color, percent = 1) {
        const ret = pSBC(percent, this.hex, this.toHex(color));
        return this.output == 'rgb' ? this.toRgb(ret) : ret;
    }

    invert() {
        return this.output == 'rgb' ? this.invertedRgb : this.invertedHex;
    }

    invertBW() {
        return this.output == 'rgb' ? this.toRgb(this.contrastBw) : this.contrastBw;
    }

    toHex(color, hash = true) {
        if (color instanceof Array || /^rgb/.test(color)) {
            const [ r, g, b ] = this.rgbArr(color);
            return (hash ? "#" : "") + this.hexChannel(r) + this.hexChannel(g) + this.hexChannel(b);
        }
        return this.normalizeHex(color, hash);
    }

    toGrey() {
        const bwChannel = Math.round(this.rgb.reduce((a, val) => a + val, 0) / 3);
        return this.toHex([ bwChannel, bwChannel, bwChannel ]);
    }

    toRgb(color, arr = true) {
        if (/^#?([0-9a-f]{3}|[0-9a-f]{6})/i.test(color)) {
            const hex = this.normalizeHex(color);
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const rgb = [r, g, b];
            return arr ? rgb : `rgb(${rgb.join(', ')})`;
        }
        const cArr = rgbArr(color);
        return arr ? cArr : `rgb(${cArr.join(', ')})`;
    }

    rgbArr(str) {
        if (str instanceof Array || /^rgb/.test(str)) {
            const [ r, g, b, a ] = str instanceof Array ? str : str.match(/[0-9\.]+/g);
            this.alpha = 1;
            if (this.validAlpha(a)) {
                this.alpha = parseFloat(a);
            }
            return [ r, g, b ];
        }
        return false;
    }

    cssRgb() {
        if (this.validAlpha()) {
            return `rgba(${this.rgb.join(', ')}, ${this.alpha})`;
        }
        return `rgb(${this.rgb.join(', ')})`;
    }

    validAlpha(alpha) {
        alpha = alpha || this.alpha;
        return (alpha >= 0 && alpha < 1);
    }

    normalizeHex(color, hash = true) {
        color = color.replace('#', '').split('');
        if (color.length == 3) {
            return `#${color.map(c => c + c).join('')}`;
        }
        return `${hash ? '#' : ''}${color.join('')}`;
    }

    padZero(str, len) {
        len = len || 2;
        const zeros = new Array(len).join('0');
        return (zeros + str).slice(-len);
    }

    hexChannel(c) {
        const hex = Number(c).toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
}


// Version 4.1
const pSBC = (p, c0, c1, l) => {
    let r, g, b, P, f, t, h, m = Math.round,
        a = typeof (c1) == "string";
    if (typeof (p) != "number" || p < -1 || p > 1 || typeof (c0) != "string" || (c0[0] != 'r' && c0[0] != '#') || (c1 && !a)) return null;
    h = c0.length > 9, h = a ? c1.length > 9 ? true : c1 == "c" ? !h : false : h, f = pSBC.pSBCr(c0), P = p < 0, t = c1 && c1 != "c" ? pSBC.pSBCr(c1) : P ? { r: 0, g: 0, b: 0, a: -1
    } : { r: 255, g: 255, b: 255, a: -1 }, p = P ? p * -1 : p, P = 1 - p;
    if (!f || !t) return null;
    if (l) r = m(P * f.r + p * t.r), g = m(P * f.g + p * t.g), b = m(P * f.b + p * t.b);
    else r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5);
    a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
    if (h) return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a * 1000) / 1000 : "") + ")";
    else return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
}

pSBC.pSBCr = (d) => {
    const i = parseInt;
    let n = d.length,
        x = {};
    if (n > 9) {
        const [r, g, b, a] = (d = d.split(','));
        n = d.length;
        if (n < 3 || n > 4) return null;
        x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4)), x.g = i(g), x.b = i(b), x.a = a ? parseFloat(a) : -1
    } else {
        if (n == 8 || n == 6 || n < 4) return null;
        if (n < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
        d = i(d.slice(1), 16);
        if (n == 9 || n == 5) x.r = d >> 24 & 255, x.g = d >> 16 & 255, x.b = d >> 8 & 255, x.a = Math.round((d & 255) / 0.255) / 1000;
        else x.r = d >> 16, x.g = d >> 8 & 255, x.b = d & 255, x.a = -1;
    }
    return x;
};


function turnBW() {
    let style = $single('style#bw-style');
    if (!style) {
        style = tag('style', { id: 'bw-style' });
        document.body.appendChild(style);
    }
    style.innerHTML = '';
    bwRules = ['img { filter: gray; -webkit-filter: grayscale(1); filter: grayscale(1); }'];
    Array.from(document.styleSheets).forEach(stl => {
        Array.from(stl.cssRules).forEach(rule => {
            const re = /((text-)?(background-)?color|background):\s*(#[a-f0-9]+|rgba?[^;]+);/;
            const found = rule.cssText.match(re);
            if (found) {
                if ($single(rule.selectorText)) {
                    const col = new Color(found[4]);
                    if (col.rgb[0] != col.rgb[1] || col.rgb[1] != col.rgb[2]) {
                        const bwChannel = Math.round(col.rgb.reduce((a, val) => a + val, 0) / 3);
                        const bwCol = new Color([ bwChannel, bwChannel, bwChannel ]);
                        bwRules.push(`${rule.selectorText} { ${found[1]}: ${bwCol.print()}; }`);
                    }
                }
            }
        });
    });
    style.innerHTML = bwRules.join("\n");
}