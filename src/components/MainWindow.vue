<template>
  <Window>
    <Toolbar type="header">
      <ToolbarActions>
        <ButtonGroup class="pull-left">
          <Button size="sm" :active="!shownSidebar" @click.native="Unshow('sidebar')">
            <Icon icon="folder"></Icon>
          </Button>
          <Button size="sm" :active="!shownMainPane" @click.native="Unshow('mainPane')">
            <Icon icon="quote"></Icon>
          </Button>
          <Button size="sm" :active="!shownAltPane" @click.native="Unshow('altPane')">
            <Icon icon="tools"></Icon>
          </Button>
        </ButtonGroup>
        <ButtonGroup class="pull-left" :class="{hidden: selEdit==''}">
          <Button size="sm" :active="!configShowInvisibles" @click.native="Unconfig('showInvisibles')">
            <Icon icon="block"></Icon>
          </Button>
          <Button size="sm" :active="!configShowFoldWidgets" @click.native="Unconfig('showFoldWidgets')">
            <Icon icon="flow-cascade"></Icon>
          </Button>
          <Button size="sm" :active="!configShowPrintMargin" @click.native="Unconfig('showPrintMargin')">
            <Icon icon="list"></Icon>
          </Button>
          <Button size="sm" :active="!configUseWrapMode" @click.native="Unconfig('useWrapMode')">
            <Icon icon="level-down"></Icon>
          </Button>
        </ButtonGroup>
        <ButtonGroup class="pull-right" :class="{hidden: !shownAltPane}">
          <Button size="sm" :active="selAlt=='sRendu'" @click.native="SelAlt('sRendu')">
            <Icon icon="doc-text"></Icon>
          </Button>
          <Button size="sm" :active="selAlt=='sFront'" @click.native="SelAlt('sFront')">
            <Icon icon="info"></Icon>
          </Button>
        </ButtonGroup>
      </ToolbarActions>
    </Toolbar>
    <WindowContent>
      <PaneGroup>
        <Pane size="sm" :sidebar="true" :class="{hidden: !shownSidebar}"><VueTree :folder="Dossier"></VueTree></Pane>
        <Pane>
          <VueSplit
            :elements="panes"
            direction="horizontal"
            :min-size="100"
            :gutter-size="10"
            :snap-offset="50"
            @onDragEnd="Resize()"
          >
            <div id="mainPane" :class="{hidden: !shownMainPane}">
              <TabGroup>
                <TabItem
                  v-for="ID in EditorList"
                  class="stayFit"
                  :key="ID"
                  :active="ID==selEdit"
                  :class="{hidden: !hasFile}"
                  :title="Editors[ID].Path"
                  @click.native="Select(ID)"
                  @cancel="toClose(ID)">
                  {{Editors[ID].Title}}{{Editors[ID].Changed?"*":""}}
                </TabItem>
                <TabItem :fixed="true" icon="plus" @click.native="addNew">
                </TabItem>
              </TabGroup>
              <div v-for="ID in EditorList" :name="ID" :key="ID" class="expanded" :class="{hidden: selEdit!=ID}" >
                <editor
                  :ref="ID"
                  v-model="Editors[ID].Content"
                  @init="editorInit"
                  lang="markdown"
                  theme="chrome"
                  @click.right.native="clkCtx"
                  @input="setMaster"
                >
                </editor>
              </div>
            </div>
            <div id="altPane" :class="{hidden: !shownAltPane}" style="overflow-y:auto;">
              <div v-if="selEdit != ''" v-html="marked" :class="{hidden: selAlt != 'sRendu'}"></div>
              <div v-if="selEdit != ''" v-html="jshtm" :class="{hidden: selAlt != 'sFront'}"></div>
            </div>
          </VueSplit>
        </Pane>
      </PaneGroup>
    </WindowContent>
    <Toolbar type="footer"><span class="FFile stayFit pull-left">{{Footer}}</span><span :title="showCount" class="Details stayFit pull-right">{{count.words}} mots</span><span v-if="'objectif' in mattered.data" class="Details stayFit pull-right">{{objectif}}</span></Toolbar>
    <div class="hidden">{{hasMod}} / {{counter}}</div>
  </Window>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import jthf from "json-to-html-form"
import VueSplit from "./VueSplit.vue";
import VueTree from "./VueTree.vue";
import { Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions, ButtonGroup, Button, Icon, TabGroup, TabItem } from "vue-photonkit";
import * as matter from 'gray-matter';
import Marked from "marked"
import nanoid from "nanoid"
import fs from "fs"
import Countable from "countable"
import * as path from 'path'
import { remote, ipcRenderer } from "electron"
const { getCurrentWindow, dialog, Menu, MenuItem, shell } = remote
require('electron-disable-file-drop');

