import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import * as AntdIcons from '@ant-design/icons-vue'
import './styles/global.css'

const app = createApp(App)

// 注册Ant Design Vue图标
for (const [key, component] of Object.entries(AntdIcons)) {
  app.component(key, component)
}

app.use(router)
app.use(Antd)
app.mount('#app')
