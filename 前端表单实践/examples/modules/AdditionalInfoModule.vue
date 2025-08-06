<template>
  <div class="additional-info-module">
    <el-card class="module-card">
      <div slot="header" class="card-header">
        <span class="module-title">附加信息</span>
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
        <!-- SEO设置 -->
        <el-divider content-position="left">SEO设置</el-divider>

        <!-- SEO标题 -->
        <el-form-item label="SEO标题" prop="seoTitle">
          <el-input
            v-model="formData.seoTitle"
            placeholder="请输入SEO标题"
            :maxlength="60"
            show-word-limit
            @input="handleFieldChange('seoTitle', $event)"
          />
          <div class="form-tip">建议长度在50-60字符，包含主要关键词</div>
        </el-form-item>

        <!-- Meta描述 -->
        <el-form-item label="Meta描述" prop="metaDescription">
          <el-input
            v-model="formData.metaDescription"
            type="textarea"
            :rows="3"
            placeholder="请输入Meta描述"
            :maxlength="160"
            show-word-limit
            @input="handleFieldChange('metaDescription', $event)"
          />
          <div class="form-tip">建议长度在120-160字符，简洁明了地描述产品</div>
        </el-form-item>

        <!-- 关键词 -->
        <el-form-item label="关键词" prop="keywords">
          <el-tag
            v-for="keyword in formData.keywords"
            :key="keyword"
            closable
            style="margin-right: 8px; margin-bottom: 8px"
            @close="removeKeyword(keyword)"
          >
            {{ keyword }}
          </el-tag>
          <el-input
            v-if="keywordInputVisible"
            ref="keywordInput"
            v-model="keywordInputValue"
            size="small"
            style="width: 120px"
            @keyup.enter.native="addKeyword"
            @blur="addKeyword"
          />
          <el-button
            v-else
            size="small"
            @click="showKeywordInput"
          >
            + 新关键词
          </el-button>
          <div class="form-tip">建议3-5个关键词，用于SEO优化</div>
        </el-form-item>

        <!-- 关联产品 -->
        <el-divider content-position="left">关联产品</el-divider>

        <el-form-item label="推荐产品" prop="relatedProducts">
          <div class="related-products">
            <div 
              v-for="(product, index) in formData.relatedProducts" 
              :key="index"
              class="related-product-item"
            >
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-input
                    v-model="product.name"
                    placeholder="产品名称"
                    @input="handleRelatedProductChange(index, 'name', $event)"
                  />
                </el-col>
                <el-col :span="4">
                  <el-input-number
                    v-model="product.price"
                    :min="0"
                    :precision="2"
                    placeholder="价格"
                    style="width: 100%"
                    @change="handleRelatedProductChange(index, 'price', $event)"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input
                    v-model="product.image"
                    placeholder="图片URL"
                    @input="handleRelatedProductChange(index, 'image', $event)"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input
                    v-model="product.url"
                    placeholder="产品链接"
                    @input="handleRelatedProductChange(index, 'url', $event)"
                  />
                </el-col>
                <el-col :span="2">
                  <el-button
                    type="danger"
                    size="small"
                    icon="el-icon-delete"
                    @click="removeRelatedProduct(index)"
                  />
                </el-col>
              </el-row>
            </div>
            <el-button
              type="dashed"
              size="small"
              icon="el-icon-plus"
              @click="addRelatedProduct"
              style="width: 100%; margin-top: 10px"
            >
              添加关联产品
            </el-button>
          </div>
        </el-form-item>

        <!-- 配件产品 -->
        <el-form-item label="推荐配件" prop="accessories">
          <div class="accessories">
            <div 
              v-for="(accessory, index) in formData.accessories" 
              :key="index"
              class="accessory-item"
            >
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-input
                    v-model="accessory.name"
                    placeholder="配件名称"
                    @input="handleAccessoryChange(index, 'name', $event)"
                  />
                </el-col>
                <el-col :span="4">
                  <el-input-number
                    v-model="accessory.price"
                    :min="0"
                    :precision="2"
                    placeholder="价格"
                    style="width: 100%"
                    @change="handleAccessoryChange(index, 'price', $event)"
                  />
                </el-col>
                <el-col :span="2">
                  <el-checkbox
                    v-model="accessory.required"
                    @change="handleAccessoryChange(index, 'required', $event)"
                  >
                    必选
                  </el-checkbox>
                </el-col>
                <el-col :span="8">
                  <el-input
                    v-model="accessory.description"
                    placeholder="配件描述"
                    @input="handleAccessoryChange(index, 'description', $event)"
                  />
                </el-col>
                <el-col :span="2">
                  <el-button
                    type="danger"
                    size="small"
                    icon="el-icon-delete"
                    @click="removeAccessory(index)"
                  />
                </el-col>
              </el-row>
            </div>
            <el-button
              type="dashed"
              size="small"
              icon="el-icon-plus"
              @click="addAccessory"
              style="width: 100%; margin-top: 10px"
            >
              添加推荐配件
            </el-button>
          </div>
        </el-form-item>

        <!-- 产品文档 -->
        <el-divider content-position="left">产品文档</el-divider>

        <el-form-item label="产品文档" prop="documents">
          <div class="documents">
            <div 
              v-for="(document, index) in formData.documents" 
              :key="index"
              class="document-item"
            >
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-input
                    v-model="document.name"
                    placeholder="文档名称"
                    @input="handleDocumentChange(index, 'name', $event)"
                  />
                </el-col>
                <el-col :span="4">
                  <el-select
                    v-model="document.type"
                    placeholder="文档类型"
                    @change="handleDocumentChange(index, 'type', $event)"
                  >
                    <el-option label="PDF" value="pdf" />
                    <el-option label="Word" value="word" />
                    <el-option label="Excel" value="excel" />
                    <el-option label="PPT" value="ppt" />
                    <el-option label="图片" value="image" />
                    <el-option label="视频" value="video" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-col>
                <el-col :span="8">
                  <el-input
                    v-model="document.url"
                    placeholder="文档链接"
                    @input="handleDocumentChange(index, 'url', $event)"
                  />
                </el-col>
                <el-col :span="4">
                  <el-input
                    v-model="document.size"
                    placeholder="文件大小"
                    @input="handleDocumentChange(index, 'size', $event)"
                  />
                </el-col>
                <el-col :span="2">
                  <el-button
                    type="danger"
                    size="small"
                    icon="el-icon-delete"
                    @click="removeDocument(index)"
                  />
                </el-col>
              </el-row>
            </div>
            <el-button
              type="dashed"
              size="small"
              icon="el-icon-plus"
              @click="addDocument"
              style="width: 100%; margin-top: 10px"
            >
              添加产品文档
            </el-button>
          </div>
        </el-form-item>

        <!-- 常见问题 -->
        <el-divider content-position="left">常见问题</el-divider>

        <el-form-item label="FAQ" prop="faqs">
          <div class="faqs">
            <div 
              v-for="(faq, index) in formData.faqs" 
              :key="index"
              class="faq-item"
            >
              <el-row :gutter="10">
                <el-col :span="11">
                  <el-input
                    v-model="faq.question"
                    placeholder="问题"
                    @input="handleFaqChange(index, 'question', $event)"
                  />
                </el-col>
                <el-col :span="11">
                  <el-input
                    v-model="faq.answer"
                    type="textarea"
                    :rows="2"
                    placeholder="回答"
                    @input="handleFaqChange(index, 'answer', $event)"
                  />
                </el-col>
                <el-col :span="2">
                  <el-button
                    type="danger"
                    size="small"
                    icon="el-icon-delete"
                    @click="removeFaq(index)"
                  />
                </el-col>
              </el-row>
            </div>
            <el-button
              type="dashed"
              size="small"
              icon="el-icon-plus"
              @click="addFaq"
              style="width: 100%; margin-top: 10px"
            >
              添加常见问题
            </el-button>
          </div>
        </el-form-item>

        <!-- 依赖产品类型的特殊字段 -->
        <template v-if="dependencyData.productType">
          <el-divider content-position="left">特殊信息</el-divider>

          <!-- 数字产品特有信息 -->
          <template v-if="dependencyData.productType === 'digital'">
            <el-form-item label="系统要求" prop="systemRequirements">
              <el-input
                v-model="formData.systemRequirements"
                type="textarea"
                :rows="3"
                placeholder="请输入系统要求"
                :maxlength="300"
                show-word-limit
                @input="handleFieldChange('systemRequirements', $event)"
              />
            </el-form-item>

            <el-form-item label="安装说明" prop="installationGuide">
              <el-input
                v-model="formData.installationGuide"
                type="textarea"
                :rows="4"
                placeholder="请输入安装说明"
                :maxlength="500"
                show-word-limit
                @input="handleFieldChange('installationGuide', $event)"
              />
            </el-form-item>
          </template>

          <!-- 实物产品特有信息 -->
          <template v-if="dependencyData.productType === 'physical'">
            <el-form-item label="包装清单" prop="packageContents">
              <el-input
                v-model="formData.packageContents"
                type="textarea"
                :rows="3"
                placeholder="请输入包装清单"
                :maxlength="300"
                show-word-limit
                @input="handleFieldChange('packageContents', $event)"
              />
            </el-form-item>

            <el-form-item label="尺寸重量" prop="dimensions">
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-input-number
                    v-model="formData.dimensions.length"
                    placeholder="长度(cm)"
                    :min="0"
                    @change="handleDimensionChange('length', $event)"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="formData.dimensions.width"
                    placeholder="宽度(cm)"
                    :min="0"
                    @change="handleDimensionChange('width', $event)"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="formData.dimensions.height"
                    placeholder="高度(cm)"
                    :min="0"
                    @change="handleDimensionChange('height', $event)"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="formData.dimensions.weight"
                    placeholder="重量(kg)"
                    :min="0"
                    :precision="2"
                    @change="handleDimensionChange('weight', $event)"
                  />
                </el-col>
              </el-row>
            </el-form-item>
          </template>
        </template>

        <!-- 备注信息 -->
        <el-form-item label="备注信息" prop="additionalNotes">
          <el-input
            v-model="formData.additionalNotes"
            type="textarea"
            :rows="4"
            placeholder="请输入其他需要说明的信息"
            :maxlength="500"
            show-word-limit
            @input="handleFieldChange('additionalNotes', $event)"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 信息预览卡片 -->
    <el-card class="preview-card" v-if="mode !== 'view'">
      <div slot="header">
        <span>信息预览</span>
      </div>
      <div class="preview-content">
        <div class="preview-section" v-if="formData.seoTitle || formData.metaDescription">
          <h4>SEO信息</h4>
          <p v-if="formData.seoTitle"><strong>标题：</strong>{{ formData.seoTitle }}</p>
          <p v-if="formData.metaDescription"><strong>描述：</strong>{{ formData.metaDescription }}</p>
          <p v-if="formData.keywords.length > 0">
            <strong>关键词：</strong>{{ formData.keywords.join(', ') }}
          </p>
        </div>
        
        <div class="preview-section" v-if="formData.relatedProducts.length > 0">
          <h4>关联产品 ({{ formData.relatedProducts.length }}个)</h4>
        </div>
        
        <div class="preview-section" v-if="formData.faqs.length > 0">
          <h4>常见问题 ({{ formData.faqs.length }}个)</h4>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { debounce } from 'lodash'

