
class Style {

    element;

    constructor(elem) {
        if(elem) {
            this.element = $single(elem);
        }
    }
    
    computed(prop = '', elem = this.element) {
        elem = typeof elem == 'string' ? $single(elem) : elem;
        const styles = window.getComputedStyle(elem);
        if (prop) {
            return styles[prop] ?? undefined;
        }
        return styles;
    }
    
    modifySize(size, percentage = 0, precision = 4) {
        percentage = parseInt(percentage);
        const value = Number(size.replace(/[^0-9-]+/g, ''));
        const unit = size.trim().replace(/[0-9]+/g, '');
        const nVal = (value / 100) * percentage;
        const nv = (nVal + value).toFixed(precision);
        return nv + unit;
    }
    
    increaseFonts(percentage, selector = '*', wrapper = this.element) {
        wrapper = $single(wrapper);
        const elems = $list(selector, wrapper);
        Array.from(elems).forEach(el => {
            const fs = this.computed('fontSize', el);
            if (fs) {
                let oriFs = el.getAttribute('data-font-size');
                if (!oriFs) {
                    el.setAttribute('data-font-size', fs);
                    oriFs = fs;
                }
                const nfs = this.modifySize(oriFs, percentage);
                el.style.fontSize = nfs;
            }
        });
    }

    getStyleNodes(type = 'both') {
        let elems = [];
        Array.from(document.styleSheets).forEach(stl => {
            if (type == 'both' || stl.ownerNode.tagName.toLowerCase() == type) {
                elems.push(stl.ownerNode);
            }
        });
        return elems;
    }

    getStyles(type = 'both') {
        let rules = [];
        Array.from(document.styleSheets).forEach(stl => {
            const { disabled, href, title, ownerNode } = stl;
            let info =  { disabled, href, title, ownerNode, rules: [] };
            info.type = stl.ownerNode.tagName.toLowerCase();
            if (type != 'both' && type != info.type) {
                return true;
            }
            const extract = rul => {
                let rls = {};
                for (const n in rul.style) {
                    if (/^[0-9]+$/.test(n)) {
                        const prop = rul.style[n];
                        if (prop) {
                            rls[prop] = rul.style[prop];
                        }
                    }
                }
                return rls;
            };
            Array.from(stl.cssRules).forEach(rule => {
                const rl = {
                    selector: rule.selectorText,
                    cssText: rule.cssText,
                    rules: extract(rule)
                };
                if (rule.selectorText) {
                    info.rules.push(rl);
                }
            });
            if (info.rules.length) {
                rules.push(info);
            }
        });
        return rules;
    }

    jsProp(propName) {
        return propName.replace(/\-[a-z]/g, s => s.replace('-', '').toUpperCase());
    }

    cssProp(propName) {
        return propName.replace(/([a-z])([A-Z])/g, (s, s1, s2) => s1 + '-' + s2.toLowerCase());
    }
    
    createStyle(rulesStr = '', props = {}) {
        const style = tag('style');
        document.body.appendChild(style, props, rulesStr);
        style.innerHTML = rulesStr;
        return style;
    }
    
    createLink(href, props = {}) {
        props = { rel: 'stylesheet', href, ...props };
        const style = tag('link', props);
        document.body.appendChild(style);
        return style;
    }
}

// function turnBW() {
//     let style = $single('style#bw-style');
//     if (!style) {
//         style = tag('style', { id: 'bw-style' });
//         document.body.appendChild(style);
//     }
//     style.innerHTML = '';
//     let bwRules = ['img { filter: gray; -webkit-filter: grayscale(1); filter: grayscale(1); }'];
//     const styles = (new Style()).getStyles();
//     styles.forEach(stl => {
//         Array.from(stl.rules).forEach(rule => {
//             const re = /((text-)?(background-)?color|background):\s*(#[a-f0-9]+|rgba?[^;]+);/;
//             const found = rule.cssText.match(re);
//             if (found) {
//                 if ($single(rule.selector)) {
//                     const col = new Color(found[4]);
//                     if (col.rgb[0] != col.rgb[1] || col.rgb[1] != col.rgb[2]) {
//                         bwRules.push(`${rule.selector} { ${found[1]}: ${col.toGrey()}; }`);
//                     }
//                 }
//             }
//         });
//     });
//     style.innerHTML = bwRules.join("\n");
// }
