<template lang="html">
  <div class="split-container">
    {{paths}}
  </div>
</template>

<script type="text/javascript">
import walkdir from "walkdir"

export default {
  name: "VueTree",
  data: function() {
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

  asyncComputed: {
    paths: {
      get () {
        let vm = this;
        return new Promise((resolve, reject) => {
          let lg = vm.folder.length + 1;
          let pts = [];
          let walk = walkdir(vm.folder);
          walk.on("path", (path) => { pts.push(path.slice(lg)) })
          walk.on("end", () => resolve(pts));
          walk.on("error", (err)=> reject(err))
        })
      },
      default: "-"
    }
  },

  mounted () {
  },

  updated () {
  },

  methods: {
  }
}
</script>

<style>
</style>
