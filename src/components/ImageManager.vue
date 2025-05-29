<template>
  <div class="image-manager">
    <!-- 板块标题 -->
    <div class="panel-header">
      <h3>图片管理</h3>
    </div>
    
    <!-- 过滤器区域 -->
    <div class="filter-section">
      <div class="filter-row" style="display: flex; gap: 8px; align-items: center;">
        <a-range-picker
          v-model:value="filters.dateRange"
          size="small"
          :placeholder="['起始时间', '终止时间']"
          format="YYYYMMDD"
          value-format="YYYYMMDD"
          style="width: 66.67%; flex: 0 0 66.67%;"
          input-read-only
        />
        <a-select
          v-model:value="filters.reviewStatus"
          mode="multiple"
          placeholder="审核状态"
          size="small"
          style="width: 33.33%; flex: 0 0 33.33%;"
        >
          <a-select-option value="approved">已审核</a-select-option>
          <a-select-option value="rejected">已驳回</a-select-option>
          <a-select-option value="modified">已修改</a-select-option>
          <a-select-option value="pending">待审核</a-select-option>
        </a-select>
      </div>
      
      <div class="filter-row" style="display: flex; gap: 8px; align-items: center;">
        <a-select
          v-model:value="filters.defectTypes"
          mode="multiple"
          placeholder="缺陷类型"
          size="small"
          style="width: 66.67%; flex: 0 0 66.67%;"
        >
          <a-select-option value="hole">孔洞</a-select-option>
          <a-select-option value="crack">裂痕</a-select-option>
          <a-select-option value="bubble">气泡</a-select-option>
          <a-select-option value="rust">锈蚀</a-select-option>
          <a-select-option value="wear">磨损</a-select-option>
          <a-select-option value="burr">毛刺</a-select-option>
          <a-select-option value="dirty">污浊</a-select-option>
          <a-select-option value="other">其他</a-select-option>
        </a-select>
        <a-button type="primary" size="small" @click="applyFilters" style="width: 33.33%; flex: 0 0 33.33%;">
          <SearchOutlined />
          查询
        </a-button>
      </div>
    </div>

    <!-- 视图切换 -->
    <div class="view-toggle">
      <a-radio-group v-model:value="viewMode" size="small">
        <a-radio-button value="list">列表显示</a-radio-button>
        <a-radio-button value="grid">缩略图显示</a-radio-button>
      </a-radio-group>
    </div>

    <!-- 图片列表/网格 -->
    <div class="image-list">
      <a-spin :spinning="loading">
        <!-- 列表视图 -->
        <div v-if="viewMode === 'list'" class="list-view">
          <div class="modern-table">
            <!-- 表格头部 -->
            <div class="table-header">
              <div class="header-cell checkbox-cell">
                <a-checkbox 
                  :indeterminate="selectedRowKeys.length > 0 && selectedRowKeys.length < paginatedImages.length"
                  :checked="isAllSelected"
                  @change="onSelectAll"
                />
              </div>
              <div class="header-cell date-cell">日期</div>
              <div class="header-cell serial-cell">序号</div>
              <div class="header-cell defect-cell">缺陷</div>
              <div class="header-cell status-cell">审核</div>
            </div>
            
            <!-- 表格内容 -->
            <div class="table-body">
              <div 
                v-for="image in paginatedImages" 
                :key="image.id"
                class="table-row"
                :class="{ 'selected': selectedRowKeys.includes(image.id) }"
                @click="handleRowClick(image)"
              >
                <div class="body-cell checkbox-cell">
                  <a-checkbox 
                    :checked="selectedRowKeys.includes(image.id)"
                    @change="(e) => toggleImageSelection(image.id, e.target.checked)"
                    @click.stop
                  />
                </div>
                <div class="body-cell date-cell">{{ formatDate(image.uploadDate) }}</div>
                <div class="body-cell serial-cell">{{ image.serialNumber }}</div>
                <div class="body-cell defect-cell">
                  <div class="defect-indicators">
                    <span 
                      v-for="defect in image.defects" 
                      :key="defect.type"
                      :class="`defect-indicator defect-${defect.type}`"
                      :title="getDefectName(defect.type)"
                    >
                      {{ getDefectAbbr(defect.type) }}
                    </span>
                  </div>
                </div>
                <div class="body-cell status-cell">
                   <a-tag
                     :color="getStatusTagColor(image.reviewStatus)"
                     size="small"
                   >
                     {{ getStatusText(image.reviewStatus) }}
                   </a-tag>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-else class="grid-view">
          <div
            v-for="image in filteredImages"
            :key="image.id"
            class="image-card"
            @click="selectImage(image)"
            :class="{ active: selectedImage?.id === image.id }"
          >
            <div class="image-thumbnail">
              <img :src="image.thumbnail" :alt="image.filename" />
              <div class="thumbnail-checkbox">
                <a-checkbox 
                  :checked="selectedRowKeys.includes(image.id)"
                  @change="(e) => toggleImageSelection(image.id, e.target.checked)"
                  @click.stop
                />
              </div>
            </div>
            <div class="image-info">
              <div class="info-row">
                <span class="date">{{ formatDate(image.uploadDate) }}</span>
                <span class="serial">{{ image.serialNumber }}</span>
              </div>
              <div class="info-row">
                <span class="defect-count">缺陷: {{ image.defects?.length || 0 }}</span>
                <a-tag
                  :color="getStatusTagColor(image.reviewStatus)"
                  size="small"
                >
                  {{ getStatusText(image.reviewStatus) }}
                </a-tag>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <div class="custom-pagination">
        <span>第</span>
        <a-input-number 
          v-model:value="currentPage" 
          :min="1" 
          :max="totalPages"
          size="small"
          style="width: 60px; margin: 0 4px;"
        />
        <span>页/共{{ totalPages }}页</span>
        <div class="page-numbers">
          <a-button 
            size="small" 
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
          >&lt;</a-button>
          <a-button 
            v-for="page in getPageNumbers()" 
            :key="page"
            size="small"
            :type="page === currentPage ? 'primary' : 'default'"
            @click="currentPage = page"
          >{{ page }}</a-button>
          <a-button 
            size="small" 
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
          >&gt;</a-button>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <a-button type="primary" size="small" @click="uploadImages" class="action-btn">
        <UploadOutlined />
        上传
      </a-button>
      <a-button 
        size="small" 
        @click="deleteSelected" 
        class="action-btn delete-btn"
        :type="selectedRowKeys.length > 0 ? 'primary' : 'default'"
        :danger="selectedRowKeys.length > 0"
        :disabled="selectedRowKeys.length === 0"
      >
        <DeleteOutlined />
        删除
      </a-button>
      <a-button 
        size="small" 
        @click="exportData" 
        class="action-btn export-btn"
        :type="selectedRowKeys.length > 0 ? 'primary' : 'default'"
        :disabled="selectedRowKeys.length === 0"
      >
        <DownloadOutlined />
        导出
      </a-button>
    </div>

    <!-- 文件上传对话框 -->
    <a-modal v-model:open="uploadDialogVisible" title="上传图片" width="500px">
      <a-upload-dragger
        v-model:file-list="uploadFileList"
        :before-upload="() => false"
        @change="handleFileChange"
        accept="image/*"
        multiple
      >
        <p class="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="ant-upload-text">
          拖拽文件到此处或点击上传
        </p>
        <p class="ant-upload-hint">
          支持jpg/png格式，单次最多上传50张图片
        </p>
      </a-upload-dragger>
      <template #footer>
        <a-button @click="uploadDialogVisible = false">取消</a-button>
        <a-button type="primary" @click="confirmUpload" :loading="uploading">
          确认上传
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, h } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  SearchOutlined,
  UploadOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  DownloadOutlined,
  InboxOutlined
} from '@ant-design/icons-vue'

