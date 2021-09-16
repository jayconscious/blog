<template>
  <div>
    <span class="haha">
      {{ msg }}
    </span>
  </div>
</template>

<script>
export default {
  props: {},
  components: {},
  data() {
    return {
      msg: "haha哈阿sds",
    };
  },
  computed: {},
  created() {},
  mounted() {},
  watch: {},
  methods: {},
};
</script>

<style scoped lang="scss">
.haha {
  color: red;
}
</style>
