import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    config: {
      showInvisibles: false,
      showFoldWidgets: false,
      showPrintMargin: false,
      useWrapMode: true
    },
    shown: {
      sidebar: true,
      mainPane: true,
      altPane: true
    },
    selected: {
      edit: "",
      alt: "sRendu"
    },
    dossier: "",
  },
  mutations: {
    updateShown(state, payload)     { fUpdateShown(state, payload) },
    invertShown(state, pane)        { fUpdateShown(state, { target: pane, value: !state.shown[pane] }) },

    updateConfig(state, payload)    { fUpdateConfig(state, payload) },
    invertConfig(state, conf)       { fUpdateConfig(state, { target: conf, value: !state.config[conf] }) },

    updateSelected(state, payload)  { fUpdate(state, payload, 'selected') },
    updateDossier(state, value)     { state.dossier = value },

    importState(state) {
      let loc;
      loc = window.localStorage.getItem('Shown');
      if (loc != null) {
        state.shown = { ...state.shown, ...JSON.parse(loc)}
      }
      loc = window.localStorage.getItem('Config');
      if (loc != null) {
        state.config = { ...state.config, ...JSON.parse(loc)}
      }
      loc = window.localStorage.getItem('Selected');
      if (loc != null) {
        state.selected = { ...state.selected, ...JSON.parse(loc)}
      }
      loc = window.localStorage.getItem('Dossier');
      if (loc != null) {
        state.dossier = loc
      }
    },

    exportState(state) {
      window.localStorage.setItem('Shown', JSON.stringify(state.shown));
      window.localStorage.setItem('Config', JSON.stringify(state.config));
      window.localStorage.setItem('Selected', JSON.stringify(state.selected));
      window.localStorage.setItem('Dossier', state.dossier)
    }

  },
  actions: {
  },
  strict: true
});

function fUpdate(state, payload, level) {
  state[level][payload.target] = payload.value;
}
function fUpdateShown(state, payload) {
  fUpdate(state, payload, 'shown')
}
function fUpdateConfig(state, payload) {
  fUpdate(state, payload, 'config')
}