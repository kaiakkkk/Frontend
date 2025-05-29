<template>
  <div class="image-viewer">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <a-button-group size="small">
          <a-button @click="zoomIn" :disabled="!currentImage">
            <ZoomInOutlined />
          </a-button>
          <a-button @click="zoomOut" :disabled="!currentImage">
            <ZoomOutOutlined />
          </a-button>
          <a-button @click="resetZoom" :disabled="!currentImage">
            <FullscreenOutlined />
            适合
          </a-button>
          <a-button @click="actualSize" :disabled="!currentImage">
            1:1
          </a-button>
        </a-button-group>
      </div>
      <div class="toolbar-center">
        <span v-if="currentImage" class="zoom-info">
          {{ Math.round(zoomLevel * 100) }}%
        </span>
      </div>
      <div class="toolbar-right">
        <!-- 绘制标注按钮已删除 -->
      </div>
    </div>

    <!-- 图片显示区域 -->
    <div class="image-container" ref="containerRef">
      <div
        class="image-canvas"
        ref="canvasRef"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
        :style="{
          transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
          transformOrigin: 'center center'
        }"
      >
        <!-- 主图片 -->
        <img
          v-if="currentImage"
          :src="currentImage.url"
          :alt="currentImage.filename"
          ref="imageRef"
          @load="handleImageLoad"
          draggable="false"
          style="display: block; max-width: none; user-select: none; -webkit-user-drag: none;"
        />

        <!-- 缺陷标注 -->
        <div
          v-for="annotation in annotations"
          :key="annotation.id"
          class="annotation"
          :class="{
            selected: selectedAnnotation?.id === annotation.id,
            [`defect-${annotation.defectType}`]: true
          }"
          :style="getAnnotationStyle(annotation)"
          @mousedown.stop="selectAnnotation(annotation)"
        >
          <!-- 标注框 -->
          <div class="annotation-box"></div>
          
          <!-- 标签 -->
          <div 
            class="annotation-label" 
            :class="`defect-${annotation.defectType}`"
            @mousedown.stop="startDragAnnotation(annotation, $event)"
          >
            {{ getDefectName(annotation.defectType) }}
          </div>

          <!-- 控制点 -->
          <div
            v-if="selectedAnnotation === annotation"
            class="control-points"
            :style="{ '--zoom-level': zoomLevel }"
          >
            <div
              v-for="point in controlPoints"
              :key="point"
              :class="`control-point ${point}`"
              @mousedown.stop="startResize(annotation, point, $event)"
            ></div>
          </div>
        </div>

        <!-- 绘制中的标注 -->
        <div
          v-if="drawingAnnotation"
          class="annotation drawing"
          :style="getDrawingAnnotationStyle()"
        >
          <div class="annotation-box"></div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <LoadingOutlined class="loading-icon" />
        <span>加载中...</span>
      </div>

      <!-- 空状态 -->
      <div v-if="!currentImage && !loading" class="empty-state">
        <PictureOutlined />
        <p>请从左侧选择图片</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  EditOutlined,
  LoadingOutlined,
  PictureOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

