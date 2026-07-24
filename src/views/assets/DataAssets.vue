<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title-wrap">
        <svg class="page-illustration" viewBox="0 0 48 48" width="36" height="36">
          <rect x="4" y="6" width="40" height="28" rx="5" fill="#ebebff" stroke="#6662fe" stroke-width="1.5"/>
          <path d="M4 16h40" stroke="#6662fe" stroke-width="1.5"/>
          <line x1="10" y1="10" x2="18" y2="10" stroke="#6662fe" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="26" y1="10" x2="34" y2="10" stroke="#6662fe" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="8" y="20" width="14" height="6" rx="3" fill="#b0adff" opacity="0.5"/>
          <rect x="26" y="20" width="16" height="6" rx="3" fill="#d2d0ff" opacity="0.5"/>
          <rect x="8" y="27" width="10" height="5" rx="3" fill="#d2d0ff" opacity="0.5"/>
        </svg>
        <h1 class="page-title">数据资产</h1>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="showAddDialog">新建资产</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.scenarioName" placeholder="场景名" clearable style="width:150px">
        <el-option v-for="s in scenarios" :key="s.name" :label="s.name" :value="s.name" />
      </el-select>
      <el-select v-model="filters.version" placeholder="版本号" clearable style="width:120px">
        <el-option v-for="v in versions" :key="v" :label="v" :value="v" />
      </el-select>
      <el-input v-model="filters.tableName" placeholder="表名" clearable style="width:160px" />
      <el-select v-model="filters.creator" placeholder="创建人" clearable style="width:120px">
        <el-option label="张三" value="张三" />
        <el-option label="李四" value="李四" />
        <el-option label="王五" value="王五" />
      </el-select>
      <el-select v-model="filters.shared" placeholder="是否共享" clearable style="width:120px">
        <el-option label="是" :value="true" />
        <el-option label="否" :value="false" />
      </el-select>
      <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="filteredAssets" stripe style="width:100%">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="scenarioName" label="场景名" width="160" />
        <el-table-column prop="appName" label="应用名" width="140" />
        <el-table-column prop="env" label="环境@数据库" width="160" />
        <el-table-column prop="version" label="版本号" width="100" />
        <el-table-column prop="tableName" label="表名" width="180" show-overflow-tooltip />
        <el-table-column prop="assetValue" label="资产价值" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="row.assetValue === '高' ? 'danger' : row.assetValue === '中' ? 'warning' : 'info'" size="small">{{ row.assetValue }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="shared" label="是否共享" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="row.shared ? 'success' : 'info'" size="small">{{ row.shared ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" icon="el-icon-view" @click="handleView(row)">查看</el-button>
            <el-button type="text" size="mini" icon="el-icon-delete" style="color:#ef4444" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="新建数据资产" :visible.sync="dialogVisible" width="600px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="场景名" prop="scenarioName">
          <el-select v-model="form.scenarioName" placeholder="请选择场景" style="width:100%">
            <el-option v-for="s in scenarios" :key="s.name" :label="s.name" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用名" prop="appName">
          <el-input v-model="form.appName" placeholder="如 risk-engine" />
        </el-form-item>
        <el-form-item label="环境@数据库名" prop="env">
          <el-input v-model="form.env" placeholder="如 test@risk_db" />
        </el-form-item>
        <el-form-item label="表名" prop="tableName">
          <el-input v-model="form.tableName" placeholder="如 t_risk_rule_config" />
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-select v-model="form.version" placeholder="选择版本" style="width:100%">
            <el-option v-for="v in versions" :key="v" :label="v" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否共享">
          <el-switch v-model="form.shared" active-text="是" inactive-text="否" />
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
import { mockScenarios, mockDataAssets } from "@/utils/mock"

export default {
  name: "DataAssets",
  data() {
    return {
      scenarios: JSON.parse(JSON.stringify(mockScenarios)),
      assets: JSON.parse(JSON.stringify(mockDataAssets)),
      versions: ["v1.0.0", "v1.1.0", "v1.2.0", "v2.0.0", "v2.0.1"],
      filters: { scenarioName: "", version: "", tableName: "", creator: "", shared: null },
      dialogVisible: false,
      form: { scenarioName: "", appName: "", env: "", tableName: "", version: "", shared: false },
      rules: {
        scenarioName: [{ required: true, message: "请选择场景", trigger: "change" }],
        appName: [{ required: true, message: "请输入应用名", trigger: "blur" }],
        env: [{ required: true, message: "请输入环境@数据库名", trigger: "blur" }],
        tableName: [{ required: true, message: "请输入表名", trigger: "blur" }],
        version: [{ required: true, message: "请选择版本号", trigger: "change" }]
      }
    }
  },
  computed: {
    filteredAssets() {
      return this.assets.filter(a => {
        if (this.filters.scenarioName && a.scenarioName !== this.filters.scenarioName) return false
        if (this.filters.version && a.version !== this.filters.version) return false
        if (this.filters.tableName && !a.tableName.toLowerCase().includes(this.filters.tableName.toLowerCase())) return false
        if (this.filters.creator && a.creator !== this.filters.creator) return false
        if (this.filters.shared !== null && a.shared !== this.filters.shared) return false
        return true
      })
    }
  },
  methods: {
    showAddDialog() { this.form = { scenarioName: "", appName: "", env: "", tableName: "", version: "", shared: false }; this.dialogVisible = true; this.$nextTick(() => this.$refs.form?.clearValidate()) },
    handleSearch() {},
    resetSearch() { this.filters = { scenarioName: "", version: "", tableName: "", creator: "", shared: null } },
    handleView(row) { this.$router.push({ name: "DataAssetDetail", params: { id: row.id } }) },
    handleSave() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const time = new Date().toISOString().slice(0, 19).replace("T", " ")
        this.assets.unshift({ id: `_${Math.random().toString(36).slice(2,9)}`, ...this.form, assetValue: "中", creator: "当前用户", updatedAt: time, createdAt: time })
        this.dialogVisible = false
        this.$message.success("已创建")
      })
    },
    handleDelete(row) {
      this.$confirm("确认删除该数据资产？", "提示", { type: "warning" }).then(() => {
        this.assets = this.assets.filter(a => a.id !== row.id)
        this.$message.success("已删除")
      }).catch(() => {})
    }
  }
}
</script>
