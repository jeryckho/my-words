<template>
  <Window>
    <Toolbar type="header">
      <ToolbarActions>
        <ButtonGroup class="pull-left">
          <Button size="sm" :active="!shown.sidebar" @click.native="Unshow('sidebar')">
            <Icon icon="folder"></Icon>
          </Button>
          <Button size="sm" :active="!shown.mainPane" @click.native="Unshow('mainPane')">
            <Icon icon="quote"></Icon>
          </Button>
          <Button size="sm" :active="!shown.altPane" @click.native="Unshow('altPane')">
            <Icon icon="tools"></Icon>
          </Button>
        </ButtonGroup>
        <ButtonGroup class="pull-left" :class="{hidden: selEdit==''}">
          <Button size="sm" :active="!config.showInvisibles" @click.native="Unconfig('showInvisibles')">
            <Icon icon="block"></Icon>
          </Button>
          <Button size="sm" :active="!config.showFoldWidgets" @click.native="Unconfig('showFoldWidgets')">
            <Icon icon="flow-cascade"></Icon>
          </Button>
          <Button size="sm" :active="!config.showPrintMargin" @click.native="Unconfig('showPrintMargin')">
            <Icon icon="list"></Icon>
          </Button>
          <Button size="sm" :active="!config.useWrapMode" @click.native="Unconfig('useWrapMode')">
            <Icon icon="level-down"></Icon>
          </Button>
        </ButtonGroup>
        <ButtonGroup class="pull-right" :class="{hidden: !shown.altPane}">
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
        <Pane size="mini" :sidebar="true" :class="{hidden: !shown.sidebar}">sidebar</Pane>
        <Pane>
          <VueSplit
            :elements="panes"
            direction="horizontal"
            :min-size="100"
            :gutter-size="10"
            :snap-offset="50"
            @onDragEnd="Resize()"
          >
            <div id="mainPane" :class="{hidden: !shown.mainPane}">
              <TabGroup>
                <TabItem
                  v-for="item in Editors"
                  class="stayFit"
                  :key="item.ID"
                  :active="item.ID==selEdit"
                  :class="{hidden: !hasFile}"
                  :title="item.Path"
                  @click.native="Select(item.ID)"
                  @cancel="toClose(item.ID)">
                  {{item.Title}}{{item.Changed?"*":""}}
                </TabItem>
                <TabItem :fixed="true" icon="plus" @click.native="addNew">
                </TabItem>
              </TabGroup>
              <div class="expanded" :class="{hidden: !hasFile}" >
                <editor
                  ref="aceeditor"
                  v-model="content"
                  @init="editorInit"
                  lang="markdown"
                  theme="chrome"
                  @click.right.native="clkCtx"
                >
                </editor>
              </div>
            </div>
            <div id="altPane" :class="{hidden: !shown.altPane}" style="overflow-y:auto;">
              <div v-if="selEdit != ''" v-html="marked" :class="{hidden: selAlt != 'sRendu'}"></div>
              <div v-if="selEdit != ''" v-html="jshtm" :class="{hidden: selAlt != 'sFront'}"></div>
            </div>
          </VueSplit>
        </Pane>
      </PaneGroup>
    </WindowContent>
    <Toolbar type="footer"><span class="FFile stayFit pull-left">{{Footer}}</span><span :title="showCount" class="Details stayFit pull-right">{{count.words}} mots</span><span v-if="'objectif' in mattered.data" class="Details stayFit pull-right">{{objectif}}</span></Toolbar>
    <div class="hidden">{{hasMod}}</div>
  </Window>
</template>