export default {
  name: "MainWindow",

  props: {
    msg: String
  },

  data() {
    return {
      CtxMenu: {},
      Master: "",
      counter: 0,
    }
  },

  watch: {
    selEdit: function (newSel, oldSel) {
      if (newSel !== oldSel) {
        this.Master = this.Editors[newSel].Content;
      }
    }
  },

  computed: {
    ...mapState({
      shownSidebar: state => state.shown.sidebar,
      shownMainPane: state => state.shown.mainPane,
      shownAltPane: state => state.shown.altPane,
      configShowInvisibles: state => state.config.showInvisibles,
      configShowFoldWidgets: state => state.config.showFoldWidgets,
      configShowPrintMargin: state => state.config.showPrintMargin,
      configUseWrapMode: state => state.config.useWrapMode,
      EditorList: state => state.editList,
    }),

    selEdit: {
      get () { return this.$store.state.selected.edit },
      set (value) { this.updateSelected({ target: 'edit', value: value}) }
    },
    selAlt: {
      get () { return this.$store.state.selected.alt },
      set (value) { this.updateSelected({ target: 'alt', value: value}) }
    },
    Dossier: {
      get () { return this.$store.state.dossier },
      set (value) { this.updateDossier(value) }
    },

    Editors: {
      get () { return this.$store.state.edits },
      set (value) { this.updateEdits(value) }
    },

    hasMod: function() {
      // eslint-disable-next-line
      let ct = this.counter++;
      let mod = this.$store.getters.hasMod();
      ipcRenderer.send('update-notify-value', mod ? "1" : "0");
      return mod;
    },
    Footer: function() {
        if (this.selEdit == '') return "/";
        return this.Editors[this.selEdit].Path;
    },
    hasFile: function() {
      return (Object.keys(this.Editors).length !== 0)
    },
    mattered: function() {
      return matter((this.selEdit) ? this.Master : "");
    },
    marked: function () {
      return Marked(this.mattered.content);
    },
    objectif: function() {
      if ('objectif' in this.mattered.data) {
        let n = this.mattered.data.objectif;
        let w = this.count.words;
        if (!isNaN(parseFloat(n)) && isFinite(n)) {
          if (n == 0) return '';
          return `${Math.round(1000*w / n)/10} %`;
        }
      }
      return ''
    },
    count: function () {
      let s = this.mattered.content;
      return Countable.countString(s);
    },
    showCount: function() {
      return `Paragraphes : ${this.count.paragraphs}
Phrases : ${this.count.sentences}
Mots : ${this.count.words}
Lettres : ${this.count.characters}
Avec espace : ${this.count.all}`;
    },
    jshtm: function () {
      return jthf.getForm(this.mattered.data);
    },
    panes: function() {
      var res = [];
      if (this.shownMainPane) {
        res.push('#mainPane');
      }
      if (this.shownAltPane) {
        res.push('#altPane');
      }
      return res;
    }
  },

  methods: {
    ...mapMutations([
      'invertShown',
      'invertConfig',
      'updateSelected',
      'updateDossier',
      'importState',
      'exportState',
      'updateEdits',
      'createEdit',
      'modifyEdit',
      'deleteEdit'
    ]),
    editor: function() {
        return (this.selEdit) ? (this.$refs[this.selEdit] ? this.$refs[this.selEdit][0] : null ) : null;
    },
    waitNext: function(cb) {
      let vm = this;
      vm.counter++;
      vm.$nextTick(() => {
        let editor = vm.editor()
        if (editor && editor.editor) {
          editor.editor.focus();
        }
        if (cb) {
          cb();
        }
      });
    },
    Resize: function(cb) {
      let vm = this;
      vm.$nextTick(() => {
        let editor = vm.editor()
        if (editor && editor.editor) {
          editor.editor.resize();
          editor.editor.focus();
        }
        if (cb) {
          cb();
        }
      })
    },
    makeBold: function() {
      let editor = this.editor()
      if (editor && editor.editor) {
        let selection = editor.editor.getSelection();
        if (! selection.isEmpty()) {
            let selectedRange = editor.editor.getSelectionRange();
            let selectedText = editor.editor.getSession().getDocument().getTextRange(selectedRange);
            editor.editor.getSession().getDocument().replace(selectedRange, `**${selectedText}**`);
        } else {
            editor.editor.insert('**GRAS**');
        }
        this.waitNext();
      }
    },
    makeItal: function() {
      let editor = this.editor()
      if (editor && editor.editor) {
        let selection = editor.editor.getSelection();
        if (! selection.isEmpty()) {
            let selectedRange = editor.editor.getSelectionRange();
            let selectedText = editor.editor.getSession().getDocument().getTextRange(selectedRange);
            editor.editor.getSession().getDocument().replace(selectedRange, `_${selectedText}_`);
        } else {
            editor.editor.insert('*_ITAL_');
        }
        this.waitNext();
      }
    },
    shellGo: function(empty,full) {
      let editor = this.editor()
      if (editor && editor.editor) {
        let selection = editor.editor.getSelection();
        if (! selection.isEmpty()) {
          let selectedRange = editor.editor.getSelectionRange();
          let selectedText = editor.editor.getSession().getDocument().getTextRange(selectedRange);
          shell.openExternal(full + selectedText);
        } else {
          shell.openExternal(empty)
        }
        this.waitNext();
      }
    },
    clkCtx: function() {
      this.CtxMenu.popup({window: getCurrentWindow()})
      this.waitNext();
    },
    addNew: function() {
      let vm = this;
      var ID = nanoid();
      vm.createEdit({
        ID: ID,
        Title: "Untitled",
        Path: "Untitled",
        New: true,
        Changed: true,
        Content: ""
      });
      vm.selEdit = ID;
      vm.Resize(() => vm.$forceUpdate())
    },
    toClose: function(ID) {
      let vm = this;
      let Sel = "";
      for(let item in vm.Editors) {
        if (item != ID ) {
          Sel = item;
        }
      }
      vm.selEdit = Sel;
      vm.deleteEdit({ ID });
      vm.Resize(() => vm.$forceUpdate())
    },
    toExport: function() {
      ipcRenderer.send('print-pdf', this.marked);
    },
    toSave: function() {
      var vm = this;
      let Sel = vm.selEdit;
      if (Sel != "") {
        let Item = vm.Editors[Sel];
        if (Item.Changed) {
          if (Item.New) {
            var fileName = dialog.showSaveDialog(getCurrentWindow(), {
              filters: [
                { name: 'Markdown', extensions: ['md'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            if (typeof fileName !== 'undefined') {
              // eslint-disable-next-line
              fs.writeFileSync(fileName, Item.Content);
              vm.modifyEdit( { ID: Sel, New: false, Changed: false, Title: path.basename(fileName), Path: fileName })
            }
          } else {
            // eslint-disable-next-line
            fs.writeFileSync(Item.Path, Item.Content);
            vm.modifyEdit( { ID: Sel, Changed: false })
          }
          vm.waitNext(() => vm.$forceUpdate());
        }
      }
    },
    toOpen: function() {
      var vm = this;
      var fileNames = dialog.showOpenDialog(getCurrentWindow(), {
        properties: [
          'openDirectory'
        ]});

      if (fileNames !== undefined) {
        vm.Dossier = fileNames[0];
      }
    },
    toLoad: function() {
      var vm = this;
      var fileNames = dialog.showOpenDialog(getCurrentWindow(), {
        properties: [
          'openFile'
        ],
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (fileNames !== undefined) {
        var fileName = fileNames[0];
        fs.readFile(fileName, 'utf8', function (err, data) {
          var ID = fileName;
          vm.createEdit( {
            ID: ID,
            Title: path.basename(ID),
            Path: ID,
            New: false,
            Changed: false,
            Content: data
          });
          vm.selEdit = ID;
          vm.Resize(() => vm.$forceUpdate())
        });
      }
    },
    setMaster: function(content) {
      let vm = this;
      vm.Master = content;
      vm.modifyEdit({ ID: vm.selEdit, Changed: true });
    },
    editorInit: function () {
      require('brace/ext/language_tools') //language extension prerequsite...
      require('brace/mode/markdown')    //language
      require('brace/theme/chrome')
      this.Reconfig();
    },
    Select: function(id) {
      let vm = this;
      vm.selEdit = id;
      vm.Resize()
    },
    SelAlt: function(sel) {
      this.selAlt = sel;
      this.Resize();
    },
    Unshow: function(show) {
      this.invertShown(show)
      if (this.selEdit != "") {
        this.Resize();
      }
    },
    Unconfig: function(conf) {
      this.invertConfig(conf)
      this.ReconfigAll();
    },
    Reconfig: function() {
      let editor = this.editor()
      if (editor && editor.editor) {
        let Zeditor = editor.editor;
        Zeditor.setWrapBehavioursEnabled(true);
        Zeditor.setShowInvisibles(this.configShowInvisibles);
        Zeditor.setShowFoldWidgets(this.configShowFoldWidgets);
        Zeditor.setShowPrintMargin(this.configShowPrintMargin);
        Zeditor.getSession().setUseWrapMode(this.configUseWrapMode);
        Zeditor.getSession().setUseSoftTabs(true);
        this.waitNext();
      }
    },
    ReconfigAll: function() {
      let vm = this;
      for (let sel of vm.EditorList) {
        if (vm.$refs[sel]) {
          let editor = vm.$refs[sel][0];
          if (editor && editor.editor) {
            let Zeditor = editor.editor;
            Zeditor.setWrapBehavioursEnabled(true);
            Zeditor.setShowInvisibles(vm.configShowInvisibles);
            Zeditor.setShowFoldWidgets(vm.configShowFoldWidgets);
            Zeditor.setShowPrintMargin(vm.configShowPrintMargin);
            Zeditor.getSession().setUseWrapMode(vm.configUseWrapMode);
            Zeditor.getSession().setUseSoftTabs(true);
          }
        }
      }
      vm.waitNext();
    }
  },

  components: {
    VueTree, VueSplit, Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions, ButtonGroup, Button, Icon, TabGroup, TabItem,
    editor: require('vue2-ace-editor')
  },

  mounted: function () {
    var vm = this;

    ipcRenderer.on('closing', function() {
      vm.exportState();
      ipcRenderer.send('ok-to-close');
    });

    vm.$nextTick(function () {
      vm.importState();
      vm.waitNext(() => { vm.ReconfigAll() })

      const template = [
        {
          label: 'Fichier',
            submenu: [
              { label:'Nouveau Fichier', accelerator: 'CommandOrControl+N', click: vm.addNew },
              { label:'Ouvrir Dossier', accelerator: 'CommandOrControl+D', click: vm.toOpen },
              { label:'Ouvrir Fichier', accelerator: 'CommandOrControl+O', click: vm.toLoad },
              { label:'Enregistrer', accelerator: 'CommandOrControl+S', click: vm.toSave },
              { label:'Exporter', accelerator: 'CommandOrControl+P', click: vm.toExport },
              {type: 'separator'},
              { label:'Quitter', role: 'quit'}
          ]
        },
        {
          label: 'Modifier',
          role: 'editMenu',
          submenu: [
            {label:'Annuler', role: 'undo'},
            {label:'Rétablir', role: 'redo'},
            {type: 'separator'},
            {label:'Couper', role: 'cut'},
            {label:'Copier', role: 'copy'},
            {label:'Coller', role: 'paste'},
            {type: 'separator'},
            {label:'Supprimer', role: 'delete'},
            {label:'Tout sélectionner', role: 'selectall'}
          ]
        },
        {
          label: 'Afficher',
          submenu: [
            {label:'Zoomer', role: 'zoomin'},
            {label:'Dé-zoomer', role: 'zoomout'},
            {label:'Zoom initial', role: 'resetzoom'},
            {type: 'separator'},
            {label:'Plein écran', role: 'togglefullscreen'}
          ]
        },
        {
          label: 'Fenêtre',
          role: 'windowMenu',
          submenu: [
            {label:'Réduire', role: 'minimize'},
            {label:'Fermer', role: 'close'}
          ]
        },
        {
          label: "Aide",
          role: 'help',
          submenu: [
            {
              label: 'Sources',
              click () { shell.openExternal('https://github.com/jeryckho/my-words') }
            }
          ]
        }
      ];

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);

      vm.CtxMenu = new Menu();
      vm.CtxMenu.append(new MenuItem({label: 'Gras', click: vm.makeBold }))
      vm.CtxMenu.append(new MenuItem({label: 'Italique', click: vm.makeItal }))
      vm.CtxMenu.append(new MenuItem({type: 'separator'}))
      vm.CtxMenu.append(new MenuItem({label: 'Wikipedia', click() { vm.shellGo('https://fr.wikipedia.org','https://fr.wikipedia.org/wiki/') } }))
      vm.CtxMenu.append(new MenuItem({label: 'Le Conjugueur', click() { vm.shellGo('https://leconjugueur.lefigaro.fr','https://leconjugueur.lefigaro.fr/conjugaison/verbe/') } }))
      vm.CtxMenu.append(new MenuItem({label: 'Synonymes', click() { vm.shellGo('http://www.synonymes.com/','http://www.synonymes.com/synonyme.php?mot=') } }))
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.hidden {
  display: none;
}
.expanded {
  width: 100%;
  height: calc(100% - 25px) !important;
}
.stayFit {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.FFile {
  max-width:50%;
  display:inline-block
}
.Details {
  max-width:24%;
  padding-left: 15px;
  display:inline-block
}
</style>
