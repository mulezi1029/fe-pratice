<template>
  <div class="complex-form-container">
    <!-- 表单头部信息 -->
    <div class="form-header">
      <h2>{{ isEditMode ? '编辑产品' : '新增产品' }}</h2>
      <div class="form-status">
        <span class="status-item" :class="{ 'valid': isFormValid, 'invalid': !isFormValid }">
          表单状态: {{ isFormValid ? '有效' : '无效' }}
        </span>
      </div>
    </div>

    <!-- 步骤指示器 -->
    <div class="step-indicator">
      <div 
        v-for="(module, index) in moduleList" 
        :key="module.key"
        class="step-item"
        :class="{ 
          'completed': validationStatus[module.key]?.valid,
          'error': validationStatus[module.key] && !validationStatus[module.key].valid,
          'active': activeModule === module.key
        }"
        @click="setActiveModule(module.key)"
      >
        <span class="step-number">{{ index + 1 }}</span>
        <span class="step-label">{{ module.label }}</span>
      </div>
    </div>

    <!-- 表单内容区域 -->
    <div class="form-content">
      <el-tabs v-model="activeModule" @tab-click="handleTabClick">
        <!-- 基础信息模块 -->
        <el-tab-pane label="基础信息" name="basicInfo">
          <BasicInfoModule
            ref="basicInfo"
            :mode="mode"
            :dependency-data="getDependencyData('basicInfo')"
            :disabled="isSubmitting"
            @data-change="handleModuleDataChange"
            @validation-change="handleValidationChange"
          />
        </el-tab-pane>

        <!-- 业务信息模块 -->
        <el-tab-pane label="业务信息" name="businessInfo">
          <BusinessInfoModule
            ref="businessInfo"
            :mode="mode"
            :dependency-data="getDependencyData('businessInfo')"
            :disabled="isSubmitting"
            @data-change="handleModuleDataChange"
            @validation-change="handleValidationChange"
          />
        </el-tab-pane>

        <!-- 配置信息模块 -->
        <el-tab-pane label="配置信息" name="configInfo">
          <ConfigInfoModule
            ref="configInfo"
            :mode="mode"
            :dependency-data="getDependencyData('configInfo')"
            :disabled="isSubmitting"
            @data-change="handleModuleDataChange"
            @validation-change="handleValidationChange"
          />
        </el-tab-pane>

        <!-- 附加信息模块 -->
        <el-tab-pane label="附加信息" name="additionalInfo">
          <AdditionalInfoModule
            ref="additionalInfo"
            :mode="mode"
            :dependency-data="getDependencyData('additionalInfo')"
            :disabled="isSubmitting"
            @data-change="handleModuleDataChange"
            @validation-change="handleValidationChange"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 操作按钮区域 -->
    <div class="form-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="handleSaveDraft" :loading="isDraftSaving">保存草稿</el-button>
      <el-button 
        type="primary" 
        @click="handleSubmit" 
        :loading="isSubmitting"
        :disabled="!isFormValid"
      >
        {{ isEditMode ? '更新' : '提交' }}
      </el-button>
    </div>
  </div>
</template>

<script>
import BasicInfoModule from './modules/BasicInfoModule.vue'
import BusinessInfoModule from './modules/BusinessInfoModule.vue'
import ConfigInfoModule from './modules/ConfigInfoModule.vue'
import AdditionalInfoModule from './modules/AdditionalInfoModule.vue'
import FormDataTransformer from './utils/FormDataTransformer'
import FormErrorHandler from './utils/FormErrorHandler'
import { debounce } from 'lodash'

