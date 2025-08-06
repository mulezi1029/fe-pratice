<template>
  <div class="business-info-module">
    <el-card class="module-card">
      <div slot="header" class="card-header">
        <span class="module-title">业务信息</span>
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
        <!-- 销售价格 -->
        <el-form-item label="销售价格" prop="price" required>
          <el-input-number
            v-model="formData.price"
            :min="0"
            :max="999999.99"
            :precision="2"
            placeholder="请输入销售价格"
            style="width: 100%"
            @change="handleFieldChange('price', $event)"
          />
        </el-form-item>

        <!-- 原价 -->
        <el-form-item label="原价" prop="originalPrice">
          <el-input-number
            v-model="formData.originalPrice"
            :min="0"
            :max="999999.99"
            :precision="2"
            placeholder="请输入原价（可选）"
            style="width: 100%"
            @change="handleFieldChange('originalPrice', $event)"
          />
          <div class="form-tip">
            <span v-if="discountPercentage > 0" class="discount-info">
              折扣：{{ discountPercentage }}%
            </span>
          </div>
        </el-form-item>

        <!-- 库存数量 -->
        <el-form-item label="库存数量" prop="inventory" required>
          <el-input-number
            v-model="formData.inventory"
            :min="0"
            :max="999999"
            placeholder="请输入库存数量"
            style="width: 100%"
            @change="handleFieldChange('inventory', $event)"
          />
        </el-form-item>

        <!-- 销售类型 -->
        <el-form-item label="销售类型" prop="saleType" required>
          <el-radio-group 
            v-model="formData.saleType" 
            @change="handleFieldChange('saleType', $event)"
          >
            <el-radio label="normal">正常销售</el-radio>
            <el-radio label="presale">预售</el-radio>
            <el-radio label="limited">限量销售</el-radio>
            <el-radio label="flash">闪购</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 销售时间（预售/限量销售时显示） -->
        <el-form-item 
          v-if="showSaleTime" 
          label="销售时间" 
          prop="saleTimeRange"
          required
        >
          <el-date-picker
            v-model="formData.saleTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
            @change="handleSaleTimeChange"
          />
        </el-form-item>

        <!-- 用户限购（限量销售时显示） -->
        <el-form-item 
          v-if="formData.saleType === 'limited' || formData.saleType === 'flash'" 
          label="用户限购" 
          prop="limitPerUser"
        >
          <el-input-number
            v-model="formData.limitPerUser"
            :min="1"
            :max="100"
            placeholder="每个用户最多购买数量"
            style="width: 100%"
            @change="handleFieldChange('limitPerUser', $event)"
          />
          <div class="form-tip">设置每个用户最多可购买的数量</div>
        </el-form-item>

        <!-- 产品标识 -->
        <el-form-item label="产品标识">
          <el-checkbox-group 
            v-model="formData.productFlags" 
            @change="handleFieldChange('productFlags', $event)"
          >
            <el-checkbox label="isHot">热销</el-checkbox>
            <el-checkbox label="isNew">新品</el-checkbox>
            <el-checkbox label="isRecommend">推荐</el-checkbox>
            <el-checkbox label="isExclusive">独家</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 依赖产品类型的动态字段 -->
        <template v-if="dependencyData.productType === 'physical'">
          <!-- 物流费用 -->
          <el-form-item label="物流费用" prop="shippingFee">
            <el-input-number
              v-model="formData.shippingFee"
              :min="0"
              :max="999.99"
              :precision="2"
              placeholder="请输入物流费用"
              style="width: 100%"
              @change="handleFieldChange('shippingFee', $event)"
            />
          </el-form-item>

          <!-- 免邮门槛 -->
          <el-form-item label="免邮门槛" prop="freeShippingAmount">
            <el-input-number
              v-model="formData.freeShippingAmount"
              :min="0"
              :max="9999.99"
              :precision="2"
              placeholder="满多少免邮"
              style="width: 100%"
              @change="handleFieldChange('freeShippingAmount', $event)"
            />
          </el-form-item>
        </template>

        <template v-if="dependencyData.productType === 'digital'">
          <!-- 下载限制 -->
          <el-form-item label="下载限制" prop="downloadLimit">
            <el-input-number
              v-model="formData.downloadLimit"
              :min="1"
              :max="10"
              placeholder="允许下载次数"
              style="width: 100%"
              @change="handleFieldChange('downloadLimit', $event)"
            />
          </el-form-item>

          <!-- 有效期 -->
          <el-form-item label="有效期" prop="validityPeriod">
            <el-select
              v-model="formData.validityPeriod"
              placeholder="请选择有效期"
              style="width: 100%"
              @change="handleFieldChange('validityPeriod', $event)"
            >
              <el-option label="永久有效" value="permanent" />
              <el-option label="30天" value="30" />
              <el-option label="90天" value="90" />
              <el-option label="365天" value="365" />
            </el-select>
          </el-form-item>
        </template>

        <!-- 销售策略 -->
        <el-form-item label="销售策略" prop="salesStrategy">
          <el-input
            v-model="formData.salesStrategy"
            type="textarea"
            :rows="3"
            placeholder="请输入销售策略描述"
            :maxlength="300"
            show-word-limit
            @input="handleFieldChange('salesStrategy', $event)"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 价格预览卡片 -->
    <el-card class="price-preview-card" v-if="mode !== 'view'">
      <div slot="header">
        <span>价格预览</span>
      </div>
      <div class="price-preview">
        <div class="price-item">
          <span class="label">销售价格：</span>
          <span class="value price">¥{{ formData.price || 0 }}</span>
        </div>
        <div class="price-item" v-if="formData.originalPrice > 0">
          <span class="label">原价：</span>
          <span class="value original-price">¥{{ formData.originalPrice }}</span>
        </div>
        <div class="price-item" v-if="discountPercentage > 0">
          <span class="label">节省：</span>
          <span class="value savings">¥{{ savings }} ({{ discountPercentage }}% off)</span>
        </div>
        <div class="price-item">
          <span class="label">库存：</span>
          <span class="value inventory" :class="{ 'low-stock': formData.inventory < 10 }">
            {{ formData.inventory || 0 }} 件
          </span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { debounce } from 'lodash'

