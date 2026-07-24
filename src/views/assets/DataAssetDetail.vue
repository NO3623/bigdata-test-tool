<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title-wrap">
        <el-button icon="el-icon-arrow-left" size="small" round @click="$router.back()">返回</el-button>
        <svg class="page-illustration" viewBox="0 0 48 48" width="32" height="32" style="margin-left:8px">
          <rect x="6" y="8" width="36" height="32" rx="6" fill="#ebebff" stroke="#6662fe" stroke-width="1.5"/>
          <rect x="12" y="16" width="10" height="6" rx="2" fill="#b0adff" opacity="0.5"/>
          <rect x="26" y="16" width="14" height="6" rx="2" fill="#d2d0ff" opacity="0.5"/>
          <rect x="12" y="26" width="6" height="6" rx="2" fill="#d2d0ff" opacity="0.5"/>
          <circle cx="36" cy="29" r="2" fill="#6662fe"/>
        </svg>
        <h1 class="page-title">数据资产详情</h1>
      </div>
      <span />
    </div>

    <el-card shadow="never" class="section-card">
      <div slot="header">资产基本信息</div>
      <div class="info-grid">
        <div class="info-item"><span class="label">场景名</span><span class="value">{{ asset.scenarioName }}</span></div>
        <div class="info-item"><span class="label">应用名</span><span class="value">{{ asset.appName }}</span></div>
        <div class="info-item"><span class="label">环境@数据库</span><span class="value">{{ asset.env }}</span></div>
        <div class="info-item"><span class="label">表名</span><span class="value">{{ asset.tableName }}</span></div>
        <div class="info-item"><span class="label">版本号</span><span class="value">{{ asset.version }}</span></div>
        <div class="info-item"><span class="label">资产价值</span><span class="value">{{ asset.assetValue }}</span></div>
        <div class="info-item"><span class="label">创建人</span><span class="value">{{ asset.creator }}</span></div>
        <div class="info-item"><span class="label">更新时间</span><span class="value">{{ asset.updatedAt }}</span></div>
        <div class="info-item"><span class="label">引用次数</span><span class="value">{{ refCount }}</span></div>
        <div class="info-item"><span class="label">被引用次数</span><span class="value">{{ citedCount }}</span></div>
      </div>
    </el-card>

    <el-tabs v-model="activeTab" class="section-card">
      <el-tab-pane label="元数据画像" name="profile">
        <div class="table-toolbar">
          <span style="font-weight:600;font-size:14px">画像列表</span>
          <el-button size="small" type="primary" icon="el-icon-plus" @click="showAddProfile">添加画像</el-button>
        </div>
        <el-table :data="profiles" stripe size="small">
          <el-table-column type="index" label="#" width="45" />
          <el-table-column prop="field" label="字段" width="140" />
          <el-table-column prop="type" label="描述类型" width="130">
            <template slot-scope="{ row }"><el-tag size="mini">{{ row.type }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="subtype" label="子类型" width="140" />
          <el-table-column prop="content" label="画像信息" min-width="240" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template slot-scope="{ row, $index }">
              <el-button type="text" size="mini" icon="el-icon-edit" @click="editProfile(row, $index)">编辑</el-button>
              <el-button type="text" size="mini" icon="el-icon-delete" style="color:#ef4444" @click="deleteProfile($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="样例数据" name="sample">
        <div class="table-toolbar">
          <span style="font-weight:600;font-size:14px">样例数据 — {{ asset.tableName }}</span>
          <el-button size="small" icon="el-icon-download" @click="exportSample">导出</el-button>
        </div>
        <spreadsheet-editor v-model="sampleData" :height="400" :show-toolbar="true" />
      </el-tab-pane>

      <el-tab-pane v-if="asset.shared" label="资产评价" name="review">
        <p style="color:#64748b;margin-bottom:12px">其他用户对该资产的评价</p>
        <div v-for="(r, i) in reviews" :key="i" class="review-item">
          <div class="review-meta"><strong>{{ r.author }}</strong><span class="el-icon-time" /> {{ r.time }}</div>
          <p>{{ r.content }}</p>
        </div>
        <el-divider />
        <el-input v-model="newReview" type="textarea" :rows="3" placeholder="写下你的评价..." style="margin-bottom:12px" />
        <el-button type="primary" size="small" @click="submitReview">提交评价</el-button>
      </el-tab-pane>
    </el-tabs>

    <el-dialog :title="profileEditingIndex > -1 ? '编辑画像' : '添加画像'" :visible.sync="profileDialogVisible" width="500px">
      <el-form :model="profileForm" label-width="100px">
        <el-form-item label="字段名"><el-input v-model="profileForm.field" /></el-form-item>
        <el-form-item label="描述类型">
          <el-select v-model="profileForm.type" style="width:100%">
            <el-option v-for="t in descTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="子类型" v-if="profileForm.type === '字段类型'">
          <el-select v-model="profileForm.subtype" style="width:100%">
            <el-option v-for="s in ['金额','可枚举','范围','文本']" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="子类型" v-else-if="profileForm.type === '数据格式'">
          <el-input v-model="profileForm.subtype" placeholder="如 8位机构编码" />
        </el-form-item>
        <el-form-item label="画像信息">
          <el-input v-model="profileForm.content" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mockDataAssets, mockProfiles, mockAIProfiles } from "@/utils/mock"
