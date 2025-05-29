<template>
  <div class="main-layout">
    <!-- 顶部菜单栏 -->
    <header class="header">
      <div class="header-left">
        <!-- 系统标题 -->
        <div class="system-title">
          <h1>YOLO缺陷检测系统</h1>
        </div>
        
        <!-- 主菜单 -->
        <a-menu mode="horizontal" class="header-menu" v-model:selectedKeys="selectedMenuKeys">
          <a-menu-item key="detection" class="menu-item-selected">
            缺陷检测
          </a-menu-item>
          <a-menu-item key="training" disabled>
            模型训练
          </a-menu-item>
          <a-menu-item key="data">
            数据维护
          </a-menu-item>
          <a-menu-item key="settings">
            系统设定
          </a-menu-item>
        </a-menu>
      </div>
      
      <div class="header-right">
        <!-- 附菜单 -->
        <div class="header-tools">
          <a-tooltip title="信息">
            <a-button type="text" size="small" class="tool-btn">
              <a-badge :count="3" size="small">
                <BellOutlined style="color: white;" />
              </a-badge>
            </a-button>
          </a-tooltip>
        </div>
        
        <!-- 用户信息 -->
        <a-dropdown @click="handleUserCommand">
          <span class="user-info">
            <a-avatar :size="32" class="user-avatar">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <span class="username">张弓长</span>
            <DownOutlined class="dropdown-icon" />
          </span>
          <template #overlay>
            <a-menu @click="handleUserCommand" class="user-menu">
              <a-menu-item key="profile">
                <UserOutlined />
                个人信息
              </a-menu-item>
              <a-menu-item key="preferences">
                <SettingOutlined />
                偏好设置
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout" class="logout-item">
                <LogoutOutlined />
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </header>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧图片管理区 -->
      <aside class="left-panel">
        <ImageManager 
          @image-selected="handleImageSelected"
          @images-uploaded="handleImagesUploaded"
        />
      </aside>

      <!-- 中间图片显示区 -->
      <main class="center-panel">
        <ImageViewer 
          :current-image="currentImage"
          :annotations="currentAnnotations"
          @annotation-selected="handleAnnotationSelected"
          @annotation-updated="handleAnnotationUpdated"
          @annotation-created="handleAnnotationCreated"
          ref="imageViewer"
        />
      </main>

      <!-- 右侧缺陷操作区 -->
      <aside class="right-panel">
        <DefectPanel 
          :defects="currentDefects"
          :selected-annotation="selectedAnnotation"
          @defect-selected="handleDefectSelected"
          @annotation-action="handleAnnotationAction"
          @review-action="handleReviewAction"
        />
      </aside>
    </div>

    <!-- 底部状态栏 -->
    <footer class="status-bar">
      <div class="status-left">
        <span class="status-item" :class="{ 'status-online': networkStatus === 'online', 'status-offline': networkStatus === 'offline' }">
          <WifiOutlined v-if="networkStatus === 'online'" />
          <DisconnectOutlined v-else />
          网络连接状况: {{ networkStatus === 'online' ? '正常' : '网络故障' }}
        </span>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import ImageManager from '@/components/ImageManager.vue'