export default {
  name: 'AdditionalInfoModule',
  props: {
    mode: {
      type: String,
      default: 'edit',
      validator: val => ['edit', 'view', 'create'].includes(val)
    },
    dependencyData: {
      type: Object,
      default: () => ({})
    },
    disabled: {
      type: Boolean,
      default: false
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      formData: {
        seoTitle: '',
        metaDescription: '',
        keywords: [],
        relatedProducts: [],
        accessories: [],
        documents: [],
        faqs: [],
        systemRequirements: '',
        installationGuide: '',
        packageContents: '',
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          weight: 0
        },
        additionalNotes: ''
      },
      
      isValid: true, // 附加信息通常不是必填的
      validationErrors: [],
      
      formRules: {
        seoTitle: [
          { max: 60, message: 'SEO标题不能超过60个字符', trigger: 'blur' }
        ],
        metaDescription: [
          { max: 160, message: 'Meta描述不能超过160个字符', trigger: 'blur' }
        ]
      },
      
      // 关键词输入相关
      keywordInputVisible: false,
      keywordInputValue: '',
      
      originalData: {}
    }
  },
  watch: {
    dependencyData: {
      deep: true,
      handler(newVal) {
        this.handleDependencyChange(newVal)
      }
    },
    
    formData: {
      deep: true,
      handler: debounce(function(newVal) {
        this.validateForm()
        this.emitDataChange()
      }, 300)
    }
  },
  created() {
    this.initializeData()
  },
  methods: {
    // ========== 标准接口方法 ==========
    
    setFormData(data) {
      try {
        this.formData = {
          seoTitle: data.seoTitle || '',
          metaDescription: data.metaDescription || '',
          keywords: data.keywords || [],
          relatedProducts: data.relatedProducts || [],
          accessories: data.accessories || [],
          documents: data.documents || [],
          faqs: data.faqs || [],
          systemRequirements: data.systemRequirements || '',
          installationGuide: data.installationGuide || '',
          packageContents: data.packageContents || '',
          dimensions: {
            length: data.dimensions?.length || 0,
            width: data.dimensions?.width || 0,
            height: data.dimensions?.height || 0,
            weight: data.dimensions?.weight || 0
          },
          additionalNotes: data.additionalNotes || ''
        }
        
        this.originalData = JSON.parse(JSON.stringify(this.formData))
        
        this.$nextTick(() => {
          this.validateForm()
        })
      } catch (error) {
        console.error('设置附加信息数据失败:', error)
        this.$message.error('数据设置失败')
      }
    },
    
    async getFormData() {
      try {
        const isValid = await this.validateForm()
        if (!isValid.valid) {
          throw new Error('表单验证失败，请检查输入')
        }
        
        return {
          seoTitle: this.formData.seoTitle.trim(),
          metaDescription: this.formData.metaDescription.trim(),
          keywords: this.formData.keywords.filter(Boolean),
          relatedProducts: this.formData.relatedProducts.filter(p => p.name && p.price >= 0),
          accessories: this.formData.accessories.filter(a => a.name && a.price >= 0),
          documents: this.formData.documents.filter(d => d.name && d.url),
          faqs: this.formData.faqs.filter(f => f.question && f.answer),
          systemRequirements: this.formData.systemRequirements.trim(),
          installationGuide: this.formData.installationGuide.trim(),
          packageContents: this.formData.packageContents.trim(),
          dimensions: this.formData.dimensions,
          additionalNotes: this.formData.additionalNotes.trim()
        }
      } catch (error) {
        console.error('获取附加信息数据失败:', error)
        throw error
      }
    },
    
    async validateForm() {
      try {
        const isValid = await this.$refs.form.validate()
        const errors = []
        
        // 自定义验证逻辑
        if (this.formData.seoTitle && this.formData.seoTitle.length > 60) {
          errors.push({ field: 'seoTitle', message: 'SEO标题过长' })
        }
        
        if (this.formData.metaDescription && this.formData.metaDescription.length > 160) {
          errors.push({ field: 'metaDescription', message: 'Meta描述过长' })
        }
        
        // 验证关联产品
        this.formData.relatedProducts.forEach((product, index) => {
          if (product.name && product.price < 0) {
            errors.push({ field: `relatedProducts[${index}].price`, message: '关联产品价格不能为负数' })
          }
        })
        
        const finalValid = isValid && errors.length === 0
        this.isValid = finalValid
        this.validationErrors = errors
        
        this.$emit('validation-change', {
          module: 'additionalInfo',
          valid: finalValid,
          errors: errors
        })
        
        return { valid: finalValid, errors: errors }
      } catch (error) {
        console.error('附加信息验证失败:', error)
        return { valid: false, errors: [{ field: 'form', message: '验证过程中发生错误' }] }
      }
    },
    
    async resetForm() {
      this.$refs.form.resetFields()
      this.formData = {
        seoTitle: '',
        metaDescription: '',
        keywords: [],
        relatedProducts: [],
        accessories: [],
        documents: [],
        faqs: [],
        systemRequirements: '',
        installationGuide: '',
        packageContents: '',
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          weight: 0
        },
        additionalNotes: ''
      }
      this.isValid = true
      this.validationErrors = []
      this.originalData = {}
    },
    
    updateDependencyData(dependencyData) {
      this.handleDependencyChange(dependencyData)
    },
    
    // ========== 内部方法 ==========
    
    initializeData() {
      // 初始化附加信息数据
    },
    
    handleFieldChange(field, value) {
      const oldValue = this.formData[field]
      this.formData[field] = value
      this.emitDataChange(field, oldValue, value)
    },
    
    emitDataChange(field = null, oldValue = null, newValue = null) {
      this.$emit('data-change', {
        module: 'additionalInfo',
        data: JSON.parse(JSON.stringify(this.formData)),
        field: field,
        oldValue: oldValue,
        newValue: newValue
      })
    },
    
    handleDependencyChange(dependencyData) {
      // 根据产品类型自动填充一些建议信息
      if (dependencyData.productType && dependencyData.name) {
        if (!this.formData.seoTitle) {
          this.formData.seoTitle = `${dependencyData.name} - 优质${this.getProductTypeText(dependencyData.productType)}`
        }
      }
    },
    
    handleFormValidate(prop, isValid, message) {
      console.log('字段验证:', prop, isValid, message)
    },
    
    getProductTypeText(type) {
      const texts = {
        physical: '实物产品',
        digital: '数字产品',
        service: '服务产品'
      }
      return texts[type] || '产品'
    },
    
    // ========== 关键词相关方法 ==========
    
    showKeywordInput() {
      this.keywordInputVisible = true
      this.$nextTick(() => {
        this.$refs.keywordInput.$refs.input.focus()
      })
    },
    
    addKeyword() {
      const keyword = this.keywordInputValue.trim()
      if (keyword && !this.formData.keywords.includes(keyword)) {
        this.formData.keywords.push(keyword)
        this.handleFieldChange('keywords', this.formData.keywords)
      }
      this.keywordInputVisible = false
      this.keywordInputValue = ''
    },
    
    removeKeyword(keyword) {
      const index = this.formData.keywords.indexOf(keyword)
      if (index > -1) {
        this.formData.keywords.splice(index, 1)
        this.handleFieldChange('keywords', this.formData.keywords)
      }
    },
    
    // ========== 关联产品相关方法 ==========
    
    addRelatedProduct() {
      this.formData.relatedProducts.push({
        id: '',
        name: '',
        price: 0,
        image: '',
        url: ''
      })
      this.handleFieldChange('relatedProducts', this.formData.relatedProducts)
    },
    
    removeRelatedProduct(index) {
      this.formData.relatedProducts.splice(index, 1)
      this.handleFieldChange('relatedProducts', this.formData.relatedProducts)
    },
    
    handleRelatedProductChange(index, field, value) {
      this.formData.relatedProducts[index][field] = value
      this.handleFieldChange('relatedProducts', this.formData.relatedProducts)
    },
    
    // ========== 配件相关方法 ==========
    
    addAccessory() {
      this.formData.accessories.push({
        id: '',
        name: '',
        price: 0,
        required: false,
        image: '',
        description: ''
      })
      this.handleFieldChange('accessories', this.formData.accessories)
    },
    
    removeAccessory(index) {
      this.formData.accessories.splice(index, 1)
      this.handleFieldChange('accessories', this.formData.accessories)
    },
    
    handleAccessoryChange(index, field, value) {
      this.formData.accessories[index][field] = value
      this.handleFieldChange('accessories', this.formData.accessories)
    },
    
    // ========== 文档相关方法 ==========
    
    addDocument() {
      this.formData.documents.push({
        id: '',
        name: '',
        url: '',
        type: 'pdf',
        size: '',
        uploadTime: null
      })
      this.handleFieldChange('documents', this.formData.documents)
    },
    
    removeDocument(index) {
      this.formData.documents.splice(index, 1)
      this.handleFieldChange('documents', this.formData.documents)
    },
    
    handleDocumentChange(index, field, value) {
      this.formData.documents[index][field] = value
      this.handleFieldChange('documents', this.formData.documents)
    },
    
    // ========== FAQ相关方法 ==========
    
    addFaq() {
      this.formData.faqs.push({
        id: '',
        question: '',
        answer: '',
        category: 'general',
        order: this.formData.faqs.length
      })
      this.handleFieldChange('faqs', this.formData.faqs)
    },
    
    removeFaq(index) {
      this.formData.faqs.splice(index, 1)
      this.handleFieldChange('faqs', this.formData.faqs)
    },
    
    handleFaqChange(index, field, value) {
      this.formData.faqs[index][field] = value
      this.handleFieldChange('faqs', this.formData.faqs)
    },
    
    // ========== 尺寸相关方法 ==========
    
    handleDimensionChange(field, value) {
      this.formData.dimensions[field] = value
      this.handleFieldChange('dimensions', this.formData.dimensions)
    }
  }
}
</script>

<style scoped>
.additional-info-module {
  padding: 0;
}

.module-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
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

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  line-height: 1.4;
}

.el-divider {
  margin: 30px 0 20px 0;
}

.el-divider__text {
  font-weight: 600;
  color: #409eff;
}

.related-products,
.accessories,
.documents,
.faqs {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;
}

.related-product-item,
.accessory-item,
.document-item,
.faq-item {
  margin-bottom: 12px;
}

.related-product-item:last-child,
.accessory-item:last-child,
.document-item:last-child,
.faq-item:last-child {
  margin-bottom: 0;
}

.preview-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.preview-content {
  padding: 10px;
}

.preview-section {
  margin-bottom: 20px;
}

.preview-section:last-child {
  margin-bottom: 0;
}

.preview-section h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.preview-section p {
  margin: 5px 0;
  font-size: 13px;
  color: #666;
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
  
  .related-products,
  .accessories,
  .documents,
  .faqs {
    padding: 12px;
  }
}
</style> 