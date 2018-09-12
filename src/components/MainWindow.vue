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
          <Button size="sm" :active="selAlt=='sRendu'" @click.native="selAlt='sRendu'">
            <Icon icon="doc-text"></Icon>
          </Button>
          <Button size="sm" :active="selAlt=='sFront'" @click.native="selAlt='sFront'">
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
              <div v-html="marked" :class="{hidden: selAlt != 'sRendu'}"></div>
              <div v-html="jshtm" :class="{hidden: selAlt != 'sFront'}"></div>
            </div>
          </VueSplit>
        </Pane>
      </PaneGroup>
    </WindowContent>
    <Toolbar type="footer"><span class="FFile stayFit pull-left">{{Footer}}</span><span :title="showCount" class="FFile stayFit pull-right">{{count.words}} mots</span></Toolbar>
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
import { remote } from "electron"
const { getCurrentWindow, dialog, Menu, shell } = remote

export default {
  name: "MainWindow",

  props: {
    msg: String
  },

  data() {
    return {
      selEdit: '',
      Editors: {},
      selAlt: "sRendu",
      shown: {
        sidebar: false,
        mainPane : true,
        altPane: false
      },
      config: {
        showInvisibles: true,
        showFoldWidgets: true,
        showPrintMargin: true,
        useWrapMode: true
      }
    }
  },

  computed: {
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
      set: function(value) {
        let Sel = this.selEdit;
        if ( Sel != "") {
          const org = this.Editors[Sel].Content;
          const stat = this.Editors[Sel].Changed;
          this.SetEdit( Sel, { Content: value, Changed: stat||(value !== org)  } )
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
    clkCtx: function() {
      let selAlt = this.editor.editor.getSelection();
      if (! selAlt.isEmpty()) {
          let selectedRange = this.editor.editor.getSelectionRange();
          let selectedText = this.editor.editor.getSession().getDocument().getTextRange(selectedRange);
          this.editor.editor.getSession().getDocument().replace(selectedRange, `**${selectedText}**`);
      } else {
          this.editor.editor.insert('**GRAS**');
      }
      this.waitNext();
    },
    addNew: function() {
      var ID = nanoid();
      this.SetEdit( ID, {
        ID: ID,
        Title: "Untitled",
        Path: "Untitled",
        New: true,
        Changed: true,
        Content: ""
      });
      this.selEdit = ID;
      this.waitNext();
    },
    toClose: function(ID) {
      let Sel = "";
      for(let item in this.Editors) {
        if (item != ID ) {
          Sel = item;
        }
      }
      this.selEdit = Sel;
      this.$delete( this.Editors, ID );
      this.waitNext();
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
          vm.waitNext();
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
      this.selEdit = id;
      this.waitNext();
    },
    Unshow: function(show) {
      this.shown[show] = !this.shown[show];
      if (this.selEdit != "") {
        this.waitNext();
      }
    },
    Unconfig: function(conf) {
      this.config[conf] = !this.config[conf];
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
    this.$nextTick(function () {
      const template = [
        {
          label: 'Fichier',
            submenu: [
              { label:'Nouveau Fichier', accelerator: 'CommandOrControl+N', click: this.addNew },
              { label:'Ouvrir Fichier', accelerator: 'CommandOrControl+O', click: this.toLoad },
              { label:'Enregistrer', accelerator: 'CommandOrControl+S', click: this.toSave },
              {type: 'separator'},
              { label:'Quitter', role: 'quit'}
          ]
        },
        {
          label: 'Modifier',
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
</style>
