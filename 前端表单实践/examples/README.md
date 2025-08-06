# 复杂表单模块架构 - 使用说明

## 项目概述

本项目提供了一套完整的复杂表单组件化架构解决方案，包含完整的示例代码、工具类和最佳实践指南。

## 目录结构

```
examples/
├── ComplexFormContainer.vue       # 父组件示例
├── modules/                       # 子模块组件
│   ├── BasicInfoModule.vue       # 基础信息模块
│   ├── BusinessInfoModule.vue    # 业务信息模块
│   ├── ConfigInfoModule.vue      # 配置信息模块（需要创建）
│   └── AdditionalInfoModule.vue  # 附加信息模块（需要创建）
├── utils/                         # 工具类
│   ├── FormDataTransformer.js    # 数据转换器
│   └── FormErrorHandler.js       # 错误处理器
└── README.md                      # 使用说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install vue element-ui lodash
```

### 2. 引入组件

```javascript
import ComplexFormContainer from './examples/ComplexFormContainer.vue'

export default {
  components: {
    ComplexFormContainer
  }
}
```

### 3. 基本使用

```vue
<template>
  <ComplexFormContainer
    :product-id="productId"
    :mode="mode"
    @submit-success="handleSubmitSuccess"
    @cancel="handleCancel"
  />
</template>

<script>
export default {
  data() {
    return {
      productId: 123,
      mode: 'edit' // edit | view | create
    }
  },
  methods: {
    handleSubmitSuccess(data) {
      console.log('提交成功:', data)
      this.$router.push('/product-list')
    },
    
    handleCancel() {
      this.$router.go(-1)
    }
  }
}
</script>
```

## 创建自定义子模块

### 1. 创建子模块组件

```vue
<template>
  <div class="your-module">
    <el-card>
      <div slot="header">
        <span>您的模块名称</span>
        <el-tag :type="isValid ? 'success' : 'danger'" size="small">
          {{ isValid ? '有效' : '无效' }}
        </el-tag>
      </div>
      
      <el-form ref="form" :model="formData" :rules="formRules">
        <!-- 您的表单字段 -->
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'YourModule',
  props: {
    mode: String,
    dependencyData: Object,
    disabled: Boolean,
    options: Object
  },
  data() {
    return {
      formData: {},
      isValid: false,
      validationErrors: [],
      formRules: {}
    }
  },
  methods: {
    // 必须实现的标准接口
    setFormData(data) {
      // 设置表单数据（用于回显）
    },
    
    async getFormData() {
      // 获取表单数据（用于提交）
      return this.formData
    },
    
    async validateForm() {
      // 表单校验
      return { valid: true, errors: [] }
    },
    
    async resetForm() {
      // 重置表单
    },
    
    updateDependencyData(dependencyData) {
      // 更新依赖数据
    }
  }
}
</script>
```

### 2. 注册到父组件

在 `ComplexFormContainer.vue` 中：

```javascript
import YourModule from './modules/YourModule.vue'

export default {
  components: {
    // ...其他组件
    YourModule
  },
  data() {
    return {
      moduleList: [
        // ...其他模块
        { key: 'yourModule', label: '您的模块' }
      ],
      dependencies: {
        // ...其他依赖
        yourModule: ['basicInfo.someField']
      }
    }
  }
}
```

### 3. 添加到模板中

```vue
<el-tab-pane label="您的模块" name="yourModule">
  <YourModule
    ref="yourModule"
    :mode="mode"
    :dependency-data="getDependencyData('yourModule')"
    :disabled="isSubmitting"
    @data-change="handleModuleDataChange"
    @validation-change="handleValidationChange"
  />
</el-tab-pane>
```

## 数据转换配置

### 1. 扩展数据转换器

在 `FormDataTransformer.js` 中添加您的模块转换器：

```javascript
// 在 toComponentFormat 方法中添加
yourModule: (data) => {
  return {
    field1: data.apiField1 || '',
    field2: data.apiField2 || 0
  }
}

// 在 toApiFormat 方法中添加
if (componentData.yourModule) {
  const yourData = componentData.yourModule
  apiData.yourModuleData = {
    apiField1: yourData.field1,
    apiField2: yourData.field2
  }
}
```

## 模块间依赖配置

### 1. 配置依赖关系

```javascript
dependencies: {
  businessInfo: ['basicInfo.productType', 'basicInfo.category'],
  configInfo: ['basicInfo.category', 'businessInfo.saleType'],
  yourModule: ['basicInfo.someField', 'businessInfo.anotherField']
}
```

### 2. 处理依赖数据

在子模块中：

```javascript
watch: {
  dependencyData: {
    deep: true,
    handler(newVal) {
      // 根据依赖数据调整当前模块
      if (newVal.productType === 'special') {
        this.showSpecialFields = true
      }
    }
  }
}
```

## 表单验证扩展

### 1. 自定义验证规则

```javascript
formRules: {
  customField: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { validator: this.customValidator, trigger: 'change' }
  ]
}

methods: {
  customValidator(rule, value, callback) {
    if (value && value.length < 5) {
      callback(new Error('内容至少5个字符'))
    } else {
      callback()
    }
  }
}
```

### 2. 跨模块验证

