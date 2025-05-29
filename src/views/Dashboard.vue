<template>
  <div class="dashboard">
    <!-- 这里可以放置仪表板内容，目前主要功能在MainLayout中 -->
    <div class="dashboard-content">
      <h2>YOLO人机协作缺陷识别系统</h2>
      <p>请从左侧选择图片开始工作</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard'
}
</script>

<style scoped>
.dashboard {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
}

.dashboard-content {
  text-align: center;
  color: var(--text-secondary);
}

.dashboard-content h2 {
  color: var(--text-primary);
  margin-bottom: 16px;
}
</style>