<script>
import jthf from "json-to-html-form"
import VueSplit from "./VueSplit.vue";
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
      selEdit: '',
      precEdit: '',
      Editors: {},
      selAlt: "sRendu",
      shown: {
        sidebar: false,
        mainPane : true,
        altPane: false
      },
      CtxMenu: {},
      config: {
        showInvisibles: true,
        showFoldWidgets: true,
        showPrintMargin: true,
        useWrapMode: true
      }
    }
  },

  computed: {
    hasMod: function() {
      let vm = this;
      let mod = false;
      for(let item in vm.Editors) {
        if (vm.Editors[item].Changed) {
          mod = true;
        }
      }
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
    content: {
      get: function() {
        if (this.selEdit == '') return "";
        return this.Editors[this.selEdit].Content;
      },
      set: function(Content) {
        let Sel = this.selEdit;
        let Prc = this.precEdit;
        if ( Sel != "") {
          const org = this.Editors[Sel].Content;
          const stat = this.Editors[Sel].Changed;
          const Changed = stat || ( (Prc == Sel) && ( Content !== org ) );
          this.SetEdit( Sel, { Content, Changed } );
        }
      }
    },
    editor: function() {
      return this.$refs.aceeditor;
    },
    mattered: function() {
      return matter(this.content);
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
      if (this.shown.mainPane) {
        res.push('#mainPane');
      }
      if (this.shown.altPane) {
        res.push('#altPane');
      }
      return res;
    }
  },

  methods: {
    SetEdit: function(ID, ext) {
      this.$set( this.Editors, ID, Object.assign(this.Editors[ID] || {}, ext) );
    },
    waitNext: function() {
      this.$nextTick(() => {
          this.editor.editor.focus();
      });
    },
    Resize: function(cb) {
      this.$nextTick(() => {
        this.editor.editor.resize();
        this.editor.editor.focus();
        if (cb) {
          cb();
        }
      })
    },
    makeBold: function() {
      let selection = this.editor.editor.getSelection();
      if (! selection.isEmpty()) {
          let selectedRange = this.editor.editor.getSelectionRange();
          let selectedText = this.editor.editor.getSession().getDocument().getTextRange(selectedRange);
          this.editor.editor.getSession().getDocument().replace(selectedRange, `**${selectedText}**`);
      } else {
          this.editor.editor.insert('**GRAS**');
      }
      this.waitNext();
    },
    makeItal: function() {
      let selection = this.editor.editor.getSelection();
      if (! selection.isEmpty()) {
          let selectedRange = this.editor.editor.getSelectionRange();
          let selectedText = this.editor.editor.getSession().getDocument().getTextRange(selectedRange);
          this.editor.editor.getSession().getDocument().replace(selectedRange, `_${selectedText}_`);
      } else {
          this.editor.editor.insert('*_ITAL_');
      }
      this.waitNext();
    },
    shellGo: function(empty,full) {
      let selection = this.editor.editor.getSelection();
      if (! selection.isEmpty()) {
        let selectedRange = this.editor.editor.getSelectionRange();
        let selectedText = this.editor.editor.getSession().getDocument().getTextRange(selectedRange);
        shell.openExternal(full + selectedText);
      } else {
        shell.openExternal(empty)
      }
      this.waitNext();
    },
    clkCtx: function() {
      this.CtxMenu.popup({window: getCurrentWindow()})
      this.waitNext();
    },
    addNew: function() {
      let vm = this;
      var ID = nanoid();
      vm.SetEdit( ID, {
        ID: ID,
        Title: "Untitled",
        Path: "Untitled",
        New: true,
        Changed: true,
        Content: ""
      });
      vm.selEdit = ID;
      vm.Resize( () => { vm.precEdit = ID })
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
      vm.$delete( vm.Editors, ID );
      vm.Resize( () => { vm.precEdit = Sel })
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
              fs.writeFile(fileName, Item.Content, function(err, data) {
                vm.SetEdit( Sel, { New: false, Changed: false, Title: path.basename(fileName), Path: fileName })
              });
            }
          } else {
            // eslint-disable-next-line
            fs.writeFile(Item.Path, Item.Content, function(err, data) {
                vm.SetEdit( Sel, { Changed: false })
            });
          }
          vm.waitNext();
        }
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
          vm.SetEdit( ID, {
            ID: ID,
            Title: path.basename(ID),
            Path: ID,
            New: false,
            Changed: false,
            Content: data
          });
          vm.selEdit = ID;
          vm.Resize( () => { vm.precEdit = ID })
        });
      }
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
      vm.Resize( () => { vm.precEdit = id })
    },
    SelAlt: function(sel) {
      this.selAlt = sel;
      window.localStorage.setItem('SelAlt', sel);
      this.Resize();
    },
    Unshow: function(show) {
      this.shown[show] = !this.shown[show];
      window.localStorage.setItem('Shown', JSON.stringify(this.shown));
      if (this.selEdit != "") {
        this.Resize();
      }
    },
    Unconfig: function(conf) {
      this.config[conf] = !this.config[conf];
      window.localStorage.setItem('Config', JSON.stringify(this.config));
      this.Reconfig();
    },
    Reconfig: function() {
      let editor = this.editor.editor;
      editor.setWrapBehavioursEnabled(true);
      editor.setShowInvisibles(this.config.showInvisibles);
      editor.setShowFoldWidgets(this.config.showFoldWidgets);
      editor.setShowPrintMargin(this.config.showPrintMargin);
      editor.getSession().setUseWrapMode(this.config.useWrapMode);
      editor.getSession().setUseSoftTabs(true);
      this.waitNext();
    }
  },

  components: {
    VueSplit, Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions, ButtonGroup, Button, Icon, TabGroup, TabItem,
    editor: require('vue2-ace-editor')
  },

  mounted: function () {
    var vm = this;

    var StoredShown = window.localStorage.getItem('Shown');
    if (StoredShown != null) {
      vm.shown = Object.assign(vm.shown, JSON.parse(StoredShown))
    }
    var StoredConfig = window.localStorage.getItem('Config');
    if (StoredConfig != null) {
      vm.config = Object.assign(vm.config, JSON.parse(StoredConfig))
      vm.Reconfig();
    }
    var StoredAlt = window.localStorage.getItem('SelAlt');
    if (StoredAlt != null) {
      vm.selAlt = StoredAlt;
    }

    ipcRenderer.on('closing', function() {
      ipcRenderer.send('ok-to-close');
    });

    vm.$nextTick(function () {
      const template = [
        {
          label: 'Fichier',
            submenu: [
              { label:'Nouveau Fichier', accelerator: 'CommandOrControl+N', click: vm.addNew },
              { label:'Ouvrir Fichier', accelerator: 'CommandOrControl+O', click: vm.toLoad },
              { label:'Enregistrer', accelerator: 'CommandOrControl+S', click: vm.toSave },
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
