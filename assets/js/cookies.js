
class Cookies {

    currentCookies;
    allowedCookies;
    cookies;
    permissionNeeded;

    constructor() {
        this.currentCookies = this.all();
        this.allowedCookies = this.getPermissions();
        this.cookies = [];
        this.permissionNeeded = [];
    }

    start() {
        this.permissionNeeded = [];
        this.cookies.forEach(ck => {
            if (!ck.isset) {
                if (ck.allowed) {
                    this.set(ck.name, ck.value);
                } else {
                    this.permissionNeeded.push(ck);
                }
            }
        });
        if (this.permissionNeeded.length) {
            this.askForPermission();
        }
    }
    
    setPermissions(names) {
        names.forEach(name => {
            if (!this.allowedCookies.includes(name)) {
                this.allowedCookies.push(name);
            }
        });
        this.savePermissions();
    }
    
    getPermissions() {
        let allowed = window.localStorage.getItem('allowed_cookies');
        if (allowed) {
            return allowed.split(',');
        }
        return [];
    }
    
    hasPermission(name) {
        return this.allowedCookies.includes(name);
    }
    
    revokePermission(name) {
        if (this.allowedCookies.includes(name)) {
            const ind = this.allowedCookies.findIndex(name);
            this.allowedCookies.splice(ind, 1);
            this.savePermissions();
        }
    }
    
    savePermissions() {
        window.localStorage.setItem('allowed_cookies', this.allowedCookies.join(','));
    }

    registerCookie(name, value, options = {}, description = '', category = '') {
        const isset = (this.currentCookies[name] !== undefined);
        allowed = this.allowedCookies.includes(name);
        this.cookies.push({ name, value, options, description, category, allowed, isset });
    }

    all() {
        const cookies = document.cookie.split('; ');
        const cookieObject = {};
        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split('=');
            cookieObject[cookieName] = decodeURIComponent(cookieValue);
        }
        return cookieObject;
    }

    get(name) {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split('=');
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return undefined;
    }

    set(name, value, options = {}) {
        let ck = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        if (options.expires instanceof Date) {
            ck += `; expires=${options.expires.toUTCString()}`;
        } else if (typeof options.expires === 'number') {
            const expires = new Date();
            expires.setDate(expires.getDate() + options.expires);
            ck += `; expires=${expires.toUTCString()}`;
        }
        if (options.domain) {
            ck += `; domain=${options.domain}`;
        }
        if (options.path) {
            ck += `; path=${options.path}`;
        }
        if (options.secure) {
            ck += '; secure';
        }
        document.cookie = ck;
    }

    unset(name, options = {}) {
        this.set(name, '', { ...options, expires: -1 });
    }

    hasSupport() {
        let support = navigator.cookieEnabled ?? null;
        if (null === support){
            this.set('test_cookie_support', 1);
            support = this.get("test_cookie_support") !== undefined;
            this.unset('test_cookie_support');
        }
        return support;
    }
}
  