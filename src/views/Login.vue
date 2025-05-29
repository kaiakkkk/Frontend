<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>YOLO缺陷识别系统</h1>
        <p>人机协作工业缺陷检测平台</p>
      </div>
      
      <a-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <a-form-item name="username">
          <a-input
            v-model:value="loginForm.username"
            placeholder="用户名"
            size="large"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>
        
        <a-form-item name="password">
          <a-input-password
            v-model:value="loginForm.password"
            placeholder="密码"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item>
          <a-checkbox v-model:checked="loginForm.remember">
            记住密码
          </a-checkbox>
        </a-form-item>
        
        <a-form-item>
          <a-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
      
      <div class="login-footer">
        <p>© 2024 YOLO缺陷识别系统. 保留所有权利.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'

export default {
  name: 'Login',
  components: {
    UserOutlined,
    LockOutlined
  },
  setup() {
    const router = useRouter()
    const loginFormRef = ref(null)
    const loading = ref(false)
    
    const loginForm = reactive({
      username: 'admin',
      password: 'admin123',
      remember: false
    })
    
    const loginRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      try {
        const valid = await loginFormRef.value.validate()
        if (!valid) return
        
        loading.value = true
        
        // 模拟登录请求
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 简单的登录验证
        if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
          message.success('登录成功')
          router.push('/')
        } else {
          message.error('用户名或密码错误')
        }
      } catch (error) {
        console.error('登录失败:', error)
        message.error('登录失败，请重试')
      } finally {
        loading.value = false
      }
    }
    
    return {
      loginFormRef,
      loginForm,
      loginRules,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.login-form .ant-form-item {
  margin-bottom: 20px;
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.login-footer p {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

/* Ant Design Vue 组件样式覆盖 */
.login-form :deep(.ant-input) {
  background-color: var(--bg-tertiary) !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: none !important;
}

.login-form :deep(.ant-input:hover) {
  border-color: var(--accent-blue) !important;
}

.login-form :deep(.ant-input:focus) {
  border-color: var(--accent-blue) !important;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2) !important;
}

.login-form :deep(.ant-input) {
  color: var(--text-primary) !important;
}

.login-form :deep(.ant-input::placeholder) {
  color: var(--text-muted) !important;
}

.login-form :deep(.ant-checkbox-wrapper) {
  color: var(--text-primary) !important;
}

.login-form :deep(.ant-checkbox-inner) {
  background-color: var(--bg-tertiary) !important;
  border-color: var(--border-color) !important;
}

.login-form :deep(.ant-checkbox-inner:hover) {
  border-color: var(--accent-blue) !important;
}

.login-form :deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: var(--accent-blue) !important;
  border-color: var(--accent-blue) !important;
}
</style>