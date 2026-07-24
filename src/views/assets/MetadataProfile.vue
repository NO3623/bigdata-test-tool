<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title-wrap">
        <svg class="page-illustration" viewBox="0 0 48 48" width="36" height="36">
          <circle cx="24" cy="14" r="9" fill="#ebebff" stroke="#6662fe" stroke-width="1.5"/>
          <path d="M16 22c-4 4-2 10 2 12" fill="none" stroke="#b0adff" stroke-width="2" stroke-linecap="round"/>
          <path d="M32 22c4 4 2 10-2 12" fill="none" stroke="#b0adff" stroke-width="2" stroke-linecap="round"/>
          <line x1="24" y1="24" x2="24" y2="36" stroke="#6662fe" stroke-width="2" stroke-linecap="round"/>
          <line x1="16" y1="36" x2="32" y2="36" stroke="#6662fe" stroke-width="2" stroke-linecap="round"/>
          <circle cx="24" cy="11" r="3" fill="#6662fe" opacity="0.3"/>
        </svg>
        <h1 class="page-title">元数据画像</h1>
      </div>
      <span style="font-size:13px;color:#64748b">AI 根据各用户画像自动汇总（表级 + 字段级）</span>
    </div>

    <div class="filter-bar">
      <el-select v-model="version" placeholder="选择版本号" style="width:160px" @change="loadProfile">
        <el-option v-for="v in versions" :key="v" :label="v" :value="v" />
      </el-select>
      <el-select v-model="tableName" placeholder="选择表名" style="width:220px" @change="loadProfile">
        <el-option v-for="t in tables" :key="t" :label="t" :value="t" />
      </el-select>
      <el-button type="primary" icon="el-icon-search" @click="loadProfile">查询</el-button>
    </div>

    <template v-if="profile">
      <el-card shadow="never" class="section-card">
        <div slot="header">
          <span>AI 汇总画像</span>
          <el-tag size="small" style="margin-left:8px">{{ version }}</el-tag>
          <el-tag size="small" type="info">{{ tableName }}</el-tag>
        </div>
        <p style="line-height:1.8;font-size:14px;color:#334155;padding:8px 0">{{ profile.summary }}</p>
      </el-card>

      <el-card shadow="never" class="section-card" v-if="profile.fields && profile.fields.length">
        <div slot="header">字段级画像</div>
        <el-table :data="profile.fields" stripe size="small">
          <el-table-column type="index" label="#" width="45" />
          <el-table-column prop="field" label="字段名" width="150" />
          <el-table-column label="字段类型" width="120">
            <template slot-scope="{ row }"><el-tag size="mini" type="warning">{{ row.fieldType || '-' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="数据格式" width="160" show-overflow-tooltip>
            <template slot-scope="{ row }">{{ row.format || '-' }}</template>
          </el-table-column>
          <el-table-column label="空值率" width="100" align="center">
            <template slot-scope="{ row }">
              <span :style="{ color: (row.nullRate||0) > 10 ? '#ef4444' : '#10b981', fontWeight: 600 }">{{ row.nullRate != null ? row.nullRate + '%' : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="distribution" label="数据分布" min-width="200" show-overflow-tooltip />
          <el-table-column prop="comment" label="业务描述" min-width="240" show-overflow-tooltip />
        </el-table>
      </el-card>

      <el-card shadow="never">
        <div slot="header">参与画像的用户</div>
        <div style="display:flex;gap:24px;flex-wrap:wrap">
          <div v-for="u in profile.participants" :key="u" class="user-chip"><i class="el-icon-user" /> {{ u }}</div>
        </div>
      </el-card>
    </template>

    <el-empty v-else description="请选择版本号和表名查看元数据画像" />
  </div>
</template>

<script>
import { mockAIProfiles } from "@/utils/mock"

export default {
  name: "MetadataProfile",
  data() { return { versions: ["v1.0.0", "v1.1.0", "v1.2.0", "v2.0.0", "v2.0.1"], tables: ["t_risk_rule_config", "t_trade_order", "t_trade_payment", "t_user_tag_daily"], version: "", tableName: "", profile: null } },
  methods: {
    loadProfile() {
      if (!this.version || !this.tableName) return
      const found = mockAIProfiles.find(p => p.version === this.version && p.tableName === this.tableName)
      this.profile = found ? { ...found } : null
      if (!this.profile) this.$message.info("暂无该版本的AI汇总画像")
    }
  }
}
</script>

<style lang="scss" scoped>
.user-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #f1f5f9; border-radius: 20px; font-size: 13px; color: #334155; }
</style>