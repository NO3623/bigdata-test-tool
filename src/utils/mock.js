function id() { return `_${Math.random().toString(36).slice(2, 9)}` }
function now() { return new Date().toISOString().slice(0, 19).replace("T", " ") }

// ── 场景管理 ──
export const mockScenarios = [
  { id: id(), name: "风控场景回归测试", description: "覆盖风控核心规则表的全量回归", updatedAt: now(), createdAt: "2026-07-01 09:00:00" },
  { id: id(), name: "交易数据一致性校验", description: "核对交易流水在ODS/DWD/DWS各层的一致性", updatedAt: now(), createdAt: "2026-07-05 14:30:00" },
  { id: id(), name: "用户画像ETL测试", description: "用户标签宽表加工逻辑验证", updatedAt: now(), createdAt: "2026-07-10 10:15:00" }
]

// ── 数据资产 ──
const envs = ["dev", "test", "staging", "prod"]
export const mockDataAssets = [
  { id: id(), scenarioName: "风控场景回归测试", appName: "risk-engine", env: "test@risk_db", tableName: "t_risk_rule_config", version: "v1.2.0", shared: true, assetValue: "高", creator: "张三", updatedAt: now(), createdAt: "2026-07-01 11:00:00" },
  { id: id(), scenarioName: "交易数据一致性校验", appName: "trade-settlement", env: "test@trade_db", tableName: "t_trade_order", version: "v2.0.1", shared: true, assetValue: "高", creator: "李四", updatedAt: now(), createdAt: "2026-07-06 09:20:00" },
  { id: id(), scenarioName: "交易数据一致性校验", appName: "trade-settlement", env: "test@trade_db", tableName: "t_trade_payment", version: "v2.0.1", shared: false, assetValue: "中", creator: "李四", updatedAt: now(), createdAt: "2026-07-06 09:25:00" },
  { id: id(), scenarioName: "用户画像ETL测试", appName: "user-profile", env: "dev@user_db", tableName: "t_user_tag_daily", version: "v1.0.0", shared: false, assetValue: "高", creator: "王五", updatedAt: now(), createdAt: "2026-07-11 16:00:00" }
]

// ── 元数据画像 ──
export const mockProfiles = [
  { id: id(), version: "v1.2.0", tableName: "t_risk_rule_config", field: "rule_id", type: "字段类型", subtype: "文本", content: "规则ID，全局唯一UUID" },
  { id: id(), version: "v1.2.0", tableName: "t_risk_rule_config", field: "rule_name", type: "字段类型", subtype: "文本", content: "规则名称，最长64字符" },
  { id: id(), version: "v1.2.0", tableName: "t_risk_rule_config", field: "risk_level", type: "字段类型", subtype: "可枚举", content: "风险等级: L1/L2/L3/L4" },
  { id: id(), version: "v1.2.0", tableName: "t_risk_rule_config", field: "threshold", type: "字段类型", subtype: "范围", content: "阈值范围 0-10000" },
  { id: id(), version: "v1.2.0", tableName: "t_risk_rule_config", field: "amount", type: "字段类型", subtype: "金额", content: "交易金额，单位分" },
  { id: id(), version: "v1.2.0", tableName: "t_risk_rule_config", field: "org_code", type: "数据格式", subtype: "8位机构编码", content: "前4位机构类型+后4位顺序号" },
  { id: id(), version: "v1.2.0", tableName: "t_risk_rule_config", field: "rule_id", type: "空值率", subtype: "", content: "主键，空值率0%" },
  { id: id(), version: "v1.2.0", tableName: "t_risk_rule_config", field: "risk_level", type: "数据分布", subtype: "", content: "L1: 5%, L2: 35%, L3: 45%, L4: 15%" },
  { id: id(), version: "v2.0.1", tableName: "t_trade_order", field: "order_id", type: "字段类型", subtype: "文本", content: "订单号，全局唯一雪花ID" },
  { id: id(), version: "v2.0.1", tableName: "t_trade_order", field: "order_status", type: "字段类型", subtype: "可枚举", content: "状态: 0-初始,1-支付中,2-成功,3-失败,4-退款" },
  { id: id(), version: "v2.0.1", tableName: "t_trade_order", field: "order_amount", type: "字段类型", subtype: "金额", content: "订单金额，单位分" },
  { id: id(), version: "v2.0.1", tableName: "t_trade_order", field: "order_id", type: "空值率", subtype: "", content: "主键，空值率0%" }
]

