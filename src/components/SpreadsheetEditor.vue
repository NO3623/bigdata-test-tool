<template>
  <div class="spreadsheet-editor" ref="editor">
    <div ref="container" class="spreadsheet-container" />
  </div>
</template>

<script>
import Spreadsheet from "x-data-spreadsheet"

function getWidth(el) {
  if (!el) return 800
  return el.clientWidth - 2 || 800
}

export default {
  name: "SpreadsheetEditor",
  props: {
    value: { type: Array, default: () => [] },
    readonly: { type: Boolean, default: false },
    height: { type: Number, default: 500 },
    showToolbar: { type: Boolean, default: true }
  },
  data() { return { instance: null } },
  watch: {
    value: {
      handler(val) {
        if (this.instance && val) this.loadData(val)
      },
      deep: true
    }
  },
  mounted() {
    this.initSpreadsheet()
    window.addEventListener("resize", this.$_onResize)
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.$_onResize)
    if (this.instance) {
      try { this.instance = null } catch (e) {}
    }
  },
  methods: {
    initSpreadsheet() {
      const { arrToSheetData, sheetDataToArr } = require("@/utils/spreadsheet")
      this.$_converter = { arrToSheetData, sheetDataToArr }
      const w = getWidth(this.$refs.editor)

      this.instance = new Spreadsheet(this.$refs.container, {
        mode: this.readonly ? "read" : "edit",
        showToolbar: this.showToolbar,
        showGrid: true,
        showContextmenu: !this.readonly,
        view: {
          height: () => this.height,
          width: () => getWidth(this.$refs.editor)
        },
        row: { len: 100, height: 28 },
        col: { len: 26, width: 100, indexWidth: 50, minWidth: 60 }
      })

      this.instance.change(data => {
        const arr = this.$_converter.sheetDataToArr(data)
        this.$emit("input", arr)
        this.$emit("change", arr)
      })

      if (this.value && this.value.length > 0) this.loadData(this.value)
    },
    $_onResize() { this.$forceUpdate() },
    loadData(arr) {
      if (!this.instance || !arr) return
      const sd = this.$_converter.arrToSheetData(arr)
      if (sd) this.instance.loadData(sd)
    },
    getData() {
      if (!this.instance) return []
      return this.$_converter.sheetDataToArr(this.instance.getData())
    }
  }
}
</script>

<style>
.x-spreadsheet { width: 100% !important; }
.x-spreadsheet-toolbar { width: 100% !important; }
.x-spreadsheet-bottombar { width: 100% !important; }
.x-spreadsheet-overlayer { width: 100% !important; }
</style>

<style scoped>
.spreadsheet-editor { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; width: 100%; }
.spreadsheet-container { width: 100%; min-height: 300px; }
</style>
