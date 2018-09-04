<template>
  <Window>
    <Toolbar type="header" title="Header">
      <ToolbarActions>
        <ButtonGroup class="pull-left">
          <Button size="sm" :active="shown.sidebar" @click.native="shown.sidebar = !shown.sidebar">
            <Icon icon="home"></Icon>
          </Button>
          <Button size="sm" :active="shown.mainPane" @click.native="shown.mainPane = !shown.mainPane">
            <Icon icon="home"></Icon>
          </Button>
          <Button size="sm" :active="shown.altPane" @click.native="shown.altPane = !shown.altPane">
            <Icon icon="home"></Icon>
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
              <div id="mainPane" class="hello" :class="{invisible: !shown.mainPane}">
                <h1>{{ msg }}</h1>
                <p>
                  For guide and recipes on how to configure / customize this project,<br>
                  check out the
                  <a href="https://cli.vuejs.org" target="_blank" rel="noopener">vue-cli documentation</a>.
                </p>
                <h3>Installed CLI Plugins</h3>
                <ul>
                  <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel" target="_blank" rel="noopener">babel</a></li>
                  <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint" target="_blank" rel="noopener">eslint</a></li>
                </ul>
              </div>
              <div id="altPane" :class="{invisible: !shown.altPane}">
                <h3>Essential Links</h3>
                <ul>
                  <li><a href="https://vuejs.org" target="_blank" rel="noopener">Core Docs</a></li>
                  <li><a href="https://forum.vuejs.org" target="_blank" rel="noopener">Forum</a></li>
                  <li><a href="https://chat.vuejs.org" target="_blank" rel="noopener">Community Chat</a></li>
                  <li><a href="https://twitter.com/vuejs" target="_blank" rel="noopener">Twitter</a></li>
                  <li><a href="https://news.vuejs.org" target="_blank" rel="noopener">News</a></li>
                </ul>
                <h3>Ecosystem</h3>
                <ul>
                  <li><a href="https://router.vuejs.org" target="_blank" rel="noopener">vue-router</a></li>
                  <li><a href="https://vuex.vuejs.org" target="_blank" rel="noopener">vuex</a></li>
                  <li><a href="https://github.com/vuejs/vue-devtools#vue-devtools" target="_blank" rel="noopener">vue-devtools</a></li>
                  <li><a href="https://vue-loader.vuejs.org" target="_blank" rel="noopener">vue-loader</a></li>
                  <li><a href="https://github.com/vuejs/awesome-vue" target="_blank" rel="noopener">awesome-vue</a></li>
                </ul>
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
import { Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions, ButtonGroup, Button, Icon } from "vue-photonkit";
export default {
  name: "MainWindow",
  props: {
    msg: String
  },
  data: () => ({
    shown: {
      sidebar: true,
      mainPane : true,
      altPane: true
    }
  }),
  computed: {
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
  components: { VueSplit, Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions, ButtonGroup, Button, Icon }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.invisible {
  display: none;
}
</style>