// ── AI 元数据画像 ──
export const mockAIProfiles = [
  { version: "v1.2.0", tableName: "t_risk_rule_config", summary: "风控规则配置表，按业务类型+风险等级维度存储规则。日均变更频率低(约50条/天)，主键无空值，规则名称有唯一约束，金额字段精度到分。建议对risk_level和rule_name加联合索引以提升查询效率。", participants: ["张三", "李四", "王五"], fields: [
    { field: "rule_id", fieldType: "文本", format: "UUID v4", nullRate: 0, distribution: "全局唯一", comment: "规则ID，主键" },
    { field: "rule_name", fieldType: "文本", format: "最长64字符", nullRate: 0, distribution: "唯一约束", comment: "规则名称" },
    { field: "risk_level", fieldType: "可枚举", format: "L1/L2/L3/L4", nullRate: 0, distribution: "L1:5% L2:35% L3:45% L4:15%", comment: "风险等级" },
    { field: "threshold", fieldType: "范围", format: "整数 0-10000", nullRate: 0.5, distribution: "集中在0-5000区间", comment: "触发阈值" },
    { field: "amount", fieldType: "金额", format: "单位:分，整数", nullRate: 2, distribution: "对数正态分布", comment: "交易金额" },
    { field: "org_code", fieldType: "文本", format: "8位机构编码", nullRate: 0, distribution: "前4位+后4位组合", comment: "机构代码" },
    { field: "update_time", fieldType: "文本", format: "yyyy-MM-dd HH:mm:ss", nullRate: 0, distribution: "近30天集中更新", comment: "最后更新时间" }
  ] },
  { version: "v2.0.1", tableName: "t_trade_order", summary: "交易订单主表，订单状态流转清晰(0初始/1支付中/2成功/3失败/4退款)。金额字段要求精确到分且不可为负。订单号走雪花算法，无需自增主键。支付订单需关联t_trade_payment表。", participants: ["张三", "赵六"], fields: [
    { field: "order_id", fieldType: "文本", format: "雪花ID，19位", nullRate: 0, distribution: "单调递增", comment: "订单号，主键" },
    { field: "order_status", fieldType: "可枚举", format: "0-4", nullRate: 0, distribution: "0:3% 1:20% 2:65% 3:10% 4:2%", comment: "订单状态" },
    { field: "order_amount", fieldType: "金额", format: "单位:分，整数", nullRate: 0, distribution: "长尾分布", comment: "订单金额" },
    { field: "user_id", fieldType: "文本", format: "UUID", nullRate: 0, distribution: "均匀分布", comment: "用户ID" },
    { field: "create_time", fieldType: "文本", format: "yyyy-MM-dd HH:mm:ss", nullRate: 0, distribution: "时间递增", comment: "创建时间" }
  ] },
  { version: "v2.0.1", tableName: "t_trade_payment", summary: "支付流水表，关联t_trade_order表。status字段(0待支付/1处理中/2成功/3失败)已通过用户画像确认。金额字段建议加NOT NULL约束。平均支付响应时间<200ms。", participants: ["李四", "赵六"], fields: [
    { field: "payment_id", fieldType: "文本", format: "雪花ID", nullRate: 0, distribution: "全局唯一", comment: "支付流水号，主键" },
    { field: "order_id", fieldType: "文本", format: "外键关联t_trade_order", nullRate: 0, distribution: "1:1关联订单", comment: "关联订单号" },
    { field: "pay_amount", fieldType: "金额", format: "单位:分，整数", nullRate: 0, distribution: "与order_amount一致", comment: "支付金额" },
    { field: "pay_channel", fieldType: "可枚举", format: "WECHAT/ALIPAY/BANK", nullRate: 0, distribution: "WECHAT:55% ALIPAY:35% BANK:10%", comment: "支付渠道" },
    { field: "pay_status", fieldType: "可枚举", format: "0-3", nullRate: 0, distribution: "0:2% 1:8% 2:88% 3:2%", comment: "支付状态" },
    { field: "pay_time", fieldType: "文本", format: "yyyy-MM-dd HH:mm:ss.SSS", nullRate: 5, distribution: "业务高峰期集中", comment: "支付完成时间，未支付则为空" }
  ] },
  { version: "v1.0.0", tableName: "t_user_tag_daily", summary: "用户标签日表，按dt分区存储。tag_type为可枚举字段(L1~L5层级)。权重字段范围0-1，空值率约3%主要来自冷启动用户。标签数量日均增长约20万条。", participants: ["王五"], fields: [
    { field: "user_id", fieldType: "文本", format: "UUID", nullRate: 0, distribution: "去重后日均10W", comment: "用户ID" },
    { field: "tag_type", fieldType: "可枚举", format: "L1~L5", nullRate: 0, distribution: "L1:10% L2:25% L3:35% L4:20% L5:10%", comment: "标签层级" },
    { field: "tag_id", fieldType: "文本", format: "最长32字符", nullRate: 0, distribution: "标签字典约500个", comment: "标签ID" },
    { field: "tag_weight", fieldType: "范围", format: "浮点数 0.0-1.0", nullRate: 3, distribution: "集中在0.3-0.7", comment: "标签权重，冷启动用户为空" },
    { field: "dt", fieldType: "文本", format: "yyyyMMdd 分区字段", nullRate: 0, distribution: "每日分区", comment: "数据日期" }
  ] }
]

