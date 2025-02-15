
/**
 * Select only one taxonomy term
 * -----------------------------
 * @param {string} tax Taxonomy
 * @param {string} postType Post type
 * @param {string} strategy 'hide' or 'radio'. Use 'radio' to just replace the checkboxes. Default: 'hide'.
 * @returns boolean
 */
function uniqueCat(tax, postType, strategy = 'hide') {
    const typeInput = $single('input#post_type');
    const checklist = $single(`#${tax}checklist`);
    if (!typeInput || typeInput.value != postType || !checklist) {
        return false;
    }
    const checkboxes = $list('input[type="checkbox"]', checklist);
    if (checkboxes.length) {
        Array.from(checkboxes).forEach(cb => {
            if (strategy == 'radio') {
                cb.type = 'radio';
            } else {
                cb.addEventListener('input', evt => {
                    const show = evt.target.checked ? 'one' : 'all';
                    Array.from(checkboxes).forEach(sibling => {
                        if (sibling !== evt.target) {
                            sibling.closest('li').style.display = show == 'all' ? 'block' : 'none';
                        }
                    });
                    evt.target.closest('li').style.display = 'block';
                });
            }
        });
    }
    // hide some things in category metabox
    $single(`#${tax}-adder`).style.display = 'none';
    $single(`#${tax}-tabs li:last-child`).style.display = 'none';
    // if editing, adjust box on page load
    const checkedCat = $single(`#${tax}checklist input[type="checkbox"]:checked`);
    if (checkedCat) {
        checkedCat.dispatchEvent(new Event('input'));
    }
    return true;
}

