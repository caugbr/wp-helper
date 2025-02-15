// Behaviors

function addEscBehavior(callback) {
    window.escBehaviors = window.escBehaviors ?? [];
    window.escBehaviors.push(callback);
    if (!window.escBehaviorsSet) {
        document.body.addEventListener('keydown', event => {
            if (event.key == 'Escape') {
                window.escBehaviors.forEach(fn => fn());
            }
        });
        window.escBehaviorsSet = true;
    }
}

function rootEvent(selector, eventName, callback) {
    document.body.addEventListener(eventName, event => {
        if (event.target.matches(`${selector}, ${selector} *`)) {
            const elem = event.target.closest(selector);
            callback.call(elem, event);
        }
    })
}

// DOM

function tag(tagName = 'div', attrs = {}, content = '') {
    const elem = document.createElement(tagName);
    for (const key in attrs) {
        elem.setAttribute(key, attrs[key]);
    }
    if (content) {
        if (typeof content == 'string') {
            elem.innerHTML = content;
        } else {
            if (content instanceof Array) {
                content.forEach(node => elem.appendChild(node));
            } else {
                elem.appendChild(content);
            }
        }
    }
    return elem;
}

function $single(selector, context) {
    if (selector.tagName ?? false) {
        return selector;
    }
    return (context ? context : document).querySelector(selector);
}

function $list(selector, context) {
    return (context ? context : document).querySelectorAll(selector);
}

function $last(selector, context) {
    const list = $list(selector, context);
    return list[list.length - 1] ?? undefined;
}

function $apply(selector, fnc, context) {
    const elems = $list(selector, context);
    if (typeof fnc == 'function') {
        Array.from(elems).forEach(el => fnc.call(el, el));
    }
    return elems;
}

function insertAfter(newNode, refNode) {
    if (refNode.parentNode) {
        if (refNode.nextSibling) {
            refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
        } else {
            refNode.parentNode.appendChild(newNode);
        }
    }
}

// Script

function writeScript(src) {
    const script = tag('script', {
        src,
        type: 'text/javascript'
    });
    document.head.appendChild(script);
}

// Misc

function leadingZero(num) {
    return Number(num) < 10 ? `0${Number(num)}` : String(num);
}

function debounce(func, timeout = 300){
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function copyText(txt) {
    navigator.clipboard.writeText(txt);
}

function copyInputText(input) {
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
}

function toSlug(str, spaceTo = '-') {
    str = str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, spaceTo).replace(/[^\w_]/g, '');
    return str.toLowerCase();
}

function toCamelCase(str) {
    str = str.toLowerCase().trim().replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    return str;
}

// Date

function localDate(...args) {
    const date = args[0] instanceof Date ? args[0] : new Date(...args);
    date.setTime(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
    return date;
}

function addDays(days, date) {
    date.setDate(date.getDate() + days);
    return date;
}

// Form

function setFormValues(form, values) {
    for (const key in values) {
        const input = form.elements[key];
        if (input) {
            if (typeof input.checked == 'boolean') {
                input.checked = !!values[key];
            } else {
                input.value = values[key];
            }
        }
    }
}

function formValues(form, excludeValues = []) {
    form = form.matches('form') ? form : form.closest('form');
    if (form) {
        let data = {};
        const dataf = new FormData(form);
        dataf.forEach((value, key) => {
            if (!excludeValues.length || !excludeValues.includes(value)) {
                data[key] = value;
            }
        });
        return data;
    }
    return false;
}

// function createForm(data) {
// }

function showOnOption(combo, value, dependent) {
    if (!dependent.getAttribute('data-display')) {
        dependent.setAttribute('data-display', dependent.style.display);
    }
    if (combo.value != value) {
        dependent.style.display = 'none';
    }
    combo.addEventListener('input', event => {
        if (event.target.value == value) {
            dependent.style.display = dependent.getAttribute('data-display');
        } else {
            dependent.style.display = 'none';
        }
    });
    combo.dispatchEvent(new Event('input'));
}

// Style

function css(selector, obj, context) {
    return $apply(selector, elem => Object.assign(elem.style, obj), context);
}

function getStyle(elem, prop = '') {
    elem = typeof elem == 'string' ? $single(elem) : elem;
    const styles = window.getComputedStyle(elem);
    if (prop) {
        return styles.getPropertyValue(prop);
    }
    return styles;
}

function currentStyle(elem, prop = '') {
    const para = $single(elem);
    const compStyles = window.getComputedStyle(para);
    if (prop && typeof prop == 'string') {
        console.log(prop, toCamelCase(prop), compStyles.getPropertyValue(toSlug(prop)))
        return compStyles.getPropertyValue(toSlug(prop));
    }
    const styleObject = {};
    for (let i = 0; i < compStyles.length; i++) {
        const cssProperty = compStyles[i];
        if (prop && prop instanceof RegExp && !prop.test(cssProperty)) {
            continue;
        }
        const jsProperty = toCamelCase(cssProperty);
        styleObject[jsProperty] = compStyles.getPropertyValue(cssProperty);
    }
    return styleObject;
}

function cssModifySize(size, percentage = 0, precision = 4) {
    percentage = parseInt(percentage);
    const value = Number(size.replace(/[^0-9-]+/g, ''));
    const unit = size.trim().replace(/[0-9]+/g, '');
    const nVal = (value / 100) * percentage;
    const nv = (nVal + value).toFixed(precision);
    return nv + unit;
}

function increaseFonts(wrapper, percentage) {
    wrapper = typeof wrapper == 'string' ? $single(wrapper) : wrapper;
    const elems = $list('*', wrapper);
    Array.from(elems).forEach(el => {
        const fs = getStyle(el, 'fontSize');
        if (fs) {
            let oriFs = el.getAttribute('data-font-size');
            if (!oriFs) {
                el.setAttribute('data-font-size', fs);
                oriFs = fs;
            }
            const nfs = cssModifySize(oriFs, percentage);
            el.style.fontSize = nfs;
        }
    });
}

// Ajax

function fetchData(url, method = 'GET', data = {}, filter = 'json') {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    if (method === 'POST') {
        options.body = new URLSearchParams(data).toString();
    }
    if (method === 'GET') {
        url = addUrlParams(data, url);
    }
    const ret = fetch(url, options);
    if (filter) {
        ret.then(response => response[filter]());
    }
    return ret;
}

function ajax(url, data = {}, method = 'GET', headers = {}) {
    headers = { 'Content-Type': 'application/x-www-form-urlencoded', ...headers };
    let options = { method, headers };
    if (method.toUpperCase() === 'POST') {
        options.body = new URLSearchParams(data).toString();
    } else {
        url = addUrlParams(data, url);
    }
    return fetch(url, options);
}

// URL

function getUrlParams(url = window.location.href) {
    url = new URL(url);
    const params = new URLSearchParams(url.search);
    const vars = {};
    for (const [key, value] of params.entries()) {
        vars[key] = value;
    }
    return vars;
}

function addUrlParams(params, url = window.location.href) {
    let urlObj = new URL(url);
    Object.keys(params).forEach(key => {
        urlObj.searchParams.set(key, params[key]);
    });
    return urlObj.toString();
}

function removeUrlParams(names, url = window.location.href) {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    names.forEach(name => params.delete(name));
    return `${urlObj.origin}${urlObj.pathname}?${params.toString()}`;
}

function replaceUrl(url) {
    history.pushState(null, null, url);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}