export default {
  name: 'BusinessInfoModule',
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
        price: 0,
        originalPrice: 0,
        inventory: 0,
        saleType: 'normal',
        saleTimeRange: null,
        limitPerUser: 1,
        productFlags: [],
        shippingFee: 0,
        freeShippingAmount: 0,
        downloadLimit: 3,
        validityPeriod: 'permanent',
        salesStrategy: ''
      },
      
      isValid: false,
      validationErrors: [],
      
      formRules: {
        price: [
          { required: true, message: '请输入销售价格', trigger: 'change' },
          { type: 'number', min: 0.01, message: '销售价格必须大于0', trigger: 'change' }
        ],
        inventory: [
          { required: true, message: '请输入库存数量', trigger: 'change' },
          { type: 'number', min: 0, message: '库存数量不能小于0', trigger: 'change' }
        ],
        saleType: [
          { required: true, message: '请选择销售类型', trigger: 'change' }
        ],
        saleTimeRange: [
          { 
            validator: this.validateSaleTimeRange, 
            trigger: 'change' 
          }
        ]
      },
      
      originalData: {}
    }
  },
  computed: {
    showSaleTime() {
      return ['presale', 'limited', 'flash'].includes(this.formData.saleType)
    },
    
    discountPercentage() {
      if (this.formData.originalPrice > 0 && this.formData.price > 0) {
        const discount = ((this.formData.originalPrice - this.formData.price) / this.formData.originalPrice) * 100
        return Math.round(discount)
      }
      return 0
    },
    
    savings() {
      if (this.formData.originalPrice > 0 && this.formData.price > 0) {
        return (this.formData.originalPrice - this.formData.price).toFixed(2)
      }
      return 0
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
    },
    
    // 监听销售类型变化，重置相关字段
    'formData.saleType'(newVal, oldVal) {
      if (oldVal && newVal !== oldVal) {
        this.resetSaleTypeRelatedFields()
      }
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
          price: data.price || 0,
          originalPrice: data.originalPrice || 0,
          inventory: data.inventory || 0,
          saleType: data.saleType || 'normal',
          saleTimeRange: this.transformSaleTimeRange(data.saleStartTime, data.saleEndTime),
          limitPerUser: data.limitPerUser || 1,
          productFlags: this.transformProductFlags(data),
          shippingFee: data.shippingFee || 0,
          freeShippingAmount: data.freeShippingAmount || 0,
          downloadLimit: data.downloadLimit || 3,
          validityPeriod: data.validityPeriod || 'permanent',
          salesStrategy: data.salesStrategy || ''
        }
        
        this.originalData = JSON.parse(JSON.stringify(this.formData))
        
        this.$nextTick(() => {
          this.validateForm()
        })
      } catch (error) {
        console.error('设置业务信息数据失败:', error)
        this.$message.error('数据设置失败')
      }
    },
    
    async getFormData() {
      try {
        const isValid = await this.validateForm()
        if (!isValid.valid) {
          throw new Error('表单验证失败，请检查输入')
        }
        
        const timeRange = this.formData.saleTimeRange || []
        return {
          price: this.formData.price,
          originalPrice: this.formData.originalPrice,
          inventory: this.formData.inventory,
          saleType: this.formData.saleType,
          saleStartTime: timeRange[0] || null,
          saleEndTime: timeRange[1] || null,
          limitPerUser: this.formData.limitPerUser,
          isHot: this.formData.productFlags.includes('isHot'),
          isNew: this.formData.productFlags.includes('isNew'),
          isRecommend: this.formData.productFlags.includes('isRecommend'),
          isExclusive: this.formData.productFlags.includes('isExclusive'),
          shippingFee: this.formData.shippingFee,
          freeShippingAmount: this.formData.freeShippingAmount,
          downloadLimit: this.formData.downloadLimit,
          validityPeriod: this.formData.validityPeriod,
          salesStrategy: this.formData.salesStrategy.trim()
        }
      } catch (error) {
        console.error('获取业务信息数据失败:', error)
        throw error
      }
    },
    
    async validateForm() {
      try {
        const isValid = await this.$refs.form.validate()
        const errors = []
        
        // 自定义验证逻辑
        if (this.formData.price <= 0) {
          errors.push({ field: 'price', message: '销售价格必须大于0' })
        }
        
        if (this.formData.originalPrice > 0 && this.formData.price > this.formData.originalPrice) {
          errors.push({ field: 'price', message: '销售价格不能高于原价' })
        }
        
        if (this.showSaleTime && (!this.formData.saleTimeRange || this.formData.saleTimeRange.length !== 2)) {
          errors.push({ field: 'saleTimeRange', message: '请设置销售时间范围' })
        }
        
        const finalValid = isValid && errors.length === 0
        this.isValid = finalValid
        this.validationErrors = errors
        
        this.$emit('validation-change', {
          module: 'businessInfo',
          valid: finalValid,
          errors: errors
        })
        
        return { valid: finalValid, errors: errors }
      } catch (error) {
        console.error('业务信息验证失败:', error)
        return { valid: false, errors: [{ field: 'form', message: '验证过程中发生错误' }] }
      }
    },
    
    async resetForm() {
      this.$refs.form.resetFields()
      this.formData = {
        price: 0,
        originalPrice: 0,
        inventory: 0,
        saleType: 'normal',
        saleTimeRange: null,
        limitPerUser: 1,
        productFlags: [],
        shippingFee: 0,
        freeShippingAmount: 0,
        downloadLimit: 3,
        validityPeriod: 'permanent',
        salesStrategy: ''
      }
      this.isValid = false
      this.validationErrors = []
      this.originalData = {}
    },
    
    updateDependencyData(dependencyData) {
      this.handleDependencyChange(dependencyData)
    },
    
    // ========== 内部方法 ==========
    
    initializeData() {
      // 初始化业务数据
    },
    
    handleFieldChange(field, value) {
      const oldValue = this.formData[field]
      this.formData[field] = value
      this.emitDataChange(field, oldValue, value)
    },
    
    emitDataChange(field = null, oldValue = null, newValue = null) {
      this.$emit('data-change', {
        module: 'businessInfo',
        data: JSON.parse(JSON.stringify(this.formData)),
        field: field,
        oldValue: oldValue,
        newValue: newValue
      })
    },
    
    handleDependencyChange(dependencyData) {
      // 根据产品类型调整表单字段
      if (dependencyData.productType) {
        this.adjustFieldsByProductType(dependencyData.productType)
      }
      
      // 根据产品分类调整价格建议
      if (dependencyData.category) {
        this.suggestPriceByCategory(dependencyData.category)
      }
    },
    
    handleFormValidate(prop, isValid, message) {
      console.log('字段验证:', prop, isValid, message)
    },
    
    handleSaleTimeChange(value) {
      this.formData.saleTimeRange = value
      this.handleFieldChange('saleTimeRange', value)
    },
    
    transformSaleTimeRange(startTime, endTime) {
      if (startTime && endTime) {
        return [new Date(startTime), new Date(endTime)]
      }
      return null
    },
    
    transformProductFlags(data) {
      const flags = []
      if (data.isHot) flags.push('isHot')
      if (data.isNew) flags.push('isNew')
      if (data.isRecommend) flags.push('isRecommend')
      if (data.isExclusive) flags.push('isExclusive')
      return flags
    },
    
    resetSaleTypeRelatedFields() {
      if (!this.showSaleTime) {
        this.formData.saleTimeRange = null
      }
      
      if (!['limited', 'flash'].includes(this.formData.saleType)) {
        this.formData.limitPerUser = 1
      }
    },
    
    adjustFieldsByProductType(productType) {
      // 根据产品类型调整表单字段的显示和验证
      console.log('根据产品类型调整字段:', productType)
      
      if (productType === 'digital') {
        // 数字产品不需要物流费用
        this.formData.shippingFee = 0
        this.formData.freeShippingAmount = 0
      }
    },
    
    suggestPriceByCategory(category) {
      // 根据产品分类提供价格建议
      const priceSuggestions = {
        'electronics.phone': { min: 1000, max: 8000 },
        'electronics.computer': { min: 3000, max: 15000 },
        'clothing.men': { min: 50, max: 500 },
        'clothing.women': { min: 80, max: 800 }
      }
      
      const categoryKey = Array.isArray(category) ? category.join('.') : category
      const suggestion = priceSuggestions[categoryKey]
      
      if (suggestion && this.formData.price === 0) {
        // 如果价格为0，给出建议价格
        this.$message.info(`建议价格范围：¥${suggestion.min} - ¥${suggestion.max}`)
      }
    },
    
    validateSaleTimeRange(rule, value, callback) {
      if (this.showSaleTime) {
        if (!value || !Array.isArray(value) || value.length !== 2) {
          callback(new Error('请设置销售时间范围'))
          return
        }
        
        const [startTime, endTime] = value
        const now = new Date()
        
        if (startTime < now) {
          callback(new Error('开始时间不能早于当前时间'))
          return
        }
        
        if (endTime <= startTime) {
          callback(new Error('结束时间必须晚于开始时间'))
          return
        }
        
        const timeDiff = (endTime - startTime) / (1000 * 60 * 60) // 小时
        if (timeDiff < 1) {
          callback(new Error('销售时间至少持续1小时'))
          return
        }
      }
      
      callback()
    }
  }
}
</script>

<style scoped>
.business-info-module {
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

.discount-info {
  color: #f56c6c;
  font-weight: 500;
}

.price-preview-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.price-preview {
  padding: 10px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.price-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.price-item .label {
  font-size: 14px;
  color: #666;
}

.price-item .value {
  font-size: 14px;
  font-weight: 500;
}

.price-item .value.price {
  color: #f56c6c;
  font-size: 16px;
  font-weight: 600;
}

.price-item .value.original-price {
  color: #999;
  text-decoration: line-through;
}

.price-item .value.savings {
  color: #67c23a;
}

.price-item .value.inventory {
  color: #409eff;
}

.price-item .value.inventory.low-stock {
  color: #f56c6c;
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
  
  .price-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style> 