import ImageViewer from '@/components/ImageViewer.vue'
import DefectPanel from '@/components/DefectPanel.vue'
import { 
  DownOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  BellOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

export default {
  name: 'MainLayout',
  components: {
    ImageManager,
    ImageViewer,
    DefectPanel,
    DownOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined,
    WifiOutlined,
    DisconnectOutlined
  },
  setup() {
    const currentImage = ref(null)
    const currentAnnotations = ref([])
    const selectedMenuKeys = ref(['detection'])
    const networkStatus = ref('online')
    const currentDefects = ref([])
    const selectedAnnotation = ref(null)
    const processingStatus = ref('')
    const imageViewer = ref(null)

    // 处理图片选择
    const handleImageSelected = (image) => {
      currentImage.value = image
      currentAnnotations.value = image.annotations || []
      currentDefects.value = image.defects || []
      selectedAnnotation.value = null
    }

    // 处理图片上传
    const handleImagesUploaded = (images) => {
      processingStatus.value = `正在处理 ${images.length} 张图片...`
      // 模拟YOLO处理
      setTimeout(() => {
        processingStatus.value = ''
        message.success(`成功处理 ${images.length} 张图片`)
      }, 3000)
    }

    // 处理标注选择
    const handleAnnotationSelected = (annotation) => {
      selectedAnnotation.value = annotation
    }

    // 处理标注更新
    const handleAnnotationUpdated = (annotation) => {
      const index = currentAnnotations.value.findIndex(a => a.id === annotation.id)
      if (index !== -1) {
        currentAnnotations.value[index] = annotation
      }
    }

    // 处理标注创建
    const handleAnnotationCreated = (annotation) => {
      currentAnnotations.value.push(annotation)
    }

    // 处理缺陷选择
    const handleDefectSelected = (defect) => {
      const annotation = currentAnnotations.value.find(a => a.defectType === defect.type)
      if (annotation) {
        selectedAnnotation.value = annotation
        imageViewer.value?.highlightAnnotation(annotation.id)
      }
    }

    // 处理标注操作
    const handleAnnotationAction = (action, data) => {
      switch (action) {
        case 'add':
          imageViewer.value?.startDrawing()
          break
        case 'edit':
          if (selectedAnnotation.value) {
            imageViewer.value?.editAnnotation(selectedAnnotation.value.id)
          }
          break
        case 'delete':
          if (selectedAnnotation.value) {
            currentAnnotations.value = currentAnnotations.value.filter(
              a => a.id !== selectedAnnotation.value.id
            )
            selectedAnnotation.value = null
          }
          break
      }
    }

    // 处理审核操作
    const handleReviewAction = (action, data) => {
      if (!currentImage.value) return
      
      switch (action) {
        case 'approve':
          currentImage.value.reviewStatus = 'approved'
          message.success('审核通过')
          break
        case 'reject':
          currentImage.value.reviewStatus = 'rejected'
          message.warning('已驳回')
          break
        case 'modify':
          currentImage.value.reviewStatus = 'modified'
          message.info('已标记为修改')
          break
      }
    }

    // 处理用户菜单
    const handleUserCommand = ({ key }) => {
      switch (key) {
        case 'profile':
          message.info('用户信息管理功能开发中')
          break
        case 'logout':
          message.info('登出功能开发中')
          break
      }
    }

    return {
      currentImage,
      currentAnnotations,
      currentDefects,
      selectedAnnotation,
      processingStatus,
      imageViewer,
      selectedMenuKeys,
      networkStatus,
      handleImageSelected,
      handleImagesUploaded,
      handleAnnotationSelected,
      handleAnnotationUpdated,
      handleAnnotationCreated,
      handleDefectSelected,
      handleAnnotationAction,
      handleReviewAction,
      handleUserCommand
    }
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

/* 顶部菜单栏 - Ant Design标准蓝色背景 */
.header {
  height: 48px;
  background-color: #1890ff;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 系统标题 */
.system-title h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

/* 主菜单样式 */
.header-menu {
  background-color: transparent !important;
  border-bottom: none !important;
  margin-left: 0;
}

.header-menu .ant-menu-item,
.header-menu .ant-menu-item > span,
.header-menu .ant-menu-item .ant-menu-title-content {
  height: 48px;
  line-height: 48px;
  color: white !important;
  border-bottom: none !important;
  margin: 0 4px;
  border-right: none !important;
}

/* 常态菜单项hover效果 */
.header-menu .ant-menu-item:not(.ant-menu-item-selected):not(.ant-menu-item-disabled):hover,
.header-menu .ant-menu-item:not(.ant-menu-item-selected):not(.ant-menu-item-disabled):hover > span,
.header-menu .ant-menu-item:not(.ant-menu-item-selected):not(.ant-menu-item-disabled):hover .ant-menu-title-content {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

/* 选中状态 - 缺陷检测，添加白色下划线 */
.header-menu .ant-menu-item-selected,
.header-menu .ant-menu-item-selected > span,
.header-menu .ant-menu-item-selected .ant-menu-title-content {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  font-weight: 600;
  border-bottom: 2px solid white !important;
}

/* 禁用状态 - 模型训练 */
.header-menu .ant-menu-item-disabled,
.header-menu .ant-menu-item-disabled > span,
.header-menu .ant-menu-item-disabled .ant-menu-title-content {
  color: rgba(135, 206, 250, 0.6) !important;
  background-color: transparent !important;
}

.header-menu .ant-menu-item-disabled:hover,
.header-menu .ant-menu-item-disabled:hover > span,
.header-menu .ant-menu-item-disabled:hover .ant-menu-title-content {
  background-color: transparent !important;
  color: rgba(135, 206, 250, 0.6) !important;
}

/* 右侧用户区域 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-tools .tool-btn {
  color: white !important;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: white;
}

.username {
  font-size: 14px;
  color: white;
}

.dropdown-icon {
  color: white;
  font-size: 12px;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧区域 - 固定380px */
.left-panel {
  width: 380px;
  min-width: 380px;
  max-width: 380px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
}

/* 中间区域 - 动态宽度 */
.center-panel {
  flex: 1;
  background-color: var(--bg-primary);
}

/* 右侧区域 - 固定280px */
.right-panel {
  width: 280px;
  min-width: 280px;
  max-width: 280px;
  background-color: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
}

/* 底部状态栏 - 浅灰色背景 */
.status-bar {
  height: 24px;
  background-color: #f5f5f5;
  color: #666;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  border-top: 1px solid var(--border-color);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-online {
  color: #1890ff;
}

.status-offline {
  color: #1890ff;
}
</style>