export default {
  name: 'ImageManager',
  components: {
    SearchOutlined,
    UploadOutlined,
    CheckSquareOutlined,
    DeleteOutlined,
    DownloadOutlined,
    InboxOutlined
  },
  emits: ['image-selected', 'images-uploaded'],
  setup(props, { emit }) {
    const loading = ref(false)
    const viewMode = ref('list')
    const selectedImage = ref(null)
    const selectedRowKeys = ref([])
    const uploadDialogVisible = ref(false)
    const uploadFileList = ref([])
    const uploading = ref(false)
    const uploadRef = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalImages = ref(20)

    const filters = reactive({
      dateRange: null,
      defectTypes: [],
      reviewStatus: []
    })

    // 模拟图片数据 - 20行数据
    const images = ref([
      {
        id: 1,
        filename: 'sampe_00001.jpg',
        uploadDate: '20250528',
        serialNumber: '00001',
        reviewStatus: 'pending',
        thumbnail: '/images/samples/sampe_00001.jpg',
        url: '/images/samples/sampe_00001.jpg',
        defects: [
          { type: 'hole', confidence: 0.95, bbox: [125, 95, 50, 50] },
          { type: 'crack', confidence: 0.87, bbox: [250, 175, 130, 20] },
          { type: 'rust', confidence: 0.92, bbox: [460, 275, 80, 50] }
        ],
        annotations: [
          {
            id: 'ann1',
            defectType: 'hole',
            bbox: [125, 95, 50, 50],
            confidence: 0.95
          },
          {
            id: 'ann2',
            defectType: 'crack',
            bbox: [250, 175, 130, 20],
            confidence: 0.87
          },
          {
            id: 'ann3',
            defectType: 'rust',
            bbox: [460, 275, 80, 50],
            confidence: 0.92
          }
        ]
      },
      {
        id: 2,
        filename: 'sampe_00002.jpg',
        uploadDate: '20250528',
        serialNumber: '00002',
        reviewStatus: 'approved',
        thumbnail: '/images/samples/sampe_00002.jpg',
        url: '/images/samples/sampe_00002.jpg',
        defects: [
          { type: 'rust', confidence: 0.93, bbox: [320, 150, 160, 100] },
          { type: 'hole', confidence: 0.88, bbox: [90, 85, 80, 70] },
          { type: 'bubble', confidence: 0.82, bbox: [590, 430, 60, 50] }
        ],
        annotations: [
          {
            id: 'ann4',
            defectType: 'rust',
            bbox: [320, 150, 160, 100],
            confidence: 0.93
          },
          {
            id: 'ann5',
            defectType: 'hole',
            bbox: [90, 85, 80, 70],
            confidence: 0.88
          },
          {
            id: 'ann6',
            defectType: 'bubble',
            bbox: [590, 430, 60, 50],
            confidence: 0.82
          }
        ]
      },
      {
        id: 3,
        filename: 'sampe_00003.jpg',
        uploadDate: '20250529',
        serialNumber: '00003',
        reviewStatus: 'rejected',
        thumbnail: '/images/samples/sampe_00003.jpg',
        url: '/images/samples/sampe_00003.jpg',
        defects: [
          { type: 'crack', confidence: 0.91, bbox: [200, 140, 300, 40] },
          { type: 'hole', confidence: 0.96, bbox: [570, 270, 60, 60] },
          { type: 'rust', confidence: 0.85, bbox: [120, 385, 100, 60] },
          { type: 'wear', confidence: 0.79, bbox: [450, 380, 130, 80] }
        ],
        annotations: [
          {
            id: 'ann7',
            defectType: 'crack',
            bbox: [200, 140, 300, 40],
            confidence: 0.91
          },
          {
            id: 'ann8',
            defectType: 'hole',
            bbox: [570, 270, 60, 60],
            confidence: 0.96
          },
          {
            id: 'ann9',
            defectType: 'rust',
            bbox: [120, 385, 100, 60],
            confidence: 0.85
          },
          {
            id: 'ann10',
            defectType: 'wear',
            bbox: [450, 380, 130, 80],
            confidence: 0.79
          }
        ]
      },
      {
        id: 4,
        filename: 'sampe_00004.jpg',
        uploadDate: '20250529',
        serialNumber: '00004',
        reviewStatus: 'pending',
        thumbnail: '/images/samples/sampe_00004.jpg',
        url: '/images/samples/sampe_00004.jpg',
        defects: [
          { type: 'bubble', confidence: 0.89, bbox: [180, 120, 70, 60] },
          { type: 'wear', confidence: 0.84, bbox: [350, 200, 90, 80] }
        ],
        annotations: [
          {
            id: 'ann11',
            defectType: 'bubble',
            bbox: [180, 120, 70, 60],
            confidence: 0.89
          },
          {
            id: 'ann12',
            defectType: 'wear',
            bbox: [350, 200, 90, 80],
            confidence: 0.84
          }
        ]
      },
      {
        id: 5,
        filename: 'sampe_00005.jpg',
        uploadDate: '20250530',
        serialNumber: '00005',
        reviewStatus: 'approved',
        thumbnail: '/images/samples/sampe_00005.jpg',
        url: '/images/samples/sampe_00005.jpg',
        defects: [
          { type: 'hole', confidence: 0.97, bbox: [220, 160, 45, 45] }
        ],
        annotations: [
          {
            id: 'ann13',
            defectType: 'hole',
            bbox: [220, 160, 45, 45],
            confidence: 0.97
          }
        ]
      },
      {
        id: 6,
        filename: 'sampe_00006.jpg',
        uploadDate: '20250530',
        serialNumber: '00006',
        reviewStatus: 'pending',
        thumbnail: '/images/samples/sampe_00001.jpg',
        url: '/images/samples/sampe_00001.jpg',
        defects: [
          { type: 'crack', confidence: 0.88, bbox: [300, 200, 150, 30] },
          { type: 'bubble', confidence: 0.76, bbox: [100, 350, 40, 40] }
        ],
        annotations: []
      },
      {
        id: 7,
        filename: 'sampe_00007.jpg',
        uploadDate: '20250530',
        serialNumber: '00007',
        reviewStatus: 'approved',
        thumbnail: '/images/samples/sampe_00002.jpg',
        url: '/images/samples/sampe_00002.jpg',
        defects: [
          { type: 'rust', confidence: 0.94, bbox: [400, 100, 120, 80] }
        ],
        annotations: []
      },
      {
        id: 8,
        filename: 'sampe_00008.jpg',
        uploadDate: '20250531',
        serialNumber: '00008',
        reviewStatus: 'rejected',
        thumbnail: '/images/samples/sampe_00003.jpg',
        url: '/images/samples/sampe_00003.jpg',
        defects: [
          { type: 'wear', confidence: 0.83, bbox: [200, 300, 100, 60] },
          { type: 'hole', confidence: 0.91, bbox: [500, 150, 35, 35] }
        ],
        annotations: []
      },
      {
        id: 9,
        filename: 'sampe_00009.jpg',
        uploadDate: '20250531',
        serialNumber: '00009',
        reviewStatus: 'pending',
        thumbnail: '/images/samples/sampe_00004.jpg',
        url: '/images/samples/sampe_00004.jpg',
        defects: [
          { type: 'bubble', confidence: 0.87, bbox: [250, 180, 50, 50] }
        ],
        annotations: []
      },
      {
        id: 10,
        filename: 'sampe_00010.jpg',
        uploadDate: '20250531',
        serialNumber: '00010',
        reviewStatus: 'approved',
        thumbnail: '/images/samples/sampe_00005.jpg',
        url: '/images/samples/sampe_00005.jpg',
        defects: [
          { type: 'crack', confidence: 0.92, bbox: [150, 250, 200, 25] },
          { type: 'rust', confidence: 0.89, bbox: [400, 350, 90, 70] }
        ],
        annotations: []
      },
      {
        id: 11,
        filename: 'sampe_00011.jpg',
        uploadDate: '20250601',
        serialNumber: '00011',
        reviewStatus: 'pending',
        thumbnail: '/images/samples/sampe_00001.jpg',
        url: '/images/samples/sampe_00001.jpg',
        defects: [
          { type: 'hole', confidence: 0.96, bbox: [320, 120, 40, 40] }
        ],
        annotations: []
      },
      {
        id: 12,
        filename: 'sampe_00012.jpg',
        uploadDate: '20250601',
        serialNumber: '00012',
        reviewStatus: 'approved',
        thumbnail: '/images/samples/sampe_00002.jpg',
        url: '/images/samples/sampe_00002.jpg',
        defects: [
          { type: 'wear', confidence: 0.85, bbox: [180, 280, 110, 70] },
          { type: 'bubble', confidence: 0.78, bbox: [450, 200, 45, 45] }
        ],
        annotations: []
      },
      {
        id: 13,
        filename: 'sampe_00013.jpg',
        uploadDate: '20250601',
        serialNumber: '00013',
        reviewStatus: 'rejected',
        thumbnail: '/images/samples/sampe_00003.jpg',
        url: '/images/samples/sampe_00003.jpg',
        defects: [
          { type: 'crack', confidence: 0.90, bbox: [100, 150, 250, 35] },
          { type: 'hole', confidence: 0.93, bbox: [400, 300, 50, 50] },
          { type: 'rust', confidence: 0.86, bbox: [200, 400, 80, 60] }
        ],
        annotations: []
      },
      {
        id: 14,
        filename: 'sampe_00014.jpg',
        uploadDate: '20250602',
        serialNumber: '00014',
        reviewStatus: 'pending',
        thumbnail: '/images/samples/sampe_00004.jpg',
        url: '/images/samples/sampe_00004.jpg',
        defects: [
          { type: 'bubble', confidence: 0.81, bbox: [300, 250, 55, 55] }
        ],
        annotations: []
      },
      {
        id: 15,
        filename: 'sampe_00015.jpg',
        uploadDate: '20250602',
        serialNumber: '00015',
        reviewStatus: 'approved',
        thumbnail: '/images/samples/sampe_00005.jpg',
        url: '/images/samples/sampe_00005.jpg',
        defects: [
          { type: 'wear', confidence: 0.87, bbox: [150, 180, 120, 80] },
          { type: 'crack', confidence: 0.89, bbox: [350, 320, 180, 30] }
        ],
        annotations: []
      },
      {
        id: 16,
        filename: 'sampe_00016.jpg',
        uploadDate: '20250602',
        serialNumber: '00016',
        reviewStatus: 'pending',
        thumbnail: '/images/samples/sampe_00001.jpg',
        url: '/images/samples/sampe_00001.jpg',
        defects: [
          { type: 'rust', confidence: 0.95, bbox: [250, 200, 140, 90] }
        ],
        annotations: []
      },
      {
        id: 17,
        filename: 'sampe_00017.jpg',
        uploadDate: '20250603',
        serialNumber: '00017',
        reviewStatus: 'approved',
        thumbnail: '/images/samples/sampe_00002.jpg',
        url: '/images/samples/sampe_00002.jpg',
        defects: [
          { type: 'hole', confidence: 0.94, bbox: [180, 150, 45, 45] },
          { type: 'bubble', confidence: 0.83, bbox: [400, 280, 50, 50] }
        ],
        annotations: []
      },
      {
        id: 18,
        filename: 'sampe_00018.jpg',
        uploadDate: '20250603',
        serialNumber: '00018',
        reviewStatus: 'rejected',
        thumbnail: '/images/samples/sampe_00003.jpg',
        url: '/images/samples/sampe_00003.jpg',
        defects: [
          { type: 'crack', confidence: 0.88, bbox: [120, 220, 220, 28] },
          { type: 'wear', confidence: 0.82, bbox: [380, 350, 100, 65] }
        ],
        annotations: []
      },
      {
        id: 19,
        filename: 'sampe_00019.jpg',
        uploadDate: '20250603',
        serialNumber: '00019',
        reviewStatus: 'pending',
        thumbnail: '/images/samples/sampe_00004.jpg',
        url: '/images/samples/sampe_00004.jpg',
        defects: [
          { type: 'rust', confidence: 0.91, bbox: [200, 180, 130, 85] },
          { type: 'hole', confidence: 0.89, bbox: [450, 250, 40, 40] }
        ],
        annotations: []
      },
      {
        id: 20,
        filename: 'sampe_00020.jpg',
        uploadDate: '20250604',
        serialNumber: '00020',
        reviewStatus: 'approved',
        thumbnail: '/images/samples/sampe_00005.jpg',
        url: '/images/samples/sampe_00005.jpg',
        defects: [
          { type: 'bubble', confidence: 0.86, bbox: [280, 200, 60, 60] },
          { type: 'crack', confidence: 0.93, bbox: [150, 300, 200, 32] },
          { type: 'wear', confidence: 0.80, bbox: [400, 150, 95, 70] }
        ],
        annotations: []
      }
    ])

    // 过滤后的图片
    const filteredImages = computed(() => {
      let result = images.value

      if (filters.dateRange && filters.dateRange.length === 2) {
        const [start, end] = filters.dateRange
        result = result.filter(img => 
          img.uploadDate >= start && img.uploadDate <= end
        )
      }

      if (filters.defectTypes.length > 0) {
        result = result.filter(img =>
          img.defects.some(defect => filters.defectTypes.includes(defect.type))
        )
      }

      if (filters.reviewStatus.length > 0) {
        result = result.filter(img =>
          filters.reviewStatus.includes(img.reviewStatus)
        )
      }

      return result
    })

    // 计算每页可显示的行数（基于可用高度）
    const rowsPerPage = computed(() => {
      // 假设每行高度为 48px，表头高度为 48px，其他UI元素占用约 420px
      const availableHeight = window.innerHeight - 420
      const tableHeaderHeight = 48
      const rowHeight = 48
      const maxRows = Math.floor((availableHeight - tableHeaderHeight) / rowHeight)
      return Math.max(5, maxRows) // 最少显示5行
    })

    // 分页后的图片数据
    const paginatedImages = computed(() => {
      const start = (currentPage.value - 1) * rowsPerPage.value
      const end = start + rowsPerPage.value
      return filteredImages.value.slice(start, end)
    })

    // 总页数
    const totalPages = computed(() => {
      return Math.ceil(filteredImages.value.length / rowsPerPage.value)
    })

    // 全选状态计算
    const isAllSelected = computed(() => {
      if (paginatedImages.value.length === 0) return false
      return paginatedImages.value.every(img => selectedRowKeys.value.includes(img.id))
    })

    // 监听窗口大小变化
    const updateRowsPerPage = () => {
      // 触发rowsPerPage的重新计算
    }

    onMounted(() => {
      window.addEventListener('resize', updateRowsPerPage)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', updateRowsPerPage)
    })

    // 选择图片
    const selectImage = (image) => {
      selectedImage.value = image
      emit('image-selected', image)
    }

    // 应用过滤器
    const applyFilters = () => {
      // 过滤逻辑已在computed中实现
      message.success('过滤器已应用')
    }

    // 格式化日期显示
    const formatDate = (dateStr) => {
      return dateStr
    }

    // 行选择变化
    const onSelectChange = (selectedKeys) => {
      selectedRowKeys.value = selectedKeys
    }

    // 全选处理
    const onSelectAll = (e) => {
      const checked = e.target.checked
      if (checked) {
        // 全选当前页的所有图片
        const currentPageIds = paginatedImages.value.map(img => img.id)
        selectedRowKeys.value = [...new Set([...selectedRowKeys.value, ...currentPageIds])]
      } else {
        // 取消选择当前页的所有图片
        const currentPageIds = paginatedImages.value.map(img => img.id)
        selectedRowKeys.value = selectedRowKeys.value.filter(id => !currentPageIds.includes(id))
      }
    }

    // 处理行点击
    const handleRowClick = (record) => {
      // 只选择图片进行显示，不影响复选框状态
      selectImage(record)
    }

    // 获取翻页数字
    const getPageNumbers = () => {
      const totalPages = Math.ceil(totalImages.value / pageSize.value)
      const current = currentPage.value
      const pages = []
      
      // 显示当前页前后2页
      const start = Math.max(1, current - 2)
      const end = Math.min(totalPages, current + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    }

    // 切换图片选择状态
    const toggleImageSelection = (imageId, checked) => {
      if (checked) {
        if (!selectedRowKeys.value.includes(imageId)) {
          selectedRowKeys.value.push(imageId)
        }
      } else {
        selectedRowKeys.value = selectedRowKeys.value.filter(id => id !== imageId)
      }
    }

    // 获取行样式类名
    const getRowClassName = (record) => {
      return selectedImage.value?.id === record.id ? 'selected-row' : ''
    }









    // 上传图片
    const uploadImages = () => {
      uploadDialogVisible.value = true
      uploadFileList.value = []
    }

    // 处理文件变化
    const handleFileChange = ({ fileList }) => {
      if (fileList.length > 50) {
        message.warning('单次最多上传50张图片')
        uploadFileList.value = fileList.slice(0, 50)
      } else {
        uploadFileList.value = fileList
      }
    }

    // 确认上传
    const confirmUpload = async () => {
      if (uploadFileList.value.length === 0) {
        message.warning('请选择要上传的文件')
        return
      }

      uploading.value = true
      try {
        // 模拟上传过程
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 添加到图片列表
        const newImages = uploadFileList.value.map((file, index) => ({
          id: Date.now() + index,
          filename: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          reviewStatus: 'pending',
          thumbnail: URL.createObjectURL(file.raw),
          url: URL.createObjectURL(file.raw),
          defects: [],
          annotations: []
        }))
        
        images.value.unshift(...newImages)
        emit('images-uploaded', newImages)
        
        uploadDialogVisible.value = false
        uploadFileList.value = []
        message.success(`成功上传 ${newImages.length} 张图片`)
      } catch (error) {
        message.error('上传失败')
      } finally {
        uploading.value = false
      }
    }

    // 删除选中的图片
    const deleteSelected = async () => {
      if (selectedRowKeys.value.length === 0) {
        message.warning('请选择要删除的图片')
        return
      }

      Modal.confirm({
        title: '确认删除',
        content: `确定要删除选中的 ${selectedRowKeys.value.length} 张图片吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk() {
          // 执行删除
          images.value = images.value.filter(img => !selectedRowKeys.value.includes(img.id))
          selectedRowKeys.value = []
          
          message.success('删除成功')
        }
      })
    }

    // 导出数据
    const exportData = () => {
      message.info('导出功能开发中')
    }

    // 获取状态标签颜色
    const getStatusTagColor = (status) => {
      const colors = {
        pending: 'default',
        approved: 'success',
        rejected: 'error',
        modified: 'warning'
      }
      return colors[status] || 'default'
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const texts = {
        pending: '待审',
        approved: '已审',
        rejected: '驳回',
        modified: '修改'
      }
      return texts[status] || status
    }

    // 获取缺陷名称
    const getDefectName = (type) => {
      const names = {
        hole: '孔洞',
        crack: '裂痕',
        bubble: '气泡',
        rust: '锈蚀',
        wear: '磨损'
      }
      return names[type] || type
    }

    // 获取缺陷缩写
    const getDefectAbbr = (type) => {
      const abbrs = {
        hole: 'H',
        crack: 'C',
        bubble: 'B',
        rust: 'R',
        wear: 'W'
      }
      return abbrs[type] || type.charAt(0).toUpperCase()
    }

    // 定义表格列
    const columns = computed(() => [
      {
        title: '日期',
        dataIndex: 'uploadDate',
        width: 80,
        customRender: ({ text }) => formatDate(text)
      },
      {
        title: '序号',
        dataIndex: 'serialNumber',
        width: 60
      },
      {
        title: '缺陷',
        dataIndex: 'defects',
        width: 80,
        customRender: ({ record }) => {
          return h('div', { class: 'defect-indicators' },
            record.defects.map(defect =>
              h('span', {
                key: defect.type,
                class: `defect-indicator defect-${defect.type}`,
                title: getDefectName(defect.type)
              }, [getDefectAbbr(defect.type)])
            )
          )
        }
      },
      {
        title: '审核',
        dataIndex: 'reviewStatus',
        width: 60,
        customRender: ({ text }) => {
          return h('a-tag', {
            color: getStatusTagColor(text),
            size: 'small'
          }, [getStatusText(text)])
        }
      }
    ])

    onMounted(() => {
      // 默认选择第一张图片
      if (images.value.length > 0) {
        selectImage(images.value[0])
      }
    })

    return {
      loading,
      viewMode,
      selectedImage,
      uploadDialogVisible,
      uploadFileList,
      uploading,
      uploadRef,
      filters,
      images,
      filteredImages,
      paginatedImages,
      currentPage,
      pageSize,
      totalImages,
      rowsPerPage,
      totalPages,
      isAllSelected,
      selectedRowKeys,
      columns,
      selectImage,
      applyFilters,
      formatDate,
      onSelectChange,
      onSelectAll,
      handleRowClick,
      getPageNumbers,
      toggleImageSelection,
      getRowClassName,
      getDefectName,
      getDefectAbbr,
      getStatusText,
      getStatusTagColor,
      uploadImages,
      handleFileChange,
      confirmUpload,
      deleteSelected,
      exportData
    }
  }
}
</script>

<style scoped>
.image-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.panel-header h3 {
  font-size: 14px;
  font-weight: normal;
  margin: 0;
  margin-bottom: 16px;
  color: black;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-row {
  margin-bottom: 8px;
}

.view-toggle {
  margin-bottom: 16px;
  text-align: center;
}

.image-list {
  flex: 1;
  overflow: hidden;
  margin-bottom: 16px;
}

.list-view {
  height: 100%;
  overflow-y: auto;
}

.grid-view {
  height: 100%;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 8px;
}

/* 为网格视图添加鼠标滚轮支持 */
.grid-view {
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 */
.list-view::-webkit-scrollbar,
.grid-view::-webkit-scrollbar {
  width: 8px;
}

.list-view::-webkit-scrollbar-track,
.grid-view::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.list-view::-webkit-scrollbar-thumb,
.grid-view::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.list-view::-webkit-scrollbar-thumb:hover,
.grid-view::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 现代化表格样式 */
.modern-table {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-header {
  display: grid;
  grid-template-columns: 40px 80px 60px 1fr 80px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 500;
  font-size: 12px;
  color: #262626;
}

.table-body {
  max-height: calc(100vh - 420px);
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 40px 80px 60px 1fr 80px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s;
  cursor: pointer;
}

.table-row:hover {
  background-color: #f5f5f5;
}

.table-row.selected {
  background-color: #e6f7ff;
}

.table-row:last-child {
  border-bottom: none;
}

.header-cell,
.body-cell {
  padding: 12px 8px;
  display: flex;
  align-items: center;
  font-size: 12px;
  border-right: 1px solid #f0f0f0;
}

.header-cell:last-child,
.body-cell:last-child {
  border-right: none;
}

.checkbox-cell {
  justify-content: center;
}

.date-cell {
  color: #666;
}

.serial-cell {
  font-weight: 500;
  color: #262626;
}

.defect-cell {
  justify-content: flex-start;
}

.status-cell {
  justify-content: center;
}

.action-cell {
  justify-content: center;
}

.image-card {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.image-card:hover {
  border-color: #1890ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-card.active {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.image-thumbnail {
  height: 80px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  position: relative;
}

.image-thumbnail img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.thumbnail-checkbox {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  padding: 2px;
}

.image-info {
  padding: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.date {
  font-size: 10px;
  color: #666;
}

.serial {
  font-size: 10px;
  font-weight: 500;
}

.defect-count {
  font-size: 10px;
  color: #666;
}

.defect-indicators {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}

.defect-indicator {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  text-align: center;
  line-height: 16px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.defect-hole { background-color: #ff4d4f; }
.defect-crack { background-color: #faad14; color: #fff; }
.defect-bubble { background-color: #1890ff; }
.defect-rust { background-color: #fa8c16; }
.defect-wear { background-color: #722ed1; }

.selected-row {
  background-color: #e6f7ff !important;
}

.pagination-section {
  margin-bottom: 16px;
  text-align: center;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.delete-btn {
  border: 1px solid #ff4d4f !important;
  color: #ff4d4f !important;
  background-color: #fff !important;
}

.delete-btn:hover:not(:disabled) {
  background-color: #ff4d4f !important;
  color: #fff !important;
}

.delete-btn:disabled {
  color: #bfbfbf !important;
  background-color: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
}

.export-btn:disabled {
  color: #bfbfbf !important;
  background-color: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
}

.gray-table {
  background-color: #f5f5f5;
}

.gray-table .ant-table-tbody > tr > td {
  background-color: #f5f5f5;
}

.gray-table .ant-table-tbody > tr:hover > td {
  background-color: #e6f7ff !important;
}

.gray-table .ant-table-tbody > tr.selected-row > td {
  background-color: #e6f7ff !important;
}

.custom-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
}

.page-numbers {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.page-numbers .ant-btn {
  min-width: 24px;
  height: 24px;
  padding: 0;
  font-size: 12px;
}
</style>