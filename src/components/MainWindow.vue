<template>
  <Window>
    <Toolbar type="header">
      <ToolbarActions>
        <ButtonGroup class="pull-left">
          <Button size="sm" :active="!shown.sidebar" @click.native="shown.sidebar = !shown.sidebar">
            <Icon icon="folder"></Icon>
          </Button>
          <Button size="sm" :active="!shown.mainPane" @click.native="shown.mainPane = !shown.mainPane">
            <Icon icon="quote"></Icon>
          </Button>
          <Button size="sm" :active="!shown.altPane" @click.native="shown.altPane = !shown.altPane">
            <Icon icon="tools"></Icon>
          </Button>
        </ButtonGroup>
        <ButtonGroup class="pull-right"  :class="{hidden: !shown.altPane}">
          <Button size="sm" :active="selected=='sRendu'" @click.native="selected='sRendu'">
            <Icon icon="doc-text"></Icon>
          </Button>
          <Button size="sm" :active="selected=='sFront'" @click.native="selected='sFront'">
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
                    v-for="item in List"
                    :key="item.ID"
                    :active="item.ID == current"
                    :class="{hidden: !hasFile}"
                    @click.native="current=item.ID"
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
                    width="100%"
                    height="100%"
                    @click.right.native="clkCtx"
                  >
                  </editor>
                </div>
              </div>
              <div id="altPane" :class="{hidden: !shown.altPane}" style="overflow-y:auto;">
                <div v-html="marked" :class="{hidden: selected != 'sRendu'}"></div>
                <div v-html="jshtm" :class="{hidden: selected != 'sFront'}"></div>
              </div>
            </VueSplit>
          </Pane>
        </PaneGroup>
      </WindowContent>
    <Toolbar type="footer" :title="Header"></Toolbar>
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
import { remote } from "electron"
const { getCurrentWindow, dialog, Menu } = remote

export default {
  name: "MainWindow",
  props: {
    msg: String
  },
  data() {
    return {
      current: '',
      List: {},
      selected: "sRendu",
      shown: {
        sidebar: false,
        mainPane : true,
        altPane: false
      }
    }
  },
  computed: {
    Header: function() {
        if (this.current == '') return "/";
        return this.List[this.current].Path;
    },
    hasFile: function() {
      return (Object.keys(this.List).length !== 0)
    },
    content: {
      get: function() {
        if (this.current == '') return "";
        return this.List[this.current].Content;
      },
      set: function(value) {
        let Crt = this.current;
        if ( Crt != "") {
          const org = this.List[Crt].Content;
          const stat = this.List[Crt].Changed;
          this.SetLst( Crt, { Content: value, Changed: stat||(value !== org)  } )
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
    SetLst: function(ID, ext) {
      this.$set( this.List, ID, Object.assign(this.List[ID] || {}, ext) );
    },
    waitNext: function() {
      this.$nextTick(() => {
          this.editor.editor.focus();
      });
    },
    clkCtx: function() {
      let selected = this.editor.editor.getSelection();
      if (! selected.isEmpty()) {
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
      this.SetLst( ID, {
        ID: ID,
        Title: "Untitled",
        Path: "Untitled",
        New: true,
        Changed: true,
        Content: ""
      });
      this.current = ID;
      this.waitNext();
    },
    toClose: function(ID) {
      let crt = "";
      for(let item in this.List) {
        if (item != ID ) {
          crt = item;
        }
      }
      this.current = crt;
      this.$delete( this.List, ID );
      this.waitNext();
    },
    toSave: function() {
      var vm = this;
      let Crt = vm.current;
      if (Crt != "") {
        let Item = vm.List[Crt];
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
                vm.SetLst( Crt, { New: false, Changed: false, Title: fileName, Path: fileName })
              });
            }
          } else {
            // eslint-disable-next-line
            fs.writeFile(Item.Path, Item.Content, function(err, data) {
                vm.SetLst( Crt, { Changed: false })
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
          vm.SetLst( ID, {
            ID: ID,
            Title: ID,
            Path: ID,
            New: false,
            Changed: false,
            Content: data
          });
          vm.current = ID;
          vm.$nextTick(() => {
              // vm.SetLst( ID, { Changed: false } )
              vm.editor.editor.focus();
          });
        });
      }
    },
    editorInit: function (editor) {
      require('brace/ext/language_tools') //language extension prerequsite...
      require('brace/mode/markdown')    //language
      require('brace/theme/chrome')
      editor.setWrapBehavioursEnabled(true);
      editor.setShowInvisibles(true);
      editor.setShowFoldWidgets(true);
      editor.setShowPrintMargin(true);
      editor.getSession().setUseWrapMode(true);
      editor.getSession().setUseSoftTabs(true);
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
  height: 100%;
}
</style>