import SpreadsheetEditor from "@/components/SpreadsheetEditor.vue"

export default {
  name: "DataAssetDetail",
  components: { SpreadsheetEditor },
  data() {
    const asset = JSON.parse(JSON.stringify(mockDataAssets.find(a => a.id === this.$route.params.id) || mockDataAssets[0]))
    return {
      asset, refCount: 3, citedCount: 5,
      activeTab: "profile",
      descTypes: ["字段类型", "数据格式", "空值率", "业务描述", "数据分布"],
      profiles: JSON.parse(JSON.stringify(mockProfiles.filter(p => p.tableName === asset.tableName))),
      profileDialogVisible: false, profileEditingIndex: -1,
      profileForm: { field: "", type: "字段类型", subtype: "", content: "" },
      sampleData: [
        { rule_id: "R001", rule_name: "单笔金额超限", risk_level: "L3", threshold: "500000", dt: "20260720" },
        { rule_id: "R002", rule_name: "短时高频交易", risk_level: "L4", threshold: "10", dt: "20260720" }
      ],
      reviews: [
        { author: "李四", time: "2026-07-15 14:30", content: "该表字段结构清晰，建议补充字段注释文档。" },
        { author: "王五", time: "2026-07-16 09:00", content: "空值率信息很实用，希望能定期更新。" }
      ],
      newReview: ""
    }
  },
  methods: {
    showAddProfile() { this.profileEditingIndex = -1; this.profileForm = { field: "", type: "字段类型", subtype: "", content: "" }; this.profileDialogVisible = true },
    editProfile(row, idx) { this.profileEditingIndex = idx; this.profileForm = { ...row }; this.profileDialogVisible = true },
    saveProfile() {
      const p = { ...this.profileForm, id: `_${Math.random().toString(36).slice(2,9)}` }
      if (this.profileEditingIndex > -1) this.profiles.splice(this.profileEditingIndex, 1, { ...this.profiles[this.profileEditingIndex], ...this.profileForm })
      else this.profiles.push(p)
      this.profileDialogVisible = false; this.$message.success("已保存")
    },
    deleteProfile(idx) { this.$confirm("确认删除？", "提示", { type: "warning" }).then(() => { this.profiles.splice(idx, 1); this.$message.success("已删除") }).catch(() => {}) },
    exportSample() {
      import("@/utils/mock").then(() => {
        this.$message.success("样例数据导出成功")
      })
    },
    submitReview() {
      if (!this.newReview.trim()) return
      this.reviews.push({ author: "当前用户", time: new Date().toISOString().slice(0, 19).replace("T", " "), content: this.newReview })
      this.newReview = ""; this.$message.success("评价已提交")
    }
  }
}
</script>

<style lang="scss" scoped>
.review-item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; .review-meta { font-size: 13px; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; } }
</style>
