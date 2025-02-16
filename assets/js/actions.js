
const Actions = (() => {
    // Stores the functions by hook name
    const actions = {};

    return {
        /**
         * Adds a function to a hook.
         * @param {string} act - The name of the hook.
         * @param {function} fnc - The function to be executed.
         */
        add(act, fnc) {
            if (typeof act !== 'string' || typeof fnc !== 'function') {
                throw new Error('Invalid arguments: act must be a string and fnc must be a function');
            }
            if (actions[act] === undefined) {
                actions[act] = [fnc];
            } else {
                actions[act].push(fnc);
            }
        },

        /**
         * Executes functions associated with a hook and returns the modified value.
         * @param {string} act - The name of the hook.
         * @param {array} params - Parameters passed to the functions.
         * @returns {any} - The modified value.
         */
        async filter(act, params = []) {
            if (actions[act] !== undefined) {
                for (const cb of actions[act]) {
                    if (typeof cb === 'function') {
                        params[0] = await cb.apply(null, params);
                    } else if (typeof cb === 'string' && typeof window[cb] === 'function') {
                        params[0] = await window[cb].apply(null, params);
                    }
                }
            }
            return params[0];
        },

        /**
         * Executes functions associated with a hook.
         * @param {string} act - The name of the hook.
         * @param {array} params - Parameters passed to the functions.
         */
        async exec(act, params = null) {
            if (actions[act] !== undefined) {
                await Promise.all(actions[act].map(async cb => {
                    try {
                        if (typeof cb === 'function') {
                            await cb.apply(null, params);
                        } else if (typeof cb === 'string' && typeof window[cb] === 'function') {
                            await window[cb].apply(null, params);
                        }
                    } catch (error) {
                        console.error(`Error executing action "${act}":`, error);
                    }
                }));
            }
        },

        /**
         * Wraps a function to execute a hook before it.
         * @param {string} act - The name of the hook.
         * @param {function} fnc - The function to be wrapped.
         * @returns {function} - The wrapped function.
         */
        graft(act, fnc) {
            return function(...params) {
                this.exec(act, params);
                return fnc.apply(this, params);
            }.bind(this);
        },

        /**
         * Removes a function from a hook.
         * @param {string} act - The name of the hook.
         * @param {function} fnc - The function to be removed.
         */
        remove(act, fnc) {
            if (actions[act] !== undefined) {
                actions[act] = actions[act].filter(cb => cb !== fnc);
            }
        },

        /**
         * Lists all registered hooks.
         * @returns {array} - List of hooks.
         */
        list() {
            return Object.keys(actions);
        }
    };
})();

// Prevents accidental modifications to the Actions object
Object.freeze(Actions);



// const Actions = {
//     // Armazena as funções pelo nome do hook
//     actions: {},
//     // Adiciona uma função em algum hook
//     add(act, fnc) {
//         if (Actions.actions[act] === undefined) {
//             Actions.actions[act] = [fnc];
//         } else {
//             Actions.actions[act].push(fnc);
//         }
//     },
//     // Executa as funções listadas em actions[act] e retorna o primeiro valor
//     filter(act, params = []) {
//         if (Actions.actions[act] !== undefined) {
//             Actions.actions[act].forEach(cb => {
//                 if (typeof cb == 'function') {
//                     params[0] = cb.apply(null, params);
//                 }
//                 if (typeof cb == 'string' && typeof window[cb] == 'function') {
//                     params[0] = window[cb].apply(null, params);
//                 }
//             });
//         }
//         return params[0];
//     },
//     // Executa as funções listadas em actions[act]
//     exec(act, params = null) {
//         if (Actions.actions[act] !== undefined) {
//             Actions.actions[act].forEach(cb => {
//                 if (typeof cb == 'function') {
//                     cb.apply(null, params);
//                 }
//                 if (typeof cb == 'string' && typeof window[cb] == 'function') {
//                     window[cb].apply(null, params);
//                 }
//             });
//         }
//     },
//     // Um modo de disparar nossos eventos a partir de funções de terceiros
//     graft(act, fnc) {
//         return function(...params) {
//             Actions.exec(act, params);
//             return fnc(...params);
//         };
//     }
// };