export default {
  name: 'ImageViewer',
  components: {
    ZoomInOutlined,
    ZoomOutOutlined,
    FullscreenOutlined,
    EditOutlined,
    LoadingOutlined,
    PictureOutlined
  },
  props: {
    currentImage: {
      type: Object,
      default: null
    },
    annotations: {
      type: Array,
      default: () => []
    }
  },
  emits: ['annotation-selected', 'annotation-updated', 'annotation-created'],
  setup(props, { emit, expose }) {
    const containerRef = ref(null)
    const canvasRef = ref(null)
    const imageRef = ref(null)
    const loading = ref(false)
    
    // 视图状态
    const zoomLevel = ref(1)
    const panX = ref(0)
    const panY = ref(0)
    const imageSize = reactive({ width: 0, height: 0 })
    
    // 交互状态
    const selectedAnnotation = ref(null)
    const drawingMode = ref(false)
    const drawingAnnotation = ref(null)
    const isDragging = ref(false)
    const isResizing = ref(false)
    const isPanning = ref(false)
    
    // 鼠标状态
    const mouseState = reactive({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      button: 0
    })
    
    // 调整大小状态
    const resizeState = reactive({
      annotation: null,
      handle: '',
      startBbox: null
    })
    
    // 拖拽标注状态
    const dragState = reactive({
      annotation: null,
      startBbox: null,
      isDragging: false
    })
    
    const controlPoints = ['nw', 'ne', 'sw', 'se']

    // 图片加载处理
    const handleImageLoad = () => {
      if (imageRef.value) {
        imageSize.width = imageRef.value.naturalWidth
        imageSize.height = imageRef.value.naturalHeight
        resetZoom()
      }
    }

    // 缩放控制
    const zoomIn = () => {
      zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5)
    }

    const zoomOut = () => {
      zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1)
    }

    const actualSize = () => {
      zoomLevel.value = 1
      panX.value = 0
      panY.value = 0
    }

    const resetZoom = () => {
      if (!containerRef.value || !imageSize.width || !imageSize.height) return
      
      const container = containerRef.value
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight - 40 // 减去工具栏高度
      
      const scaleX = containerWidth / imageSize.width
      const scaleY = containerHeight / imageSize.height
      const scale = Math.max(scaleX, scaleY) // 使用max让图片充满画布
      
      zoomLevel.value = scale
      panX.value = 0 // 居中显示
      panY.value = 0
    }

    // 鼠标滚轮缩放
    const handleWheel = (event) => {
      if (!props.currentImage) return
      
      event.preventDefault()
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel.value * delta))
      
      zoomLevel.value = newZoom
    }

    // 鼠标事件处理
    const handleMouseDown = (event) => {
      if (!props.currentImage) return
      
      const rect = canvasRef.value.getBoundingClientRect()
      mouseState.startX = event.clientX - rect.left
      mouseState.startY = event.clientY - rect.top
      mouseState.currentX = mouseState.startX
      mouseState.currentY = mouseState.startY
      mouseState.button = event.button
      
      if (drawingMode.value && event.button === 0) {
        startDrawing(event)
      } else if (event.button === 0 && !dragState.isDragging) {
        isPanning.value = true
      }
    }

    const handleMouseMove = (event) => {
      if (!props.currentImage) return
      
      const rect = canvasRef.value.getBoundingClientRect()
      mouseState.currentX = event.clientX - rect.left
      mouseState.currentY = event.clientY - rect.top
      
      if (drawingAnnotation.value) {
        updateDrawing()
      } else if (isResizing.value) {
        updateResize()
      } else if (dragState.isDragging) {
        updateDragAnnotation()
      } else if (isPanning.value) {
        const deltaX = mouseState.currentX - mouseState.startX
        const deltaY = mouseState.currentY - mouseState.startY
        panX.value += deltaX
        panY.value += deltaY
        mouseState.startX = mouseState.currentX
        mouseState.startY = mouseState.currentY
      }
    }

    const handleMouseUp = (event) => {
      if (drawingAnnotation.value) {
        finishDrawing()
      }
      
      isPanning.value = false
      isResizing.value = false
      isDragging.value = false
      dragState.isDragging = false
      dragState.annotation = null
      dragState.startBbox = null
    }

    // 绘制标注
    const toggleDrawingMode = () => {
      drawingMode.value = !drawingMode.value
      if (!drawingMode.value) {
        drawingAnnotation.value = null
      }
    }

    const startDrawing = (event) => {
      const imageCoords = screenToImageCoords(mouseState.startX, mouseState.startY)
      drawingAnnotation.value = {
        startX: imageCoords.x,
        startY: imageCoords.y,
        endX: imageCoords.x,
        endY: imageCoords.y
      }
    }

    const updateDrawing = () => {
      if (!drawingAnnotation.value) return
      
      const imageCoords = screenToImageCoords(mouseState.currentX, mouseState.currentY)
      drawingAnnotation.value.endX = imageCoords.x
      drawingAnnotation.value.endY = imageCoords.y
    }

    const finishDrawing = () => {
      if (!drawingAnnotation.value) return
      
      const { startX, startY, endX, endY } = drawingAnnotation.value
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)
      
      if (width < 10 || height < 10) {
        drawingAnnotation.value = null
        return
      }
      
      const annotation = {
        id: `ann_${Date.now()}`,
        defectType: 'hole', // 默认类型
        bbox: [
          Math.min(startX, endX),
          Math.min(startY, endY),
          width,
          height
        ],
        confidence: 1.0
      }
      
      emit('annotation-created', annotation)
      drawingAnnotation.value = null
      drawingMode.value = false
    }

    // 选择标注
    const selectAnnotation = (annotation) => {
      selectedAnnotation.value = annotation
      emit('annotation-selected', annotation)
    }

    // 开始调整大小
    const startResize = (annotation, handle, event) => {
      event.stopPropagation()
      isResizing.value = true
      resizeState.annotation = annotation
      resizeState.handle = handle
      resizeState.startBbox = [...annotation.bbox]
      
      const rect = canvasRef.value.getBoundingClientRect()
      mouseState.startX = event.clientX - rect.left
      mouseState.startY = event.clientY - rect.top
    }

    // 更新调整大小
    const updateResize = () => {
      if (!resizeState.annotation) return
      
      const deltaX = mouseState.currentX - mouseState.startX
      const deltaY = mouseState.currentY - mouseState.startY
      const imageDeltaX = deltaX / zoomLevel.value
      const imageDeltaY = deltaY / zoomLevel.value
      
      const [x, y, width, height] = resizeState.startBbox
      let newBbox = [x, y, width, height]
      
      switch (resizeState.handle) {
        case 'nw':
          newBbox = [x + imageDeltaX, y + imageDeltaY, width - imageDeltaX, height - imageDeltaY]
          break
        case 'ne':
          newBbox = [x, y + imageDeltaY, width + imageDeltaX, height - imageDeltaY]
          break
        case 'sw':
          newBbox = [x + imageDeltaX, y, width - imageDeltaX, height + imageDeltaY]
          break
        case 'se':
          newBbox = [x, y, width + imageDeltaX, height + imageDeltaY]
          break
      }
      
      // 确保最小尺寸
      if (newBbox[2] >= 10 && newBbox[3] >= 10) {
        resizeState.annotation.bbox = newBbox
        emit('annotation-updated', resizeState.annotation)
      }
    }

    // 开始拖拽标注
    const startDragAnnotation = (annotation, event) => {
      event.preventDefault()
      event.stopPropagation()
      
      dragState.isDragging = true
      dragState.annotation = annotation
      dragState.startBbox = [...annotation.bbox]
      
      const rect = canvasRef.value.getBoundingClientRect()
      mouseState.startX = event.clientX - rect.left
      mouseState.startY = event.clientY - rect.top
      mouseState.currentX = mouseState.startX
      mouseState.currentY = mouseState.startY
      mouseState.button = event.button
      
      // 阻止平移功能启动
      isPanning.value = false
      
      // 选中当前标注
      selectAnnotation(annotation)
    }

    // 更新拖拽标注
    const updateDragAnnotation = () => {
      if (!dragState.annotation) return
      
      const deltaX = mouseState.currentX - mouseState.startX
      const deltaY = mouseState.currentY - mouseState.startY
      const imageDeltaX = deltaX / zoomLevel.value
      const imageDeltaY = deltaY / zoomLevel.value
      
      const [x, y, width, height] = dragState.startBbox
      const newBbox = [x + imageDeltaX, y + imageDeltaY, width, height]
      
      dragState.annotation.bbox = newBbox
      emit('annotation-updated', dragState.annotation)
    }

    // 坐标转换
    const screenToImageCoords = (screenX, screenY) => {
      const imageX = (screenX - panX.value) / zoomLevel.value
      const imageY = (screenY - panY.value) / zoomLevel.value
      return { x: imageX, y: imageY }
    }

    // 获取标注样式
    const getAnnotationStyle = (annotation) => {
      const [x, y, width, height] = annotation.bbox
      return {
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        '--zoom-level': zoomLevel.value
      }
    }

    // 获取绘制中标注样式
    const getDrawingAnnotationStyle = () => {
      if (!drawingAnnotation.value) return {}
      
      const { startX, startY, endX, endY } = drawingAnnotation.value
      const left = Math.min(startX, endX)
      const top = Math.min(startY, endY)
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)
      
      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      }
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

    // 高亮标注
    const highlightAnnotation = (annotationId) => {
      const annotation = props.annotations.find(a => a.id === annotationId)
      if (annotation) {
        selectAnnotation(annotation)
      }
    }

    // 开始绘制（外部调用）
    const startDrawingMode = () => {
      drawingMode.value = true
    }

    // 编辑标注（外部调用）
    const editAnnotation = (annotationId) => {
      const annotation = props.annotations.find(a => a.id === annotationId)
      if (annotation) {
        selectAnnotation(annotation)
      }
    }

    // 监听图片变化
    watch(() => props.currentImage, (newImage) => {
      if (newImage) {
        loading.value = true
        selectedAnnotation.value = null
        drawingAnnotation.value = null
        drawingMode.value = false
        
        nextTick(() => {
          loading.value = false
        })
      }
    })

    // 暴露方法给父组件
    expose({
      highlightAnnotation,
      startDrawing: startDrawingMode,
      editAnnotation
    })

    return {
      containerRef,
      canvasRef,
      imageRef,
      loading,
      zoomLevel,
      panX,
      panY,
      selectedAnnotation,
      drawingMode,
      drawingAnnotation,
      controlPoints,
      handleImageLoad,
      zoomIn,
      zoomOut,
      actualSize,
      resetZoom,
      handleWheel,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      toggleDrawingMode,
      selectAnnotation,
      startResize,
      getAnnotationStyle,
      getDrawingAnnotationStyle,
      getDefectName
    }
  }
}
</script>

