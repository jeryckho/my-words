<template lang="html">
  <div class="split-container">
    {{folder}}
  </div>
</template>

<script type="text/javascript">

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