export default {
  name: 'ComplexFormContainer',
  components: {
    BasicInfoModule,
    BusinessInfoModule,
    ConfigInfoModule,
    AdditionalInfoModule
  },
  props: {
    productId: {
      type: [String, Number],
      default: null
    },
    mode: {
      type: String,
      default: 'edit',
      validator: val => ['edit', 'view', 'create'].includes(val)
    }
  },
  data() {
    return {
      // 表单数据
      formData: {},
      
      // 各模块验证状态
      validationStatus: {
        basicInfo: { valid: false, errors: [] },
        businessInfo: { valid: false, errors: [] },
        configInfo: { valid: false, errors: [] },
        additionalInfo: { valid: false, errors: [] }
      },
      
      // 模块间依赖关系配置
      dependencies: {
        businessInfo: ['basicInfo.productType', 'basicInfo.category'],
        configInfo: ['basicInfo.category', 'businessInfo.saleType'],
        additionalInfo: ['basicInfo.productType']
      },
      
      // 模块列表配置
      moduleList: [
        { key: 'basicInfo', label: '基础信息' },
        { key: 'businessInfo', label: '业务信息' },
        { key: 'configInfo', label: '配置信息' },
        { key: 'additionalInfo', label: '附加信息' }
      ],
      
      // UI状态
      activeModule: 'basicInfo',
      isSubmitting: false,
      isDraftSaving: false,
      isLoading: false,
      
      // 原始数据（用于比较是否有变更）
      originalData: {}
    }
  },
  computed: {
    isEditMode() {
      return this.mode === 'edit' && this.productId
    },
    
    isFormValid() {
      return Object.values(this.validationStatus).every(status => status.valid)
    },
    
    hasChanges() {
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData)
    }
  },
  watch: {
    productId: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.initFormData()
        }
      }
    }
  },
  created() {
    // 创建防抖的依赖更新函数
    this.debouncedDependencyUpdate = debounce(this.handleModuleDependency, 300)
  },
  mounted() {
    // 页面离开时提醒用户保存
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },
  methods: {
    // 初始化表单数据
    async initFormData() {
      if (!this.isEditMode) return
      
      this.isLoading = true
      try {
        const data = await this.fetchDetailData()
        this.originalData = JSON.parse(JSON.stringify(data))
        this.distributeDataToModules(data)
      } catch (error) {
        FormErrorHandler.handleSubmitError(error, this)
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取详情数据
    async fetchDetailData() {
      const response = await this.$httpAxios.get(`/product/${this.productId}`)
      return response.dataSource || {}
    },
    
    // 分发数据到各模块
    distributeDataToModules(data) {
      this.moduleList.forEach(module => {
        const moduleRef = this.$refs[module.key]
        if (moduleRef && moduleRef.setFormData) {
          const moduleData = FormDataTransformer.toComponentFormat(data, module.key)
          moduleRef.setFormData(moduleData)
        }
      })
    },
    
    // 获取模块的依赖数据
    getDependencyData(moduleName) {
      const deps = this.dependencies[moduleName] || []
      const dependencyData = {}
      
      deps.forEach(dep => {
        const [sourceModule, field] = dep.split('.')
        if (this.formData[sourceModule] && this.formData[sourceModule][field] !== undefined) {
          dependencyData[field] = this.formData[sourceModule][field]
        }
      })
      
      return dependencyData
    },
    
    // 处理模块数据变更
    handleModuleDataChange(event) {
      const { module, data, field, oldValue, newValue } = event
      
      // 更新全局数据
      this.$set(this.formData, module, data)
      
      // 触发依赖更新
      if (field) {
        this.debouncedDependencyUpdate(module, field, newValue)
      }
      
      // 标记表单为已修改
      this.$emit('form-change', { module, field, oldValue, newValue })
    },
    
    // 处理验证状态变更
    handleValidationChange(event) {
      const { module, valid, errors } = event
      this.$set(this.validationStatus, module, { valid, errors })
    },
    
    // 处理模块间依赖
    handleModuleDependency(changedModule, changedField, newValue) {
      Object.keys(this.dependencies).forEach(targetModule => {
        const deps = this.dependencies[targetModule]
        const affectedDep = deps.find(dep => dep.startsWith(`${changedModule}.`))
        
        if (affectedDep) {
          const targetRef = this.$refs[targetModule]
          if (targetRef && targetRef.updateDependencyData) {
            const dependencyData = this.getDependencyData(targetModule)
            targetRef.updateDependencyData(dependencyData)
          }
        }
      })
    },
    
    // 收集所有模块数据
    async collectFormData() {
      const moduleData = {}
      
      for (const module of this.moduleList) {
        const moduleRef = this.$refs[module.key]
        if (moduleRef && moduleRef.getFormData) {
          try {
            moduleData[module.key] = await moduleRef.getFormData()
          } catch (error) {
            throw new Error(`获取${module.label}数据失败: ${error.message}`)
          }
        }
      }
      
      return FormDataTransformer.toApiFormat(moduleData)
    },
    
    // 全局表单验证
    async validateAllModules() {
      const validationResults = {}
      let globalValid = true
      
      for (const module of this.moduleList) {
        const moduleRef = this.$refs[module.key]
        if (moduleRef && moduleRef.validateForm) {
          try {
            const result = await moduleRef.validateForm()
            validationResults[module.key] = result
            if (!result.valid) {
              globalValid = false
              // 自动跳转到第一个有错误的模块
              if (globalValid && this.activeModule !== module.key) {
                this.activeModule = module.key
              }
            }
          } catch (error) {
            validationResults[module.key] = { valid: false, errors: [error.message] }
            globalValid = false
          }
        }
      }
      
      this.validationStatus = validationResults
      return { valid: globalValid, modules: validationResults }
    },
    
    // 处理提交
    async handleSubmit() {
      if (this.isSubmitting) return
      
      try {
        // 1. 全局验证
        const validationResult = await this.validateAllModules()
        if (!validationResult.valid) {
          this.$message.warning('请检查表单错误信息')
          return
        }
        
        // 2. 收集数据
        this.isSubmitting = true
        const submitData = await this.collectFormData()
        
        // 3. 提交数据
        let response
        if (this.isEditMode) {
          response = await this.$httpAxios.put(`/product/${this.productId}`, submitData)
        } else {
          response = await this.$httpAxios.post('/product', submitData)
        }
        
        // 4. 处理成功结果
        this.$message.success(this.isEditMode ? '更新成功' : '创建成功')
        this.$emit('submit-success', response.dataSource)
        
        // 更新原始数据
        this.originalData = JSON.parse(JSON.stringify(this.formData))
        
      } catch (error) {
        FormErrorHandler.handleSubmitError(error, this)
      } finally {
        this.isSubmitting = false
      }
    },
    
    // 保存草稿
    async handleSaveDraft() {
      if (this.isDraftSaving) return
      
      try {
        this.isDraftSaving = true
        const draftData = await this.collectFormData()
        
        await this.$httpAxios.post('/product/draft', {
          ...draftData,
          id: this.productId
        })
        
        this.$message.success('草稿保存成功')
      } catch (error) {
        this.$message.error('保存草稿失败')
      } finally {
        this.isDraftSaving = false
      }
    },
    
    // 处理取消
    handleCancel() {
      if (this.hasChanges) {
        this.$confirm('有未保存的更改，确定要离开吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$emit('cancel')
        })
      } else {
        this.$emit('cancel')
      }
    },
    
    // 设置当前激活模块
    setActiveModule(moduleName) {
      this.activeModule = moduleName
    },
    
    // 处理标签页点击
    handleTabClick(tab) {
      this.activeModule = tab.name
    },
    
    // 页面离开前警告
    handleBeforeUnload(event) {
      if (this.hasChanges) {
        event.preventDefault()
        event.returnValue = ''
      }
    },
    
    // 重置表单
    async resetForm() {
      for (const module of this.moduleList) {
        const moduleRef = this.$refs[module.key]
        if (moduleRef && moduleRef.resetForm) {
          await moduleRef.resetForm()
        }
      }
      
      this.formData = {}
      this.validationStatus = {
        basicInfo: { valid: false, errors: [] },
        businessInfo: { valid: false, errors: [] },
        configInfo: { valid: false, errors: [] },
        additionalInfo: { valid: false, errors: [] }
      }
    }
  }
}
</script>

<style scoped>
.complex-form-container {
  padding: 20px;
  background: #fff;
  min-height: 100vh;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e8e8e8;
}

.form-header h2 {
  margin: 0;
  color: #333;
}

.form-status .status-item {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-item.valid {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-item.invalid {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.step-indicator {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.step-item:hover {
  transform: translateY(-2px);
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f5f5;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.step-item.active .step-number {
  background: #1890ff;
  color: white;
}

.step-item.completed .step-number {
  background: #52c41a;
  color: white;
}

.step-item.error .step-number {
  background: #ff4d4f;
  color: white;
}

.step-label {
  font-size: 14px;
  color: #666;
}

.step-item.active .step-label {
  color: #1890ff;
  font-weight: bold;
}

.form-content {
  min-height: 500px;
  margin-bottom: 30px;
}

.form-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid #e8e8e8;
  position: sticky;
  bottom: 0;
  background: white;
  z-index: 10;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .complex-form-container {
    padding: 10px;
  }
  
  .step-indicator {
    flex-wrap: wrap;
  }
  
  .step-item {
    margin: 5px 10px;
  }
  
  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style> 