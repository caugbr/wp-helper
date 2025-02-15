

const Actions = {
    // Armazena as funções pelo nome do hook
    actions: {},
    // Adiciona uma função em algum hook
    add(act, fnc) {
        if (Actions.actions[act] === undefined) {
            Actions.actions[act] = [fnc];
        } else {
            Actions.actions[act].push(fnc);
        }
    },
    // Executa as funções listadas em actions[act] e retorna o primeiro valor
    filter(act, params = []) {
        if (Actions.actions[act] !== undefined) {
            Actions.actions[act].forEach(cb => {
                if (typeof cb == 'function') {
                    params[0] = cb.apply(null, params);
                }
                if (typeof cb == 'string' && typeof window[cb] == 'function') {
                    params[0] = window[cb].apply(null, params);
                }
            });
        }
        return params[0];
    },
    // Executa as funções listadas em actions[act]
    exec(act, params = null) {
        if (Actions.actions[act] !== undefined) {
            Actions.actions[act].forEach(cb => {
                if (typeof cb == 'function') {
                    cb.apply(null, params);
                }
                if (typeof cb == 'string' && typeof window[cb] == 'function') {
                    window[cb].apply(null, params);
                }
            });
        }
    },
    // Um modo de disparar nossos eventos a partir de funções de terceiros
    graft(act, fnc) {
        const oldFnc = fnc;
        return function(...params) {
            Actions.exec(act, params);
            return oldFnc(...params);
        };
    }
};