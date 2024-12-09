/**
 * Dialog
 * ======
 * This class uses class Popup to create
 * replacements for alert(), prompt(), confirm().
 */

class Dialog {
    pop;
    isOpen = false;
    autoFocus = true;

    constructor(title = '') {
        this.pop = new Popup();
        this.pop.useCloseButton = false;
        if (title) {
            this.pop.setTitle(title);
        }
        addEscBehavior(() => {
            if ($single('.popup-overlay.dialog')) {
                this.pop.close();
            }
        });
        this.pop.on('open', () => {
            this.isOpen = true;
            if (this.autoFocus) {
                this.setFocus();
            }
        });
        this.pop.on('close', () => this.isOpen = false);
    }

    addButton(action = null, label = 'Ok', cls = 'primary') {
        const btn = tag('button', { class: `button-${cls}` }, label);
        btn.addEventListener('click', () => {
            if (typeof action == 'function') {
                action();
            }
            this.pop.close();
        });
        this.pop.addFooterButton(btn);
    }

    addCancelButton(label = 'Cancel') {
        this.addButton(null, label, 'secondary');
    }
    
    alert(txt, title = '') {
        this.pop.footerChildren = [];
        this.pop.customClass = "dialog alert";
        return new Promise(resolve => {
            this.addButton(resolve);
            if (title) {
                this.pop.setTitle(title);
            }
            this.pop.setContent(`<div class="content-alert">${txt}</div>`);
            this.pop.open();
        });
    }
    
    confirm(txt, title = '') {
        this.pop.footerChildren = [];
        this.pop.customClass = "dialog confirm";
        return new Promise(resolve => {
            this.pop.on('close', () => resolve(false));
            this.addButton(() => resolve(false), 'Cancel', 'secondary');
            this.addButton(() => resolve(true));
            if (title) {
                this.pop.setTitle(title);
            }
            this.pop.setContent(`<div class="content-confirm">${txt}</div>`);
            this.pop.open();
        });
    }
    
    prompt(label, placeholder = '', title = '') {
        this.pop.footerChildren = [];
        this.pop.customClass = "dialog prompt";
        return new Promise(resolve => {
            this.pop.on('close', () => resolve(false));
            this.addButton(() => resolve(false), 'Cancel', 'secondary');
            this.addButton(() => resolve($single('#dialog_prompt').value));
            if (title) {
                this.pop.setTitle(title);
            }
            let html = '<div class="content-prompt">';
            html += `<label for="dialog_prompt">${label}</label>`;
            html += `<input type="text" id="dialog_prompt" placeholder="${placeholder}">`;
            html += '</div>';
            this.pop.setContent(html);
            this.pop.open();
        });
    }
    
    modal(content) {
        this.pop.customClass = "dialog modal";
        this.pop.setContent(`<div class="content-modal">${content}</div>`);
        this.pop.open();
        return () => this.pop.close();
    }
    
    transparent(content) {
        this.pop.header = false;
        this.pop.footer = false;
        this.pop.customClass = "dialog transparent";
        this.pop.setContent(`<div class="content-modal">${content}</div>`);
        this.pop.open();
        return () => this.pop.close();
    }

    setFocus() {
        setTimeout(() => {
            const first = $single('.popup-popup input[type="text"], .popup-popup button.button-primary');
            if (first) {
                first.focus();
                if (first.matches('input[type="text"]')) {
                    first.addEventListener('keyup', event => {
                        if (first.value && event.key == 'Enter') {
                            $single('.popup-popup button.button-primary').click();
                            this.pop.close();
                        }
                    });
                }
            }
        }, 80);
    }
}