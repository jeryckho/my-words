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
      </ToolbarActions>
    </Toolbar>
    <WindowContent>
        <PaneGroup>
          <Pane size="mini" :sidebar="true" :class="{invisible: !shown.sidebar}">sidebar</Pane>
          <Pane>
            <VueSplit
              :elements="panes"
              direction="horizontal"
              :min-size="100"
              :gutter-size="10"
              :snap-offset="50"
            >
              <div id="mainPane" :class="{invisible: !shown.mainPane}">
                <TabGroup>
                  <TabItem :active="true">
                    Test 1
                  </TabItem>                  
                  <TabItem>
                    Test 2
                  </TabItem>                  
                  <TabItem :fixed="true" icon="plus">
                  </TabItem>                  
                </TabGroup>
                <editor
                  v-model="content"
                  @init="editorInit"
                  lang="markdown"
                  theme="chrome"
                  width="100%"
                  height="100%"
                >
                </editor>
              </div>
              <div id="altPane" class="hello" :class="{invisible: !shown.altPane}" style="overflow-y:auto;">
                <div v-html="marked"></div>
              </div>
            </VueSplit>
          </Pane>
        </PaneGroup>
      </WindowContent>
    <Toolbar type="footer" title="Footer"></Toolbar>
</Window>
</template>

<script>
import VueSplit from "./VueSplit.vue";
import { Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions, ButtonGroup, Button, Icon, TabGroup, TabItem } from "vue-photonkit";
import Marked from "marked"

export default {
  name: "MainWindow",
  props: {
    msg: String
  },
  data: () => ({
    content: "",
    shown: {
      sidebar: true,
      mainPane : true,
      altPane: true
    }
  }),
  computed: {
    marked: function () {
      return Marked(this.content);
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
      editorInit: function () {
          require('brace/ext/language_tools') //language extension prerequsite...
          require('brace/mode/markdown')    //language
          require('brace/theme/chrome')
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
.invisible {
  display: none;
}
</style>
