<template>
  <Window>
    <Toolbar type="header" title="Header">
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
                  <TabItem :active="true" :class="{hidden: !hasFile}">
                    Untitled
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
    <Toolbar type="footer" title="Footer"></Toolbar>
</Window>
</template>

<script>
import jthf from "json-to-html-form"
import VueSplit from "./VueSplit.vue";
import { Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions, ButtonGroup, Button, Icon, TabGroup, TabItem } from "vue-photonkit";
import * as matter from 'gray-matter';
import Marked from "marked"

export default {
  name: "MainWindow",
  props: {
    msg: String
  },
  data() {
    return {
      hasFile: false,
      content: "",
      selected: "sRendu",
      shown: {
        sidebar: false,
        mainPane : true,
        altPane: false
      }
    }
  },
  computed: {
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
      addNew: function() {
        this.hasFile = true;
        this.$nextTick(() => {
            this.editor.editor.focus();
        });
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
