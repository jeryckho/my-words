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
          walkdir.sync(vm.folder, (path, stat) => resolve(path))
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