```javascript
async validateForm() {
  try {
    const isValid = await this.$refs.form.validate()
    const errors = []
    
    // 自定义验证逻辑
    if (this.needsSpecialValidation) {
      const specialResult = await this.validateSpecialLogic()
      if (!specialResult.valid) {
        errors.push(...specialResult.errors)
      }
    }
    
    const finalValid = isValid && errors.length === 0
    this.isValid = finalValid
    this.validationErrors = errors
    
    this.$emit('validation-change', {
      module: 'yourModule',
      valid: finalValid,
      errors: errors
    })
    
    return { valid: finalValid, errors: errors }
  } catch (error) {
    return { valid: false, errors: [{ field: 'form', message: error.message }] }
  }
}
```

## 错误处理配置

### 1. 自定义错误处理

```javascript
import FormErrorHandler from '../utils/FormErrorHandler'

// 在组件中使用
try {
  await this.submitForm()
} catch (error) {
  FormErrorHandler.handleSubmitError(error, this)
}
```

### 2. 扩展错误类型

```javascript
// 在 FormErrorHandler.js 中添加
case 'YOUR_CUSTOM_ERROR':
  this.handleYourCustomError(error, context)
  break

static handleYourCustomError(error, context) {
  // 自定义错误处理逻辑
  context.$message.error('您的自定义错误消息')
}
```

## 性能优化建议

### 1. 懒加载子模块

```javascript
const AsyncYourModule = () => ({
  component: import('./modules/YourModule.vue'),
  loading: LoadingComponent,
  error: ErrorComponent,
  delay: 200,
  timeout: 3000
})
```

### 2. 防抖处理

```javascript
import { debounce } from 'lodash'

watch: {
  formData: {
    deep: true,
    handler: debounce(function(newVal) {
      this.validateForm()
      this.emitDataChange()
    }, 300)
  }
}
```

### 3. 数据缓存

```javascript
// 缓存验证结果
const validationCache = new Map()

async validateForm() {
  const cacheKey = JSON.stringify(this.formData)
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)
  }
  
  const result = await this.performValidation()
  validationCache.set(cacheKey, result)
  return result
}
```

## 测试指南

### 1. 单元测试示例

```javascript
import { mount } from '@vue/test-utils'
import BasicInfoModule from '@/modules/BasicInfoModule.vue'

describe('BasicInfoModule', () => {
  it('should set form data correctly', async () => {
    const wrapper = mount(BasicInfoModule)
    const testData = { name: 'Test Product', type: 'digital' }
    
    await wrapper.vm.setFormData(testData)
    
    expect(wrapper.vm.formData.name).toBe('Test Product')
    expect(wrapper.vm.formData.productType).toBe('digital')
  })
  
  it('should validate required fields', async () => {
    const wrapper = mount(BasicInfoModule)
    wrapper.vm.formData = { name: '', productType: '' }
    
    const result = await wrapper.vm.validateForm()
    
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
```

### 2. 集成测试示例

```javascript
describe('ComplexForm Integration', () => {
  it('should handle module dependency correctly', async () => {
    const wrapper = mount(ComplexFormContainer)
    
    // 模拟基础信息变更
    await wrapper.vm.$refs.basicInfo.setFormData({ productType: 'physical' })
    
    // 验证业务信息模块是否正确响应
    expect(wrapper.vm.$refs.businessInfo.dependencyData.productType)
      .toBe('physical')
  })
})
```

## 部署说明

### 1. 构建配置

```javascript
// webpack.config.js
module.exports = {
  // ...其他配置
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        formModules: {
          test: /[\\/]modules[\\/]/,
          name: 'form-modules',
          chunks: 'all'
        }
      }
    }
  }
}
```

### 2. 环境变量

```bash
# .env.production
VUE_APP_API_BASE_URL=https://api.yoursite.com
VUE_APP_UPLOAD_URL=https://upload.yoursite.com
```

## 常见问题

### Q: 如何处理文件上传？

A: 在子模块中配置上传组件：

```vue
<el-upload
  :action="uploadAction"
  :headers="uploadHeaders"
  :before-upload="beforeUpload"
  :on-success="handleUploadSuccess"
>
  <el-button>点击上传</el-button>
</el-upload>
```

### Q: 如何实现表单数据的本地缓存？

A: 使用 localStorage 或 sessionStorage：

```javascript
// 保存草稿
saveDraft() {
  const draftData = {
    timestamp: Date.now(),
    formData: this.formData
  }
  localStorage.setItem('form-draft', JSON.stringify(draftData))
}

// 恢复草稿
loadDraft() {
  const draft = localStorage.getItem('form-draft')
  if (draft) {
    const draftData = JSON.parse(draft)
    this.setFormData(draftData.formData)
  }
}
```

### Q: 如何处理复杂的条件显示逻辑？

A: 使用计算属性和动态组件：

```javascript
computed: {
  shouldShowAdvancedFields() {
    return this.formData.type === 'advanced' && 
           this.dependencyData.userLevel === 'expert'
  }
}
```

### Q: 如何优化大型表单的渲染性能？

A: 使用虚拟滚动和懒加载：

```vue
<template>
  <virtual-list
    :size="80"
    :remain="10"
    :bench="5"
  >
    <form-item
      v-for="field in visibleFields"
      :key="field.id"
      :field="field"
    />
  </virtual-list>
</template>
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 完整的表单架构设计
- 基础模块示例
- 工具类和错误处理

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。 