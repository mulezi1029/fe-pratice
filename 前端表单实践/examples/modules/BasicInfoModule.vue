<template>
  <div class="basic-info-module">
    <el-card class="module-card">
      <div slot="header" class="card-header">
        <span class="module-title">基础信息</span>
        <div class="module-status">
          <el-tag :type="isValid ? 'success' : 'danger'" size="small">
            {{ isValid ? '有效' : '无效' }}
          </el-tag>
        </div>
      </div>

      <el-form
        ref="form"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        :disabled="disabled || mode === 'view'"
        @validate="handleFormValidate"
      >
        <!-- 产品名称 -->
        <el-form-item label="产品名称" prop="name" required>
          <el-input
            v-model="formData.name"
            placeholder="请输入产品名称"
            :maxlength="100"
            show-word-limit
            @input="handleFieldChange('name', $event)"
          />
        </el-form-item>

        <!-- 产品类型 -->
        <el-form-item label="产品类型" prop="productType" required>
          <el-select
            v-model="formData.productType"
            placeholder="请选择产品类型"
            style="width: 100%"
            @change="handleFieldChange('productType', $event)"
          >
            <el-option
              v-for="option in productTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <!-- 产品分类 -->
        <el-form-item label="产品分类" prop="category" required>
          <el-cascader
            v-model="formData.category"
            :options="categoryOptions"
            :props="cascaderProps"
            placeholder="请选择产品分类"
            style="width: 100%"
            @change="handleFieldChange('category', $event)"
          />
        </el-form-item>

        <!-- 产品描述 -->
        <el-form-item label="产品描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入产品描述"
            :maxlength="500"
            show-word-limit
            @input="handleFieldChange('description', $event)"
          />
        </el-form-item>

        <!-- 产品标签 -->
        <el-form-item label="产品标签" prop="tags">
          <el-tag
            v-for="tag in formData.tags"
            :key="tag"
            closable
            style="margin-right: 8px; margin-bottom: 8px"
            @close="removeTag(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInput"
            v-model="tagInputValue"
            size="small"
            style="width: 100px"
            @keyup.enter.native="addTag"
            @blur="addTag"
          />
          <el-button
            v-else
            size="small"
            @click="showTagInput"
          >
            + 新标签
          </el-button>
        </el-form-item>

        <!-- 产品图片 -->
        <!-- <el-form-item label="产品图片" prop="images">
          <el-upload
            ref="upload"
            :file-list="formData.images"
            :action="uploadAction"
            :headers="uploadHeaders"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemoveImage"
            :on-preview="handlePreviewImage"
            list-type="picture-card"
            :limit="5"
            :disabled="disabled || mode === 'view'"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
          <div class="upload-tip">
            最多上传5张图片，单张不超过2MB，支持jpg、png格式
          </div>
        </el-form-item> -->

        <!-- 是否启用 -->
        <el-form-item label="是否启用" prop="enabled">
          <el-switch
            v-model="formData.enabled"
            active-text="启用"
            inactive-text="禁用"
            @change="handleFieldChange('enabled', $event)"
          />
        </el-form-item>

        <!-- 备注信息 -->
        <el-form-item label="备注信息" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
            :maxlength="200"
            show-word-limit
            @input="handleFieldChange('remark', $event)"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="图片预览"
      width="50%"
      center
    >
      <img :src="previewImageUrl" style="width: 100%; height: auto" />
    </el-dialog>
  </div>
</template>

<script>
import { debounce } from 'lodash'

