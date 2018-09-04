<template>
  <window>
    <toolbar type="header" title="Header">
      <toolbar-actions>

      </toolbar-actions>
    </toolbar>
    <window-content>
        <pane-group>
          <pane size="mini" :sidebar="true" style="display:block">sidebar</pane>
          <pane>
            <vue-split
              :elements="panes"
              direction="horizontal"
              :min-size="100"
              :gutter-size="10"
              :snap-offset="50"
            >
              <div id="mainPane" class="hello">
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
              <div id="altPane">
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
            </vue-split>
          </pane>
        </pane-group>
      </window-content>
    <toolbar type="footer" title="Footer"></toolbar>
</window>
</template>

<script>
import VueSplit from "vue-splitjs";
import { Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions } from "vue-photonkit";
export default {
  name: "HelloWorld",
  props: {
    msg: String
  },
  data: () => ({
    panes: ["#mainPane", "#altPane"]
  }),
  components: { VueSplit, Window, WindowContent, PaneGroup, Pane, Toolbar, ToolbarActions }
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
</style>
