

class locationsIBGE {
    states = [];
    durrentState = '';
    durrentCities = [];
    statesId = 'estado';
    statesName = 'estado';
    statesFirstOpt = 'Escolha o estado...';
    citiesId = 'municipio';
    citiesName = 'municipio';
    citiesFirstOpt = 'Escolha o município...';

    constructor(state = '', city = '') {
        if (state) {
            this.setState(state);
        }
        if (city) {
            this.setCity(city);
        }
    }

    setState(state) {
        this.currentState = state;
    }

    setCity(city) {
        this.currentCity = city;
    }

    getStates() {
        return new Promise(resolve => {
            if (!this.states.length) {
                axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
                    .then(states => {
                        resolve(this.states = states.data);
                    });
            } else {
                resolve(this.states.data);
            }
        });
    }

    getCities(state = '') {
        return new Promise(resolve => {
            if (!state) {
                state = this.currentState?.sigla;
            }
            if (state) {
                axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`)
                    .then(cities => {
                        resolve(this.currentCities = cities.data);
                    });
            } else {
                resolve(false);
            }
        });
    }

    statesDropdown(selected = '') {
        return new Promise(resolve => {
            this.getStates().then(states => {
                let dd = document.createElement('select');
                dd.setAttribute('id', this.statesId);
                dd.setAttribute('name', this.statesName);
                const fopt = document.createElement('option');
                fopt.innerText = this.statesFirstOpt;
                dd.appendChild(fopt);
                states.forEach(state => {
                    const opt = document.createElement('option');
                    opt.setAttribute('value', state.sigla);
                    opt.innerText = state.nome;
                    if (selected == state.sigla) {
                        opt.setAttribute('selected', true);
                    }
                    dd.appendChild(opt);
                });
                this.setBehavior(dd);
                resolve(dd);
            });
        });
    }

    citiesDropdown(state = '', selected = '') {
        return new Promise(resolve => {
            let dd = document.createElement('select');
            dd.setAttribute('id', this.citiesId);
            dd.setAttribute('name', this.citiesName);
            if (!state) {
                state = this.currentState?.sigla;
            }
            if (state) {
                this.getCities(state).then(cities => {
                    const fopt = document.createElement('option');
                    fopt.innerText = this.citiesFirstOpt;
                    dd.appendChild(fopt);
                    cities.forEach(city => {
                        const opt = document.createElement('option');
                        opt.setAttribute('value', city.nome);
                        opt.innerText = city.nome;
                        if (selected == city.nome) {
                            opt.setAttribute('selected', true);
                        }
                        dd.appendChild(opt);
                    });
                    resolve(dd);
                });
            } else {
                const fopt = document.createElement('option');
                fopt.innerText = this.statesFirstOpt;
                dd.appendChild(fopt);
                resolve(dd);
            }
        });
    }

    setBehavior(dd) {
        dd = dd ? dd : document.querySelector(`select#${this.statesId}`);
        let cities = document.querySelector(`select#${this.citiesId}`);
        if (dd && cities) {
            dd.addEventListener('input', event => {
                const state = event.target.value;
                this.citiesDropdown(state).then(cdd => {
                    cities.replaceWith(cdd);
                    cities = cdd;
                });
            });
        }
    }
}