<style scoped>
.image-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

.toolbar {
  height: 40px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  gap: 12px;
}

.zoom-info {
  font-size: 12px;
  color: black;
  min-width: 50px;
  text-align: center;
  font-weight: 500;
}

.image-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-primary);
  background-image: 
    linear-gradient(45deg, rgba(128, 128, 128, 0.5) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(128, 128, 128, 0.5) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(128, 128, 128, 0.5) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(128, 128, 128, 0.5) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.image-canvas {
  position: relative;
  transition: transform 0.1s ease-out;
  cursor: grab;
}

.image-canvas:active {
  cursor: grabbing;
}

.image-canvas.drawing {
  cursor: crosshair;
}

.annotation {
  position: absolute;
  cursor: pointer;
  transition: all 0.2s;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

.annotation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: calc(2px / var(--zoom-level, 1)) solid transparent;
  box-sizing: border-box;
}

.annotation.defect-hole::before {
  border-color: #f44747;
}

.annotation.defect-crack::before {
  border-color: #ffcc02;
}

.annotation.defect-bubble::before {
  border-color: #4ec9b0;
}

.annotation.defect-rust::before {
  border-color: #ce9178;
}

.annotation.defect-wear::before {
  border-color: #c586c0;
}

.annotation.drawing::before {
  border-color: var(--accent-blue);
}

.annotation:hover::before {
  border-width: calc(3px / var(--zoom-level, 1));
}

.annotation.selected::before {
  border-width: calc(3px / var(--zoom-level, 1));
}

.annotation.drawing {
  border-color: var(--accent-blue);
  background: rgba(0, 122, 204, 0.1);
}

.annotation-box {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.annotation-label {
  position: absolute;
  top: calc(-24px / var(--zoom-level, 1));
  right: 0;
  padding: calc(2px / var(--zoom-level, 1)) calc(6px / var(--zoom-level, 1));
  font-size: calc(11px / var(--zoom-level, 1));
  font-weight: bold;
  border-radius: calc(2px / var(--zoom-level, 1));
  white-space: nowrap;
  color: white;
  z-index: 10;
  cursor: move;
  user-select: none;
}

.annotation-label:hover {
  opacity: 0.8;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

.annotation-label:active {
  opacity: 0.9;
  transform: scale(0.95);
}

.control-points {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
}

.control-point {
  position: absolute;
  width: calc(8px / var(--zoom-level, 1));
  height: calc(8px / var(--zoom-level, 1));
  background: white;
  border: calc(1px / var(--zoom-level, 1)) solid #333;
  border-radius: calc(1px / var(--zoom-level, 1));
}

.control-point.nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
}

.control-point.ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
}

.control-point.sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
}

.control-point.se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

/* 缺陷类型颜色 */
.annotation.defect-hole {
  border-color: #f44747;
}

.annotation.defect-crack {
  border-color: #ffcc02;
}

.annotation.defect-bubble {
  border-color: #4ec9b0;
}

.annotation.defect-rust {
  border-color: #ce9178;
}

.annotation.defect-wear {
  border-color: #c586c0;
}

.annotation-label.defect-hole {
  background-color: #f44747;
}

.annotation-label.defect-crack {
  background-color: #ffcc02;
  color: #333;
}

.annotation-label.defect-bubble {
  background-color: #4ec9b0;
}

.annotation-label.defect-rust {
  background-color: #ce9178;
}

.annotation-label.defect-wear {
  background-color: #c586c0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 30, 30, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-primary);
  z-index: 1000;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-secondary);
}

.empty-state .anticon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
}
</style>