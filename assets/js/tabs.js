
document.addEventListener('DOMContentLoaded', () => {
    const tabEl = document.querySelector('.tabs');
    if (tabEl) {
        const tabs = tabEl.querySelectorAll('.tab-links a');
        Array.from(tabs).forEach(tab => {
            tab.addEventListener('click', evt => {
                evt.preventDefault();
                const name = evt.target.getAttribute('data-tab');
                tabEl.setAttribute('data-tab', name);
                window.location.hash = `#${name}`;
                // const form = document.querySelector('form#admin-page-form');
                // if (form) {
                //     const formAction = form.getAttribute('action').split('#')[0] + '#' + name;
                //     form.setAttribute('action', formAction);
                //     const action = evt.target.getAttribute('data-action');
                //     document.querySelector('input[name="action"]').value = action;
                // }
            });
        });
        if (window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            const link = document.querySelector(`.tab-links a[data-tab="${hash}"]`);
            if (link) {
                link.dispatchEvent(new Event('click'));
            }
        }
    }
});