export default {
  name: 'BasicInfoModule',
  props: {
    // 模式：edit-编辑，view-查看，create-新建
    mode: {
      type: String,
      default: 'edit',
      validator: val => ['edit', 'view', 'create'].includes(val)
    },
    
    // 依赖数据（来自其他模块）
    dependencyData: {
      type: Object,
      default: () => ({})
    },
    
    // 禁用状态
    disabled: {
      type: Boolean,
      default: false
    },
    
    // 配置选项
    options: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      // 表单数据
      formData: {
        name: '',
        productType: '',
        category: [],
        description: '',
        tags: [],
        images: [],
        enabled: true,
        remark: ''
      },
      
      // 验证状态
      isValid: false,
      validationErrors: [],
      
      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入产品名称', trigger: 'blur' },
          { min: 2, max: 100, message: '产品名称长度在2-100个字符', trigger: 'blur' }
        ],
        productType: [
          { required: true, message: '请选择产品类型', trigger: 'change' }
        ],
        category: [
          { required: true, message: '请选择产品分类', trigger: 'change' }
        ],
        description: [
          { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
        ]
      },
      
      // 选项数据
      productTypeOptions: [
        { label: '实物产品', value: 'physical' },
        { label: '数字产品', value: 'digital' },
        { label: '服务产品', value: 'service' }
      ],
      
      categoryOptions: [
        {
          value: 'electronics',
          label: '电子产品',
          children: [
            { value: 'phone', label: '手机' },
            { value: 'computer', label: '电脑' },
            { value: 'tablet', label: '平板' }
          ]
        },
        {
          value: 'clothing',
          label: '服装',
          children: [
            { value: 'men', label: '男装' },
            { value: 'women', label: '女装' },
            { value: 'children', label: '童装' }
          ]
        }
      ],
      
      // 级联选择器配置
      cascaderProps: {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover'
      },
      
      // 标签输入相关
      tagInputVisible: false,
      tagInputValue: '',
      
      // 图片上传相关
      uploadAction: '/api/upload/image',
      uploadHeaders: {
        'Authorization': 'Bearer ' + (this.$store.state.token || '')
      },
      previewDialogVisible: false,
      previewImageUrl: '',
      
      // 原始数据（用于比较变更）
      originalData: {}
    }
  },
  watch: {
    // 监听依赖数据变化
    dependencyData: {
      deep: true,
      handler(newVal) {
        this.handleDependencyChange(newVal)
      }
    },
    
    // 监听表单数据变化，触发验证
    formData: {
      deep: true,
      handler: function(newVal) {
        debugger
        this.validateForm()
        this.emitDataChange()
      }
    }
  },
  created() {
    // 初始化数据
    this.initializeData()
  },
  methods: {
    // ========== 标准接口方法 ==========
    
    /**
     * 设置表单数据（用于回显）
     * @param {Object} data - 外部传入的数据
     */
    setFormData(data) {
      try {
        // 数据转换和设置
        this.formData = {
          name: data.name || '',
          productType: data.productType || '',
          category: data.category || [],
          description: data.description || '',
          tags: data.tags || [],
          images: this.transformImages(data.images || []),
          enabled: data.enabled !== undefined ? data.enabled : true,
          remark: data.remark || ''
        }
        
        // 保存原始数据
        this.originalData = JSON.parse(JSON.stringify(this.formData))
        
        // 初始验证
        this.$nextTick(() => {
          this.validateForm()
        })
      } catch (error) {
        console.error('设置表单数据失败:', error)
        this.$message.error('数据设置失败')
      }
    },
    
    /**
     * 获取表单数据（用于提交）
     * @returns {Promise<Object>} 格式化后的表单数据
     */
    async getFormData() {
      try {
        // 首先进行验证
        const isValid = await this.validateForm()
        if (!isValid) {
          throw new Error('表单验证失败，请检查输入')
        }
        
        // 返回格式化的数据
        return {
          name: this.formData.name.trim(),
          productType: this.formData.productType,
          category: this.formData.category,
          description: this.formData.description.trim(),
          tags: this.formData.tags,
          images: this.formData.images.map(img => ({
            url: img.url || img.response?.url,
            name: img.name
          })),
          enabled: this.formData.enabled,
          remark: this.formData.remark.trim()
        }
      } catch (error) {
        console.error('获取表单数据失败:', error)
        throw error
      }
    },
    
    /**
     * 表单校验
     * @returns {Promise<Object>} 验证结果
     */
    async validateForm() {
      try {
        const isValid = await this.$refs.form.validate()
        const errors = []
        
        // 自定义验证逻辑
        if (this.formData.tags.length === 0) {
          errors.push({ field: 'tags', message: '请至少添加一个产品标签' })
        }
        
        if (this.formData.images.length === 0) {
          errors.push({ field: 'images', message: '请至少上传一张产品图片' })
        }
        
        const finalValid = isValid && errors.length === 0
        this.isValid = finalValid
        this.validationErrors = errors
        
        // 触发验证状态变更事件
        this.$emit('validation-change', {
          module: 'basicInfo',
          valid: finalValid,
          errors: errors
        })
        
        return { valid: finalValid, errors: errors }
      } catch (error) {
        console.error('表单验证失败:', error)
        return { valid: false, errors: [{ field: 'form', message: '验证过程中发生错误' }] }
      }
    },
    
    /**
     * 重置表单
     */
    async resetForm() {
      this.$refs.form.resetFields()
      this.formData = {
        name: '',
        productType: '',
        category: [],
        description: '',
        tags: [],
        images: [],
        enabled: true,
        remark: ''
      }
      this.isValid = false
      this.validationErrors = []
      this.originalData = {}
    },
    
    /**
     * 更新依赖数据
     * @param {Object} dependencyData - 依赖的数据
     */
    updateDependencyData(dependencyData) {
      // 根据依赖数据更新当前模块的状态
      // 例如：根据其他模块的产品类型来过滤当前模块的分类选项
      this.handleDependencyChange(dependencyData)
    },
    
    // ========== 内部方法 ==========
    
    /**
     * 初始化数据
     */
    initializeData() {
      // 可以在这里加载选项数据等
      this.loadOptions()
    },
    
    /**
     * 加载选项数据
     */
    async loadOptions() {
      try {
        // 这里可以从API加载选项数据
        // const response = await this.$httpAxios.get('/api/options/product-types')
        // this.productTypeOptions = response.data
      } catch (error) {
        console.error('加载选项数据失败:', error)
      }
    },
    
    /**
     * 处理字段变更
     */
    handleFieldChange(field, value) {
      const oldValue = this.formData[field]
      this.formData[field] = value
      
      // 立即触发数据变更事件
      this.emitDataChange(field, oldValue, value)
    },
    
    /**
     * 发送数据变更事件
     */
    emitDataChange(field = null, oldValue = null, newValue = null) {
      this.$emit('data-change', {
        module: 'basicInfo',
        data: JSON.parse(JSON.stringify(this.formData)),
        field: field,
        oldValue: oldValue,
        newValue: newValue
      })
    },
    
    /**
     * 处理依赖数据变化
     */
    handleDependencyChange(dependencyData) {
      // 根据依赖数据调整当前模块
      // 例如：根据其他模块选择的产品类型来调整当前的选项
      console.log('依赖数据变化:', dependencyData)
    },
    
    /**
     * 处理表单验证
     */
    handleFormValidate(prop, isValid, message) {
      // Element UI 表单验证回调
      console.log('字段验证:', prop, isValid, message)
    },
    
    /**
     * 转换图片数据格式
     */
    transformImages(images) {
      return images.map(img => {
        if (typeof img === 'string') {
          return {
            name: img.split('/').pop(),
            url: img
          }
        }
        return img
      })
    },
    
    // ========== 标签相关方法 ==========
    
    /**
     * 显示标签输入框
     */
    showTagInput() {
      this.tagInputVisible = true
      this.$nextTick(() => {
        this.$refs.tagInput.$refs.input.focus()
      })
    },
    
    /**
     * 添加标签
     */
    addTag() {
      const tagValue = this.tagInputValue.trim()
      if (tagValue && !this.formData.tags.includes(tagValue)) {
        this.formData.tags.push(tagValue)
        this.handleFieldChange('tags', this.formData.tags)
      }
      this.tagInputVisible = false
      this.tagInputValue = ''
    },
    
    /**
     * 移除标签
     */
    removeTag(tag) {
      const index = this.formData.tags.indexOf(tag)
      if (index > -1) {
        this.formData.tags.splice(index, 1)
        this.handleFieldChange('tags', this.formData.tags)
      }
    },
    
    // ========== 图片上传相关方法 ==========
    
    /**
     * 上传前检查
     */
    beforeUpload(file) {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
      const isValidSize = file.size / 1024 / 1024 < 2
      
      if (!isValidType) {
        this.$message.error('只能上传 JPG/PNG 格式的图片!')
        return false
      }
      if (!isValidSize) {
        this.$message.error('图片大小不能超过 2MB!')
        return false
      }
      return true
    },
    
    /**
     * 上传成功处理
     */
    handleUploadSuccess(response, file, fileList) {
      this.formData.images = fileList
      this.handleFieldChange('images', this.formData.images)
      this.$message.success('图片上传成功')
    },
    
    /**
     * 移除图片
     */
    handleRemoveImage(file, fileList) {
      this.formData.images = fileList
      this.handleFieldChange('images', this.formData.images)
    },
    
    /**
     * 预览图片
     */
    handlePreviewImage(file) {
      this.previewImageUrl = file.url || file.response?.url
      this.previewDialogVisible = true
    }
  }
}
</script>

<style scoped>
.basic-info-module {
  padding: 0;
}

.module-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.module-status .el-tag {
  margin-left: 8px;
}

.el-form {
  padding: 20px;
}

.el-form-item {
  margin-bottom: 22px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  line-height: 1.4;
}

.el-tag {
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-form {
    padding: 15px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* 自定义样式 */
.el-cascader {
  width: 100%;
}

.el-upload--picture-card {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

.el-upload-list--picture-card .el-upload-list__item {
  width: 100px;
  height: 100px;
}
</style> 