// ── 测试设计 - 程序清单 ──
export const mockProgramList = [
  { id: id(), programName: "DW_RISK_RULE_DAILY", repo: "etl-risk", branch: "release/2.0", lastModifier: "张三", lastModifiedAt: now(), lastDesigner: "李四", lastDesignedAt: now(), designStatus: "已确认",
    sourceTables: ["ods.ods_risk_rule", "ods.ods_risk_param", "ods.ods_risk_dim", "ods.ods_risk_blacklist", "ods.ods_org_info"], targetTables: ["dwd.dwd_risk_rule_di", "dws.dws_risk_metric_df"],
    hql:
`insert overwrite table dwd.dwd_risk_rule_di partition(dt='\${bizdate}')
select
  r.rule_id,
  r.rule_name,
  r.risk_level,
  r.threshold,
  r.amount,
  p.param_value as limit_value,
  r.org_code
from ods.ods_risk_rule r
left join ods.ods_risk_param p
  on r.org_code = p.org_code
where r.dt = '\${bizdate}';

insert overwrite table dws.dws_risk_metric_df partition(dt='\${bizdate}')
select
  org_code,
  risk_level,
  count(1) as rule_cnt,
  sum(case when amount > threshold then 1 else 0 end) as exceed_cnt,
  avg(amount) as avg_amount
from dwd.dwd_risk_rule_di
where dt = '\${bizdate}'
group by org_code, risk_level;`, testPoints: [
    { id: id(), point: "源表ods_risk_rule数据增量抽取完整性校验" },
    { id: id(), point: "风险等级字段映射转换逻辑验证" },
    { id: id(), point: "目标表主键唯一性约束验证" }
  ], assertionType: "flexible", assertions: [
    { id: id(), name: "主键唯一性校验", sql: "SELECT rule_id, count(1) as cnt FROM dwd.dwd_risk_rule_di WHERE dt = '${bizdate}' GROUP BY rule_id HAVING cnt > 1", operator: "=", expect: "0 rows" },
    { id: id(), name: "风险等级合法校验", sql: "SELECT count(1) FROM dwd.dwd_risk_rule_di WHERE risk_level NOT IN ('L1','L2','L3','L4')", operator: "=", expect: "0" },
    { id: id(), name: "目标表行数检查", sql: "SELECT count(1) FROM dws.dws_risk_metric_df WHERE dt = '${bizdate}'", operator: ">", expect: "0" }
  ], testData: {
    "ods.ods_risk_rule": [
      { rule_id: "R001", rule_name: "单笔金额超限", risk_level: "L3", threshold: 500000, amount: 600000, org_code: "BANK0001", dt: "20260720" },
      { rule_id: "R002", rule_name: "短时高频交易", risk_level: "L4", threshold: 10, amount: 50000, org_code: "BANK0002", dt: "20260720" }
    ],
    "ods.ods_risk_param": [
      { param_id: "P001", param_name: "单笔限额", param_value: "500000", effective_date: "2026-01-01", dt: "20260720" }
    ]
  } }
]

