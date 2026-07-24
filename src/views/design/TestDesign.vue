<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title-wrap">
        <svg class="page-illustration" viewBox="0 0 48 48" width="36" height="36">
          <rect x="6" y="6" width="16" height="36" rx="4" fill="#ebebff" stroke="#6662fe" stroke-width="1.5"/>
          <rect x="26" y="6" width="16" height="36" rx="4" fill="#fff" stroke="#b0adff" stroke-width="1.5" stroke-dasharray="3 2"/>
          <line x1="10" y1="14" x2="18" y2="14" stroke="#6662fe" stroke-width="2" stroke-linecap="round"/>
          <line x1="10" y1="20" x2="16" y2="20" stroke="#b0adff" stroke-width="2" stroke-linecap="round"/>
          <line x1="10" y1="26" x2="18" y2="26" stroke="#b0adff" stroke-width="2" stroke-linecap="round"/>
          <path d="M22 24l4-4 4 4 4-4" fill="none" stroke="#6662fe" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h1 class="page-title">测试设计</h1>
      </div>
      <div>
        <el-button v-if="selectedProgram" icon="el-icon-arrow-left" @click="selectedProgram = null">返回清单</el-button>
        <el-button type="primary" icon="el-icon-upload" @click="showExecuteDialog" :disabled="confirmedPrograms.length === 0">执行已确认</el-button>
      </div>
    </div>

    <div class="filter-bar" v-if="!selectedProgram">
      <el-select v-model="filters.repo" placeholder="版本库（必选）" style="width:170px"><el-option v-for="r in repos" :key="r" :label="r" :value="r" /></el-select>
      <el-select v-model="filters.branch" placeholder="版本分支（必选）" style="width:200px"><el-option v-for="b in branches" :key="b" :label="b" :value="b" /></el-select>
      <el-input v-model="filters.programName" placeholder="程序名关键词" clearable style="width:180px" />
      <el-select v-model="filters.designStatus" placeholder="数据设计状态" clearable style="width:160px"><el-option label="草稿" value="草稿" /><el-option label="已确认" value="已确认" /></el-select>
      <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
    </div>

    <el-card shadow="never" v-if="!selectedProgram">
      <div slot="header">当期测试程序清单</div>
      <el-table :data="programList" stripe @row-click="handleProgramClick">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="#" width="45" />
        <el-table-column prop="programName" label="程序名" min-width="200" />
        <el-table-column prop="lastModifier" label="最近修改人" width="110" />
        <el-table-column prop="lastModifiedAt" label="最近修改时间" width="170" />
        <el-table-column prop="lastDesigner" label="最近设计人" width="110" />
        <el-table-column prop="lastDesignedAt" label="最近设计时间" width="170" />
        <el-table-column prop="designStatus" label="设计状态" width="110">
          <template slot-scope="{ row }"><span class="status-badge" :class="row.designStatus === '已确认' ? 'confirmed' : 'draft'">{{ row.designStatus }}</span></template>
        </el-table-column>
      </el-table>
    </el-card>

    <template v-if="selectedProgram">
      <el-card shadow="never" class="section-card">
        <div slot="header">
          <strong>{{ selectedProgram.programName }}</strong>
          <el-tag size="small" style="margin-left:8px">{{ selectedProgram.repo }}/{{ selectedProgram.branch }}</el-tag>
        </div>
        <el-tabs v-model="designTab">

          <!-- 作业内容 -->
          <el-tab-pane label="作业内容" name="jobs">
            <div class="lineage-row">
              <div class="lineage-col">
                <div class="lineage-col-header">
                  <span class="lineage-label">源表</span>
                  <span class="lineage-count">{{ (selectedProgram.sourceTables||[]).length }} 张</span>
                  <el-popover placement="bottom" width="260" trigger="click">
                    <el-select v-model="newSourceTable" placeholder="表名" filterable allow-create style="width:100%" @change="addSourceTable"><el-option v-for="tb in allTables" :key="tb" :label="tb" :value="tb" /></el-select>
                    <el-button slot="reference" size="mini" icon="el-icon-plus" circle />
                  </el-popover>
                </div>
                <div class="lineage-tags">
                  <el-tag v-for="(tb,ti) in selectedProgram.sourceTables" :key="ti" closable size="small" @close="selectedProgram.sourceTables.splice(ti,1)">{{ tb }}</el-tag>
                  <span v-if="!selectedProgram.sourceTables || selectedProgram.sourceTables.length===0" class="lineage-empty">暂无源表，点击 + 添加</span>
                </div>
              </div>
              <div class="lineage-arrow"><i class="el-icon-right" /></div>
              <div class="lineage-col">
                <div class="lineage-col-header">
                  <span class="lineage-label">目标表</span>
                  <span class="lineage-count">{{ (selectedProgram.targetTables||[]).length }} 张</span>
                  <el-popover placement="bottom" width="260" trigger="click">
                    <el-select v-model="newTargetTable" placeholder="表名" filterable allow-create style="width:100%" @change="addTargetTable"><el-option v-for="tb in allTables" :key="tb" :label="tb" :value="tb" /></el-select>
                    <el-button slot="reference" size="mini" icon="el-icon-plus" circle />
                  </el-popover>
                </div>
                <div class="lineage-tags">
                  <el-tag v-for="(tb,ti) in selectedProgram.targetTables" :key="ti" closable size="small" type="success" @close="selectedProgram.targetTables.splice(ti,1)">{{ tb }}</el-tag>
                  <span v-if="!selectedProgram.targetTables || selectedProgram.targetTables.length===0" class="lineage-empty">暂无目标表，点击 + 添加</span>
                </div>
              </div>
            </div>
            <div v-if="selectedProgram.hql" class="hql-block">
              <div class="hql-header"><i class="el-icon-document" /> {{ selectedProgram.programName }} — HQL 程序内容</div>
              <pre class="hql-code">{{ selectedProgram.hql }}</pre>
            </div>
          </el-tab-pane>

          <!-- 测试要点 -->
          <el-tab-pane label="测试要点" name="points">
            <div class="table-toolbar"><span /><el-button size="small" type="primary" icon="el-icon-plus" @click="addPoint">添加要点</el-button></div>
            <el-table :data="selectedProgram.testPoints" stripe size="small">
              <el-table-column type="index" label="#" width="45" />
              <el-table-column prop="point" label="测试要点" min-width="400">
                <template slot-scope="{ row, $index }">
                  <el-input v-if="editingPointIndex===$index" v-model="row.point" size="mini" @blur="editingPointIndex=-1" />
                  <span v-else @click="editingPointIndex=$index" style="cursor:pointer">{{ row.point }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="90"><template slot-scope="{ $index }"><el-button type="text" size="mini" icon="el-icon-delete" style="color:#ef4444" @click="deletePoint($index)" /></template></el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 测试断言 -->
          <el-tab-pane label="测试断言" name="assertions">
            <div class="assert-type-bar">
              <span class="assert-type-label">比对方式：</span>
              <el-radio-group v-model="selectedProgram.assertionType" size="small" @change="onAssertionTypeChange">
                <el-radio-button label="resultSet">结果集比对</el-radio-button>
                <el-radio-button label="flexible">灵活断言SQL比对</el-radio-button>
              </el-radio-group>
            </div>

            <template v-if="selectedProgram.assertionType === 'resultSet'">
              <div class="result-set-hint">
                <i class="el-icon-info" />
                <span>结果集比对：请在 <strong>测试数据</strong> 标签页中调整目标表的预期数据，系统将自动对比源表输出与目标表预期结果。</span>
              </div>
            </template>

            <template v-else>
              <div class="table-toolbar">
                <span style="font-weight:600;font-size:14px">断言列表（{{ selectedProgram.assertions.length }} 条）</span>
                <el-button size="small" type="primary" icon="el-icon-plus" @click="addAssertion">添加断言</el-button>
              </div>
              <el-table :data="selectedProgram.assertions" stripe size="small">
                <el-table-column type="index" label="#" width="45" />
                <el-table-column prop="name" label="断言名称" min-width="160">
                  <template slot-scope="{ row }"><el-input v-model="row.name" size="mini" placeholder="输入断言名称" /></template>
                </el-table-column>
                <el-table-column label="断言SQL" min-width="280">
                  <template slot-scope="{ row }"><el-input v-model="row.sql" size="mini" placeholder="SELECT ..." /></template>
                </el-table-column>
                <el-table-column label="比较符" width="110">
                  <template slot-scope="{ row }">
                    <el-select v-model="row.operator" size="mini" style="width:100%">
                      <el-option v-for="op in operators" :key="op" :label="op" :value="op" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="expect" label="预期值" min-width="140">
                  <template slot-scope="{ row }"><el-input v-model="row.expect" size="mini" placeholder="如 0" /></template>
                </el-table-column>
                <el-table-column label="操作" width="70">
                  <template slot-scope="{ $index }">
                    <el-button type="text" size="mini" icon="el-icon-delete" style="color:#ef4444" @click="deleteAssertion($index)" />
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-tab-pane>

          <!-- 测试数据 -->
          <el-tab-pane label="测试数据" name="data">
            <div class="ai-gen-banner" v-if="currentDataRows.length === 0">
              <i class="el-icon-warning" />
              <span>当前数据表暂无测试数据。测试数据由大模型自动生成，可能存在生成失败的情况，您也可以手动编辑。</span>
              <el-button size="mini" type="primary" plain :loading="aiGenerating" @click="generateData">AI 生成数据</el-button>
            </div>
            <div class="data-layout">
              <div class="data-sidebar">
                <div class="data-sidebar-header">数据表</div>
                <div class="data-sidebar-group">
                  <div class="data-sidebar-group-title">源表（{{ sourceTables.length }}）</div>
                  <div v-for="tb in sourceTables" :key="tb" class="data-sidebar-item" :class="{ active: currentDataTable === tb }" @click="selectDataTable(tb)">
                    <el-tag size="mini" type="warning">源</el-tag>
                    <span class="data-table-name">{{ tb }}</span>
                  </div>
                </div>
                <div class="data-sidebar-group">
                  <div class="data-sidebar-group-title">目标表（{{ targetTables.length }}）</div>
                  <div v-for="tb in targetTables" :key="tb" class="data-sidebar-item" :class="{ active: currentDataTable === tb }" @click="selectDataTable(tb)">
                    <el-tag size="mini" type="success">目标</el-tag>
                    <span class="data-table-name">{{ tb }}</span>
                  </div>
                </div>
              </div>
              <div class="data-main" :class="{ fullscreen: spreadsheetFullscreen }">
                <div class="data-main-toolbar">
                  <span class="data-main-title" v-if="currentDataTable">{{ currentDataTable }}</span>
                  <span class="data-main-title" v-else style="color:#94a3b8">请从左侧选择数据表</span>
                  <el-button size="small" icon="el-icon-refresh" @click="loadSampleData">引用样例数据</el-button>
                  <el-button size="small" :icon="spreadsheetFullscreen ? 'el-icon-close' : 'el-icon-full-screen'" @click="spreadsheetFullscreen = !spreadsheetFullscreen">{{ spreadsheetFullscreen ? '退出全屏' : '全屏' }}</el-button>
                </div>
                <spreadsheet-editor v-model="currentDataRows" :height="spreadsheetFullscreen ? 700 : 400" :show-toolbar="true" @change="handleDataChange" />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        <div style="margin-top:16px;text-align:right">
          <el-button type="success" @click="confirmDesign">确认设计</el-button>
        </div>
      </el-card>
    </template>

    <el-dialog title="提交执行" :visible.sync="executeDialogVisible" width="450px">
      <el-form :model="executeForm" label-width="100px">
        <el-form-item label="批量日期"><el-date-picker v-model="executeForm.batchDates" type="dates" value-format="yyyy-MM-dd" :picker-options="{ disabledDate(t) { return t > new Date() } }" placeholder="选择批量日期（最多31个）" style="width:100%" /></el-form-item>
        <p style="font-size:12px;color:#64748b;margin-top:4px">已选 {{ executeForm.batchDates?.length || 0 }} 天，最多31天</p>
      </el-form>
      <span slot="footer"><el-button @click="executeDialogVisible = false">取消</el-button><el-button type="primary" @click="submitExecute">执行</el-button></span>
    </el-dialog>
  </div>
</template>

<script>
import { mockProgramList } from "@/utils/mock"
import SpreadsheetEditor from "@/components/SpreadsheetEditor.vue"

export default {
  name: "TestDesign",
  components: { SpreadsheetEditor },
  data() {
    return {
      repos: ["etl-risk", "etl-trade", "etl-user"],
      branches: ["release/2.0", "release/1.0", "develop", "master"],
      filters: { repo: "etl-risk", branch: "release/2.0", programName: "", designStatus: "" },
      programList: JSON.parse(JSON.stringify(mockProgramList)),
      selectedProgram: null,
      designTab: "jobs",
      newSourceTable: "", newTargetTable: "",
      allTables: ["ods.ods_risk_rule", "ods.ods_risk_param", "dwd.dwd_risk_rule_di", "dws.dws_risk_metric_df", "ods.ods_trade_order", "dwd.dwd_trade_order_di"],
      editingPointIndex: -1,
      operators: ["=", ">", "<", ">=", "<=", "<>", "!=", "LIKE", "IN", "NOT IN"],
      currentDataTable: "", currentPartition: "dt=20260720",
      currentDataRows: [],
      aiGenerating: false,
      spreadsheetFullscreen: false,
      executeDialogVisible: false,
      executeForm: { batchDates: [] }
    }
  },
  computed: {
    confirmedPrograms() { return this.programList.filter(p => p.designStatus === "已确认") },
    dataTables() {
      if (!this.selectedProgram) return []
      return [...new Set([...(this.selectedProgram.sourceTables || []), ...(this.selectedProgram.targetTables || [])])]
    },
    sourceTables() { return this.selectedProgram ? (this.selectedProgram.sourceTables || []) : [] },
    targetTables() { return this.selectedProgram ? (this.selectedProgram.targetTables || []) : [] }
  },
  methods: {
    handleSearch() {
      if (!this.filters.repo || !this.filters.branch) { this.$message.warning("请选择版本库和版本分支"); return }
      this.$message.success("查询成功")
    },
    handleProgramClick(row) {
      this.selectedProgram = JSON.parse(JSON.stringify(row))
      if (!this.selectedProgram.sourceTables) this.$set(this.selectedProgram, "sourceTables", [])
      if (!this.selectedProgram.targetTables) this.$set(this.selectedProgram, "targetTables", [])
      if (!this.selectedProgram.assertionType) this.$set(this.selectedProgram, "assertionType", "flexible")
      if (!this.selectedProgram.assertions) this.$set(this.selectedProgram, "assertions", [])
      this.currentDataTable = this.dataTables[0] || ""
      this.loadDataRows()
      this.designTab = "jobs"
    },
    addSourceTable() { if (this.newSourceTable) { this.selectedProgram.sourceTables.push(this.newSourceTable); this.newSourceTable = "" } },
    addTargetTable() { if (this.newTargetTable) { this.selectedProgram.targetTables.push(this.newTargetTable); this.newTargetTable = "" } },
    addPoint() { this.selectedProgram.testPoints.push({ id: `_${Math.random().toString(36).slice(2,9)}`, point: "新测试要点" }); this.editingPointIndex = this.selectedProgram.testPoints.length - 1 },
    deletePoint(idx) { this.selectedProgram.testPoints.splice(idx, 1) },
    addAssertion() {
      if (!this.selectedProgram.assertions) this.$set(this.selectedProgram, "assertions", [])
      this.selectedProgram.assertions.push({ id: `_${Math.random().toString(36).slice(2,9)}`, name: "", sql: "", operator: "=", expect: "" })
    },
    deleteAssertion(idx) { this.selectedProgram.assertions.splice(idx, 1) },
    onAssertionTypeChange(val) {
      if (val === "flexible" && (!this.selectedProgram.assertions || this.selectedProgram.assertions.length === 0)) {
        this.addAssertion()
      }
    },
    onDataTableChange() { this.loadDataRows() },
    selectDataTable(tb) { this.currentDataTable = tb; this.loadDataRows() },
    loadDataRows() {
      if (!this.selectedProgram || !this.currentDataTable) { this.currentDataRows = []; return }
      const d = this.selectedProgram.testData[this.currentDataTable] || []
      this.currentDataRows = JSON.parse(JSON.stringify(d))
    },
    handleDataChange(arr) {
      if (this.selectedProgram && this.currentDataTable) this.$set(this.selectedProgram.testData, this.currentDataTable, arr)
    },
    isSourceTable(tb) {
      if (!this.selectedProgram) return false
      return (this.selectedProgram.sourceTables || []).includes(tb)
    },
    generateData() {
      this.aiGenerating = true
      this.$message.info("大模型正在生成测试数据...")
      setTimeout(() => {
        this.aiGenerating = false
        if (Math.random() > 0.2) {
          const sample = [{ col1: "生成数据示例", col2: "请根据实际表结构修改" }]
          this.$set(this.selectedProgram.testData, this.currentDataTable, sample)
          this.loadDataRows()
          this.$message.success("AI 数据生成成功！请检查并手动调整")
        } else {
          this.$message.error("大模型生成失败，请手动填写测试数据或重新生成")
        }
      }, 1500)
    },
    loadSampleData() { this.$message.success("已从数据资产导入样例数据") },
    confirmDesign() {
      this.selectedProgram.designStatus = "已确认"
      this.selectedProgram.lastDesigner = "当前用户"
      this.selectedProgram.lastDesignedAt = new Date().toISOString().slice(0, 19).replace("T", " ")
      const idx = this.programList.findIndex(p => p.id === this.selectedProgram.id)
      if (idx > -1) Object.assign(this.programList[idx], this.selectedProgram)
      this.$message.success("设计已确认")
    },
    showExecuteDialog() { this.executeForm.batchDates = []; this.executeDialogVisible = true },
    submitExecute() {
      if (!this.executeForm.batchDates || this.executeForm.batchDates.length === 0) { this.$message.warning("请选择至少一个批量日期"); return }
      if (this.executeForm.batchDates.length > 31) { this.$message.warning("批量日期最多31个"); return }
      this.executeDialogVisible = false
      this.$message.success(`已提交 ${this.confirmedPrograms.length} 个程序执行，共 ${this.executeForm.batchDates.length} 个批量日期`)
    }
  }
}
</script>

<style lang="scss" scoped>
.lineage-row { display: flex; gap: 0; margin-bottom: 16px; align-items: stretch; }
.lineage-col { flex: 1; min-width: 0; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; flex-direction: column; }
.lineage-col-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0; }
.lineage-label { font-weight: 600; font-size: 13px; color: #334155; }
.lineage-count { font-size: 12px; color: #94a3b8; flex: 1; }
.lineage-tags { padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 4px; max-height: 200px; overflow-y: auto; align-content: flex-start; }
.lineage-empty { font-size: 12px; color: #94a3b8; padding: 4px 0; }
.lineage-arrow { display: flex; align-items: center; justify-content: center; width: 40px; flex-shrink: 0; color: #94a3b8; font-size: 20px; }

.hql-block { margin-top: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;
  .hql-header { padding: 6px 12px; background: #f1f5f9; font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #e2e8f0; }
  .hql-code { margin: 0; padding: 12px 16px; font-family: Consolas, Monaco, monospace; font-size: 12px; line-height: 1.6; color: #1e293b; background: #f8fafc; white-space: pre; overflow-x: auto; }
}
.assertion-card { padding: 12px; margin-bottom: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  .assertion-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-weight: 600; font-size: 14px; }
}
.assert-type-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
.assert-type-label { font-weight: 600; font-size: 13px; color: #334155; }
.result-set-hint { display: flex; align-items: flex-start; gap: 10px; padding: 18px 20px; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; color: #1e40af; font-size: 13px; line-height: 1.7;
  i { font-size: 18px; flex-shrink: 0; margin-top: 1px; color: #2563eb; }
  strong { color: #1d4ed8; }
}
.data-layout { display: flex; gap: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.data-sidebar { width: 200px; flex-shrink: 0; background: #fafbfd; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
.data-sidebar-header { padding: 10px 14px; font-weight: 600; font-size: 13px; color: #334155; border-bottom: 1px solid #e2e8f0; }
.data-sidebar-group { border-bottom: 1px solid #e2e8f0; }
.data-sidebar-group-title { padding: 6px 14px; font-size: 11px; color: #94a3b8; font-weight: 500; text-transform: none; letter-spacing: 0.3px; background: #f1f5f9; }
.data-sidebar-item { display: flex; align-items: center; gap: 6px; padding: 7px 14px; cursor: pointer; transition: background 0.15s; border-left: 2px solid transparent;
  &:hover { background: #eef2ff; }
  &.active { background: #eff6ff; border-left-color: #6662fe; }
  .data-table-name { font-size: 12px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.data-main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;
  &.fullscreen { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000; background: #fff; }
}
.data-main-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: #fff; border-bottom: 1px solid #e2e8f0; }
.data-main-title { font-weight: 600; font-size: 13px; color: #334155; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.data-table-tabs { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;
  .data-table-tabs-label { font-weight: 600; font-size: 14px; white-space: nowrap; }
}
.ai-gen-banner { display: flex; align-items: center; gap: 10px; padding: 10px 16px; margin-bottom: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.5;
  i { font-size: 16px; color: #f59e0b; flex-shrink: 0; }
  span { flex: 1; }
}
</style>
