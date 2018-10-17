<template lang="html">
    <SlVueTree
      v-model="paths"
      @nodeclick="nodeClick"
      @nodecontextmenu="nodeContextMenu">
      <template slot="toggle" slot-scope="{ node }">
        <span v-if="!node.isLeaf">
          <Icon icon="right-open" v-if="!node.isExpanded"></Icon>
          <Icon icon="down-open"  v-else-if="node.isExpanded"></Icon>
        </span>
      </template> 
    </SlVueTree>
</template>

<script type="text/javascript">
import walkdir from "walkdir"
import path from 'path';
import pathDirectories from 'path-directories';
import SlVueTree from 'sl-vue-tree'
import { Icon } from "vue-photonkit";

export default {
  name: "VueTree",
  components: {
    SlVueTree, Icon
  },

  data() {
    return {
      
    }
  },

  props: {
    folder: {
      // Folder Name.
      type: String,
      default: ''
    },
  },

  methods: {
    nodeClick: function(node, event) {
      let vm = this;
      if (node.isLeaf) {
        vm.$emit('clicknode', event, node);
      }
    },
    nodeContextMenu: function(node, event) {
      let vm = this;
      if (node.isLeaf) {
        vm.$emit('contextmenunode', event, node);
      }
    },
    sortTree: function(a,b) {
      if (a.data.type === b.data.type) {
        if (a.title > b.title) { return 1; }
        if (a.title < b.title) { return -1; }
        return 0;
      } else {
        if (a.data.type === "DIRECTORY") { return -1; }
        else { return 1; }
      }
    }
  },

  asyncComputed: {
    paths: {
      get () {
        let vm = this;
        return new Promise((resolve, reject) => {
          let F = pathDirectories(vm.folder).length+1;

          let lstPath = [];
          let walk = walkdir(vm.folder);
          walk.on("path", (locPath, stat) => {
            const base = path.basename(locPath);
            const Dirs = pathDirectories(locPath).slice(F);
            let curnodes = lstPath;
            for (let dir of Dirs) {
              if (dir === '.') continue;
              let found = undefined;
              for (let cur of curnodes) {
                if (cur.isLeaf === false && cur.title === dir) {
                  found = cur;
                  break;
                }
              }
              if (!found) {
                let newnode = {
                  title: dir, 
                  isLeaf: false, 
                  isExpanded: false,
                  isDraggable: false,
                  isSelectable: false,
                  children: [], 
                  data: { 
                      type: "DIRECTORY",
                      pathname: locPath, 
                      // stat 
                  }
                };
                curnodes.push(newnode);
                curnodes = newnode.children;
              } else {
                curnodes = found.children;
              }
            }
            let newnode = {
              title: base, 
              isLeaf: stat.isFile(), 
              isExpanded: stat.isFile(),
              isDraggable: false,
              isSelectable: false,
              data: { 
                type: stat.isFile() ? "text/plain" : "DIRECTORY",
                pathname: locPath,
                // stat
              }
            }; 
            if (!newnode.isLeaf) newnode.children = [];
            curnodes.push(newnode)
            curnodes.sort(this.sortTree)
          })
          walk.on("end", () => resolve(lstPath));
          walk.on("error", (err)=> reject(err))
        })
      },
      default: []
    }
  },

  mounted () {
  },

  updated () {
  }
}
</script>

<style>
.vue-file-tree-contextmenu {
    position: absolute;
    background-color: white;
    color: black;
    border-radius: 2px;
    cursor: pointer;
}

.vue-file-tree-contextmenu > div {
    padding: 10px;
}

.vue-file-tree-contextmenu > div:hover {
    background-color: rgba(100, 100, 255, 0.5);
}

#vue-file-tree {
    height: 100%;
}

.sl-vue-tree {
    position: relative;
    cursor: default;
    user-select: none;
}

.sl-vue-tree.sl-vue-tree-root {
    /* border: 1px solid rgb(9, 22, 29);
    background-color: rgb(9, 22, 29);
    color: rgba(255, 255, 255, 0.5);
    border-radius: 3px; */
}

.sl-vue-tree-root > .sl-vue-tree-nodes-list {
    overflow: hidden;
    position: relative;
    padding-bottom: 4px;
}

.sl-vue-tree-selected > .sl-vue-tree-node-item {
    /* background-color: #13242d;
    color: white; */
}

.sl-vue-tree-node-item:hover,
.sl-vue-tree-node-item.sl-vue-tree-cursor-hover {
    /* color: white; */
}

.sl-vue-tree-node-item {
    position: relative;
    display: flex;
    flex-direction: row;

    padding-left: 10px;
    padding-right: 10px;
    line-height: 28px;
    border: 1px solid transparent;
}

.sl-vue-tree-node-item.sl-vue-tree-cursor-inside {
    /* border: 1px solid rgba(255, 255, 255, 0.5); */
}

.sl-vue-tree-gap {
    width: 15px;
    min-height: 1px;

}

.sl-vue-tree-toggle {
    display: inline-block;
    text-align: left;
    width: 10px;
}

.sl-vue-tree-sidebar {
    margin-left: auto;
}

.sl-vue-tree-cursor {
    position: absolute;
    /* border: 1px solid rgba(255, 255, 255, 0.5); */
    height: 1px;
    width: 100%;
}

.sl-vue-tree-drag-info {
    position: absolute;
    background-color: rgba(0,0,0,0.5);
    opacity: 0.5;
    margin-left: 20px;
    padding: 5px 10px;
}
</style>