// ── 测试执行 ──
export const mockExecutions = [
  { batchId: "B20260720001", repo: "etl-risk", branch: "release/2.0", batchDates: ["2026-07-20", "2026-07-19", "2026-07-18"], runs: [
    { batchDate: "2026-07-20", status: "running", jobs: [
      { name: "DW_RISK_RULE_DAILY", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-20 10:00:00", endedAt: "2026-07-20 10:05:30", logs: [
          { time: "10:00:01", level: "info", msg: "开始拉取测试数据，数据源: ods.ods_risk_rule, ods.ods_risk_param" },
          { time: "10:00:03", level: "info", msg: "数据源连接成功，读取分区 dt=20260720" },
          { time: "10:04:30", level: "warn", msg: "检测到 rule_id 为空的行 3 条，已自动补充默认值" },
          { time: "10:05:28", level: "info", msg: "测试数据导入完成，共 13,189 行，状态: SUCCESS" }
        ], artifacts: [
          { name: "数据导入日志 (Yarn)", url: "#", size: "12.4 KB" },
          { name: "导入数据统计报表", url: "#", size: "45.1 KB" }
        ] },
        { name: "测试作业执行", status: "running", startedAt: "2026-07-20 10:05:30", endedAt: null, logs: [
          { time: "10:05:31", level: "info", msg: "开始执行作业: JOB_RISK_RULE_EXTRACT" },
          { time: "10:06:15", level: "info", msg: "JOB_RISK_RULE_EXTRACT 完成，输出: dwd.dwd_risk_rule_di (12,845 行)" },
          { time: "10:08:25", level: "info", msg: "JOB_RISK_TRANSFORM 完成，输出: dws.dws_risk_metric_df (1,024 行)" },
          { time: "10:15:00", level: "warn", msg: "部分分区数据倾斜，已自动优化" },
          { time: "当前", level: "info", msg: "作业仍在运行中..." }
        ], artifacts: [
          { name: "Spark 执行日志", url: "#", size: "156.7 KB" },
          { name: "dwd.dwd_risk_rule_di 快照", url: "#", size: "2.3 MB" }
        ] },
        { name: "测试断言执行", status: "pending", startedAt: null, endedAt: null, logs: [
          { time: "-", level: "info", msg: "等待作业执行完成后触发..." }
        ], artifacts: [] }
      ] },
      { name: "DW_RISK_PARAM_SYNC", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-20 10:00:30", endedAt: "2026-07-20 10:02:10", logs: [
          { time: "10:00:31", level: "info", msg: "开始拉取参数表数据，数据源: ods.ods_risk_param" },
          { time: "10:02:08", level: "info", msg: "测试数据导入完成，共 342 行" }
        ], artifacts: [{ name: "参数表导入日志", url: "#", size: "8.2 KB" }] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-20 10:02:10", endedAt: "2026-07-20 10:12:00", logs: [
          { time: "10:02:11", level: "info", msg: "开始执行: JOB_PARAM_SYNC" },
          { time: "10:11:58", level: "info", msg: "作业执行完成，param_snapshot 已产出" }
        ], artifacts: [{ name: "作业执行日志", url: "#", size: "89.3 KB" }, { name: "param_snapshot_20260720.parquet", url: "#", size: "124.5 KB" }] },
        { name: "测试断言执行", status: "success", startedAt: "2026-07-20 10:12:00", endedAt: "2026-07-20 10:13:30", logs: [
          { time: "10:12:01", level: "info", msg: "执行结果集断言: 3 条" },
          { time: "10:13:28", level: "info", msg: "3/3 断言通过" }
        ], artifacts: [{ name: "断言执行报告", url: "#", size: "32.1 KB" }] }
      ] }
    ] },
    { batchDate: "2026-07-19", status: "success", jobs: [
      { name: "DW_RISK_RULE_DAILY", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-19 09:00:00", endedAt: "2026-07-19 09:04:20", logs: [
          { time: "09:00:01", level: "info", msg: "数据导入完成，共 12,950 行" }
        ], artifacts: [{ name: "导入日志", url: "#", size: "11.2 KB" }] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-19 09:04:20", endedAt: "2026-07-19 09:15:00", logs: [
          { time: "09:04:21", level: "info", msg: "作业开始执行" },
          { time: "09:14:58", level: "info", msg: "所有作业执行成功" }
        ], artifacts: [{ name: "执行日志", url: "#", size: "142.3 KB" }] },
        { name: "测试断言执行", status: "success", startedAt: "2026-07-19 09:15:00", endedAt: "2026-07-19 09:16:10", logs: [
          { time: "09:15:01", level: "info", msg: "8/10 断言通过" },
          { time: "09:16:08", level: "info", msg: "通过率 80%，详细报告各生成" }
        ], artifacts: [{ name: "断言报告", url: "#", size: "28.5 KB" }] }
      ] },
      { name: "DW_RISK_PARAM_SYNC", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-19 09:00:30", endedAt: "2026-07-19 09:02:00", logs: [], artifacts: [] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-19 09:02:00", endedAt: "2026-07-19 09:11:00", logs: [], artifacts: [] },
        { name: "测试断言执行", status: "success", startedAt: "2026-07-19 09:11:00", endedAt: "2026-07-19 09:12:00", logs: [], artifacts: [] }
      ] }
    ] },
    { batchDate: "2026-07-18", status: "success", jobs: [
      { name: "DW_RISK_RULE_DAILY", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-18 08:00:00", endedAt: "2026-07-18 08:04:00", logs: [], artifacts: [] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-18 08:04:00", endedAt: "2026-07-18 08:14:00", logs: [], artifacts: [] },
        { name: "测试断言执行", status: "success", startedAt: "2026-07-18 08:14:00", endedAt: "2026-07-18 08:15:30", logs: [], artifacts: [] }
      ] },
      { name: "DW_RISK_PARAM_SYNC", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-18 08:00:30", endedAt: "2026-07-18 08:02:00", logs: [], artifacts: [] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-18 08:02:00", endedAt: "2026-07-18 08:10:00", logs: [], artifacts: [] },
        { name: "测试断言执行", status: "success", startedAt: "2026-07-18 08:10:00", endedAt: "2026-07-18 08:11:00", logs: [], artifacts: [] }
      ] }
    ] }
  ] },
  { batchId: "B20260718001", repo: "etl-trade", branch: "release/1.0", batchDates: ["2026-07-18", "2026-07-17"], runs: [
    { batchDate: "2026-07-18", status: "failed", jobs: [
      { name: "DW_TRADE_DAILY", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-18 10:00:00", endedAt: "2026-07-18 10:06:00", logs: [], artifacts: [] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-18 10:06:00", endedAt: "2026-07-18 10:22:00", logs: [], artifacts: [] },
        { name: "测试断言执行", status: "failed", startedAt: "2026-07-18 10:22:00", endedAt: "2026-07-18 10:23:30", logs: [
          { time: "10:22:01", level: "error", msg: "断言 5 失败: 目标表 dws.trade_summ 与源表 ods.trade_records 金额不一致" }
        ], artifacts: [] }
      ] },
      { name: "DW_TRADE_SETTLEMENT", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-18 10:00:30", endedAt: "2026-07-18 10:05:00", logs: [], artifacts: [] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-18 10:05:00", endedAt: "2026-07-18 10:20:00", logs: [], artifacts: [] },
        { name: "测试断言执行", status: "success", startedAt: "2026-07-18 10:20:00", endedAt: "2026-07-18 10:21:00", logs: [], artifacts: [] }
      ] }
    ] },
    { batchDate: "2026-07-17", status: "success", jobs: [
      { name: "DW_TRADE_DAILY", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-17 10:00:00", endedAt: "2026-07-17 10:05:00", logs: [], artifacts: [] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-17 10:05:00", endedAt: "2026-07-17 10:20:00", logs: [], artifacts: [] },
        { name: "测试断言执行", status: "success", startedAt: "2026-07-17 10:20:00", endedAt: "2026-07-17 10:21:30", logs: [], artifacts: [] }
      ] },
      { name: "DW_TRADE_SETTLEMENT", phases: [
        { name: "测试数据导入", status: "success", startedAt: "2026-07-17 10:00:30", endedAt: "2026-07-17 10:04:00", logs: [], artifacts: [] },
        { name: "测试作业执行", status: "success", startedAt: "2026-07-17 10:04:00", endedAt: "2026-07-17 10:18:00", logs: [], artifacts: [] },
        { name: "测试断言执行", status: "success", startedAt: "2026-07-17 10:18:00", endedAt: "2026-07-17 10:19:30", logs: [], artifacts: [] }
      ] }
    ] }
  ] }
]

// ── 测试报告 ──
export const mockReports = [
  { repo: "etl-risk", branch: "release/2.0", programs: [
    { name: "DW_RISK_RULE_DAILY", totalAssertions: 10, passed: 8, failed: 2, passRate: "80%", lastRun: "2026-07-20 10:30:00" },
    { name: "DW_RISK_PARAM_SYNC", totalAssertions: 5, passed: 5, failed: 0, passRate: "100%", lastRun: "2026-07-20 10:25:00" },
    { name: "DW_RISK_METRIC_AGG", totalAssertions: 8, passed: 6, failed: 2, passRate: "75%", lastRun: "2026-07-20 10:35:00" }
  ] }
]
