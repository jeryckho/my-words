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
      prev: "",
      alt: "sRendu"
    },
    dossier: "",
  },
  mutations: {
    invertShown(state, pane) { state.shown[pane] = !state.shown[pane]; },
    updateShown(state, payload) { state.shown[payload.target] = payload.value; },
    invertConfig(state, conf) { state.config[conf] = !state.config[conf]; },
    updateConfig(state, payload) { state.config[payload.target] = payload.value; },
    updateSelected(state, payload) { state.selected[payload.target] = payload.value },
    updateDossier(state, value) { state.dossier = value },

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
