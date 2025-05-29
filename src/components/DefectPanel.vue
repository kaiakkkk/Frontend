<template>
  <div class="defect-panel">
    <!-- 缺陷列表 -->
    <div class="defect-section">
      <div class="section-header">
        <h3>缺陷列表</h3>
      </div>
      
      <div class="defect-table">
        <a-table
          :data-source="defectTableData"
          :columns="defectColumns"
          :pagination="false"
          size="small"
          :show-header="false"
          :row-class-name="getDefectRowClassName"
          :custom-row="customRow"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'type'">
              <div class="defect-type-cell" v-if="record.typeName">
                {{ record.typeName }}
              </div>
            </template>
            <template v-else-if="column.key === 'name'">
              <div class="defect-name-cell">
                {{ record.name }}
              </div>
            </template>
            <template v-else-if="column.key === 'confidence'">
              <div class="confidence-cell" v-if="!record.isTypeRow">
                <span v-if="record.confidence !== null">
                  {{ (record.confidence * 100).toFixed(1) }}%
                </span>
                <span v-else class="manual-label"></span>
              </div>
            </template>
            <template v-else-if="column.key === 'action'">
              <div class="action-cell">
                <a-button 
                  v-if="!record.isTypeRow && record.name"
                  type="link" 
                  danger 
                  size="small"
                  @click="deleteDefect(record)"
                >
                  删除
                </a-button>
                <a-button 
                  v-else-if="!record.isTypeRow"
                  type="link" 
                  size="small"
                  @click="addDefect(record.type)"
                >
                  新增
                </a-button>
              </div>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 选中标注详情 -->
    <div class="annotation-section" v-if="selectedAnnotation">
      <div class="section-header">
        <h3>标注详情</h3>
      </div>
      
      <div class="annotation-details">
        <div class="detail-row">
          <label>缺陷类型:</label>
          <a-select
            v-model:value="selectedAnnotation.defectType"
            size="small"
            @change="updateAnnotation"
          >
            <a-select-option
              v-for="defect in defectTypes"
              :key="defect.type"
              :label="defect.name"
              :value="defect.type"
            >
              {{ defect.name }}
            </a-select-option>
          </a-select>
        </div>
        
        <div class="detail-row">
          <label>置信度:</label>
          <a-slider
            v-model:value="selectedAnnotation.confidence"
            :min="0"
            :max="1"
            :step="0.01"
            :tip-formatter="formatConfidence"
            @change="updateAnnotation"
          />
        </div>
        
        <div class="detail-row">
          <label>位置:</label>
          <div class="bbox-info">
            <span>X: {{ Math.round(selectedAnnotation.bbox[0]) }}</span>
            <span>Y: {{ Math.round(selectedAnnotation.bbox[1]) }}</span>
            <span>W: {{ Math.round(selectedAnnotation.bbox[2]) }}</span>
            <span>H: {{ Math.round(selectedAnnotation.bbox[3]) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 人工审核备注 -->
    <div class="review-section">
      <div class="section-header">
        <h3>审核备注</h3>
      </div>
      
      <!-- 查看区域 -->
      <div class="review-history">
        <div class="history-item" v-for="item in reviewHistory" :key="item.id">
          <div class="history-header">
            <span class="reviewer">{{ item.reviewer }}</span>
            <span class="review-date">{{ item.date }}</span>
          </div>
          <div class="history-content">{{ item.content }}</div>
        </div>
        <div v-if="reviewHistory.length === 0" class="no-history">
          暂无审核记录
        </div>
      </div>
      
      <!-- 填写区域 -->
      <div class="review-input">
        <a-textarea
          v-model:value="reviewNotes"
          :rows="3"
          placeholder="请输入审核备注..."
          resize="none"
        />
      </div>
    </div>

    <!-- 审核操作 -->
    <div class="review-actions">
      <div class="action-buttons">
        <a-button
          type="primary"
          size="small"
          @click="submitReview"
          style="width: 100%"
        >
          <CheckOutlined />
          提交
        </a-button>
        
        <a-button
          size="small"
          @click="approveReview"
          style="width: 100%; background-color: #52c41a; border-color: #52c41a; color: white;"
        >
          <CheckOutlined />
          审核
        </a-button>
        
        <a-button
          danger
          size="small"
          @click="rejectReview"
          style="width: 100%"
        >
          <CloseOutlined />
          驳回
        </a-button>
      </div>
    </div>

    <!-- 快捷键说明已删除 -->
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'

export default {
  name: 'DefectPanel',
  components: {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckOutlined,
    CloseOutlined
  },
  props: {
    defects: {
      type: Array,
      default: () => []
    },
    selectedAnnotation: {
      type: Object,
      default: null
    }
  },
  emits: ['defect-selected', 'annotation-action', 'review-action'],
  setup(props, { emit }) {
    const selectedDefectType = ref('')
    const reviewNotes = ref('')
    
    // 缺陷类型定义
    const defectTypes = [
      { type: 'hole', name: '孔洞' },
      { type: 'crack', name: '裂痕' },
      { type: 'rust', name: '锈蚀' },
      { type: 'scratch', name: '划痕' },
      { type: 'burr', name: '毛刺' },
      { type: 'stain', name: '污浊' },
      { type: 'other', name: '其他' }
    ]

    // 审核历史记录
    const reviewHistory = ref([
      {
        id: 1,
        reviewer: '李木子',
        date: '2025-4-11',
        content: '新增标注"锈蚀1"，备注内容：疑似为遗留助焊剂溢出导致的锈蚀'
      }
    ])

    // 表格列定义
    const defectColumns = [
      { key: 'type', width: 80 },
      { key: 'name', width: 100 },
      { key: 'confidence', width: 80 },
      { key: 'action', width: 60 }
    ]

    // 生成缺陷表格数据
    const defectTableData = computed(() => {
      const tableData = []
      
      defectTypes.forEach(defectType => {
        // 获取该类型的缺陷实例
        const defectsOfType = props.defects.filter(d => d.type === defectType.type)
        
        if (defectsOfType.length > 0) {
          // 添加具体缺陷行
          defectsOfType.forEach((defect, index) => {
            tableData.push({
              key: `defect-${defectType.type}-${index}`,
              type: defectType.type,
              typeName: index === 0 ? defectType.name : '', // 只在第一行显示类型名称
              name: `${defectType.name}${index + 1}`,
              confidence: defect.confidence,
              isTypeRow: false,
              isFirstOfType: index === 0,
              typeRowSpan: defectsOfType.length + 1, // 包含人工标注行
              defectData: defect
            })
          })
        }
        
        // 添加人工标注行
        tableData.push({
          key: `manual-${defectType.type}`,
          type: defectType.type,
          typeName: defectsOfType.length === 0 ? defectType.name : '', // 如果没有AI检测结果，显示类型名称
          name: '人工标注',
          confidence: null,
          isTypeRow: false,
          isFirstOfType: defectsOfType.length === 0,
          typeRowSpan: defectsOfType.length === 0 ? 1 : 0 // 如果是唯一行则跨度为1
        })
      })
      
      return tableData
    })

    // 获取缺陷数量
    const getDefectCount = (type) => {
      return props.defects.filter(d => d.type === type).length
    }

    // 获取缺陷置信度
    const getDefectConfidence = (type) => {
      const defectsOfType = props.defects.filter(d => d.type === type)
      if (defectsOfType.length === 0) return 0
      
      const avgConfidence = defectsOfType.reduce((sum, d) => sum + d.confidence, 0) / defectsOfType.length
      return avgConfidence
    }

    // 获取表格行样式
    const getDefectRowClassName = (record) => {
      return 'defect-item-row'
    }

    // 自定义行属性
    const customRow = (record) => {
      return {
        style: {
          height: '28px' // 缩小行高
        }
      }
    }

    // 获取置信度颜色
    const getConfidenceColor = (confidence) => {
      if (confidence >= 0.8) return '#67c23a'
      if (confidence >= 0.6) return '#e6a23c'
      return '#f56c6c'
    }

    // 格式化置信度
    const formatConfidence = (value) => {
      return `${Math.round(value * 100)}%`
    }

    // 选择缺陷类型
    const selectDefectType = (type) => {
      selectedDefectType.value = type
      emit('defect-selected', { type })
    }

    // 更新标注
    const updateAnnotation = () => {
      if (props.selectedAnnotation) {
        emit('annotation-action', 'update', props.selectedAnnotation)
      }
    }

    // 新增缺陷
    const addDefect = (type) => {
      emit('defect-action', 'add', { type })
      message.success('请在图片上绘制缺陷区域')
    }

    // 删除缺陷
    const deleteDefect = (record) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除"${record.name}"吗？`,
        onOk() {
          emit('defect-action', 'delete', record.defectData)
          message.success('删除成功')
        }
      })
    }

    // 提交审核
    const submitReview = () => {
      if (!reviewNotes.value.trim()) {
        message.warning('请填写审核备注')
        return
      }
      
      emit('review-action', 'submit', {
        notes: reviewNotes.value
      })
      message.success('提交成功')
      
      // 添加到审核历史
      reviewHistory.value.push({
        id: Date.now(),
        reviewer: '张弓长',
        date: new Date().toLocaleDateString('zh-CN'),
        content: reviewNotes.value
      })
      
      reviewNotes.value = ''
    }

    // 审核操作
    const approveReview = () => {
      Modal.confirm({
        title: '审核确认',
        content: '确定要审核通过当前图片吗？',
        okText: '确定',
        cancelText: '取消',
        onOk() {
          emit('review-action', 'approve', {
            notes: reviewNotes.value
          })
          reviewNotes.value = ''
        }
      })
    }

    const rejectReview = () => {
      if (!reviewNotes.value.trim()) {
        message.warning('请填写驳回原因')
        return
      }
      
      Modal.confirm({
        title: '驳回确认',
        content: '确定要驳回当前图片吗？',
        okText: '确定',
        cancelText: '取消',
        onOk() {
          emit('review-action', 'reject', {
            notes: reviewNotes.value
          })
          reviewNotes.value = ''
        }
      })
    }

    // 监听选中标注变化
    watch(() => props.selectedAnnotation, (newAnnotation) => {
      if (newAnnotation) {
        selectedDefectType.value = newAnnotation.defectType
      }
    })

    return {
      selectedDefectType,
      reviewNotes,
      defectTypes,
      getDefectCount,
      getDefectConfidence,
      getConfidenceColor,
      formatConfidence,
      selectDefectType,
      updateAnnotation,
      addDefect,
      deleteDefect,
      submitReview,
      approveReview,
      rejectReview,
      defectTableData,
      defectColumns,
      getDefectRowClassName,
      customRow,
      reviewHistory
    }
  }
}
</script>

<style scoped>
.defect-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
}

.defect-section,
.annotation-section,
.review-section,
.review-actions,
.shortcuts-section {
  background: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

/* 缺陷表格样式 */
.defect-table {
  max-height: 300px;
  overflow-y: auto;
}

.defect-table :deep(.ant-table-tbody > tr > td) {
  padding: 4px 8px !important;
  border-bottom: 1px solid #f0f0f0;
}

.defect-table :deep(.ant-table-tbody > tr) {
  height: 28px;
}

.defect-type-cell {
  font-weight: 600;
  color: #262626;
}

.defect-name-cell {
  font-size: 12px;
}

.confidence-cell {
  font-size: 12px;
  color: #666;
}

.defect-table :deep(.ant-table) {
  font-size: 12px;
}

.defect-table :deep(.ant-table-tbody > tr.defect-type-row) {
  background-color: #f0f2f5;
  font-weight: 600;
}

.defect-table :deep(.ant-table-tbody > tr.defect-type-row:hover) {
  background-color: #f0f2f5 !important;
}

.defect-table :deep(.ant-table-tbody > tr.defect-item-row:hover) {
  background-color: #f5f5f5;
}

.defect-table :deep(.ant-table-tbody > tr.defect-add-row) {
  background-color: #fafafa;
}

.defect-table :deep(.ant-table-tbody > tr.defect-add-row:hover) {
  background-color: #f0f8ff;
}

.defect-type-cell {
  font-weight: 600;
  color: #1890ff;
  padding: 4px 0;
}

.defect-name-cell {
  padding: 4px 0;
}

.confidence-cell {
  font-size: 11px;
  color: #666;
}

.manual-label {
  color: #52c41a;
  font-weight: 500;
}

.action-cell {
  text-align: center;
}

/* 审核历史样式 */
.review-history {
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 8px;
}

.history-item {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.reviewer {
  font-weight: 500;
  color: #1890ff;
  font-size: 12px;
}

.review-date {
  font-size: 11px;
  color: #999;
}

.history-content {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.no-history {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 20px 0;
}

.review-input {
  margin-top: 8px;
}

.annotation-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.bbox-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 12px;
  color: #262626;
}

.bbox-info span {
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: center;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.shortcut-item .key {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-weight: 500;
}

.shortcut-item .desc {
  color: #8c8c8c;
}
</style>