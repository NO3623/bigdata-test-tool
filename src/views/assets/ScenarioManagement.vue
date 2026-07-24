<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title-wrap">
        <svg class="page-illustration" viewBox="0 0 48 48" width="36" height="36">
          <rect x="6" y="8" width="36" height="32" rx="6" fill="#ebebff" stroke="#6662fe" stroke-width="1.5"/>
          <line x1="10" y1="18" x2="38" y2="18" stroke="#6662fe" stroke-width="2" stroke-linecap="round"/>
          <line x1="10" y1="24" x2="30" y2="24" stroke="#b0adff" stroke-width="2" stroke-linecap="round"/>
          <line x1="10" y1="30" x2="34" y2="30" stroke="#b0adff" stroke-width="2" stroke-linecap="round"/>
          <circle cx="38" cy="24" r="5" fill="#6662fe" opacity="0.15"/>
          <path d="M36 22l2 2 4-4" fill="none" stroke="#6662fe" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h1 class="page-title">场景管理</h1>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="showAddDialog">新增场景</el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="keyword" placeholder="场景关键词" clearable style="width:260px" @keyup.enter.native="handleSearch" />
      <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="filteredScenarios" stripe style="width:100%" @row-click="handleRowClick" highlight-current-row>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="name" label="场景名" min-width="180" />
        <el-table-column prop="description" label="场景描述" min-width="300" show-overflow-tooltip />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" icon="el-icon-edit" @click.stop="showEditDialog(row)">编辑</el-button>
            <el-button type="text" size="mini" icon="el-icon-delete" style="color:#ef4444" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="isEdit ? '编辑场景' : '新增场景'" :visible.sync="dialogVisible" width="520px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="场景名" prop="name">
          <el-input v-model="form.name" placeholder="请输入场景名" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="场景描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入场景描述" />
        </el-form-item>
        <el-form-item label="创建时间" v-if="isEdit">
          <span>{{ form.createdAt }}</span>
        </el-form-item>
        <el-form-item label="更新时间">
          <span>{{ now }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mockScenarios } from "@/utils/mock"

export default {
  name: "ScenarioManagement",
  data() {
    return {
      scenarios: JSON.parse(JSON.stringify(mockScenarios)),
      keyword: "",
      isEdit: false,
      editingId: null,
      dialogVisible: false,
      form: { name: "", description: "" },
      rules: {
        name: [
          { required: true, message: "请输入场景名", trigger: "blur" },
          { validator: (rule, value, cb) => {
            const dup = this.scenarios.find(s => s.name === value && s.id !== this.editingId)
            if (dup) return cb(new Error("场景名已存在"))
            cb()
          }, trigger: "blur" }
        ],
        description: [{ required: true, message: "请输入场景描述", trigger: "blur" }]
      }
    }
  },
  computed: {
    now() { return new Date().toISOString().slice(0, 19).replace("T", " ") },
    filteredScenarios() {
      if (!this.keyword) return this.scenarios
      const kw = this.keyword.toLowerCase()
      return this.scenarios.filter(s => s.name.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw))
    }
  },
  methods: {
    showAddDialog() { this.isEdit = false; this.editingId = null; this.form = { name: "", description: "" }; this.dialogVisible = true; this.$nextTick(() => this.$refs.form?.clearValidate()) },
    showEditDialog(row) { this.isEdit = true; this.editingId = row.id; this.form = { name: row.name, description: row.description, createdAt: row.createdAt }; this.dialogVisible = true; this.$nextTick(() => this.$refs.form?.clearValidate()) },
    handleSearch() {},
    resetSearch() { this.keyword = "" },
    handleRowClick(row) { this.showEditDialog(row) },
    handleSave() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const time = this.now
        if (this.isEdit) {
          const idx = this.scenarios.findIndex(s => s.id === this.editingId)
          if (idx > -1) Object.assign(this.scenarios[idx], this.form, { updatedAt: time })
          this.$message.success("已更新")
        } else {
          this.scenarios.unshift({ id: `_${Math.random().toString(36).slice(2,9)}`, ...this.form, updatedAt: time, createdAt: time })
          this.$message.success("已创建")
        }
        this.dialogVisible = false
      })
    },
    handleDelete(row) {
      this.$confirm("确认删除该场景？", "提示", { type: "warning" }).then(() => {
        this.scenarios = this.scenarios.filter(s => s.id !== row.id)
        this.$message.success("已删除")
      }).catch(() => {})
    }
  }
}
</script>
