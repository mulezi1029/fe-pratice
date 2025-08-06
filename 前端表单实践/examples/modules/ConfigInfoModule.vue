<template>
  <div class="config-info-module">
    <el-card class="module-card">
      <div slot="header" class="card-header">
        <span class="module-title">配置信息</span>
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
        <!-- 配送方式 -->
        <el-form-item label="配送方式" prop="deliveryType" required>
          <el-radio-group 
            v-model="formData.deliveryType" 
            @change="handleFieldChange('deliveryType', $event)"
          >
            <el-radio label="express">快递配送</el-radio>
            <el-radio label="selfPickup">到店自提</el-radio>
            <el-radio label="digital">数字交付</el-radio>
            <el-radio label="onsite">现场服务</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 配送费用（快递配送时显示） -->
        <el-form-item 
          v-if="formData.deliveryType === 'express'" 
          label="配送费用" 
          prop="deliveryFee"
        >
          <el-input-number
            v-model="formData.deliveryFee"
            :min="0"
            :max="999.99"
            :precision="2"
            placeholder="请输入配送费用"
            style="width: 100%"
            @change="handleFieldChange('deliveryFee', $event)"
          />
          <div class="form-tip">设置为0表示免费配送</div>
        </el-form-item>

        <!-- 免邮门槛（快递配送时显示） -->
        <el-form-item 
          v-if="formData.deliveryType === 'express'" 
          label="免邮门槛" 
          prop="freeDeliveryAmount"
        >
          <el-input-number
            v-model="formData.freeDeliveryAmount"
            :min="0"
            :max="9999.99"
            :precision="2"
            placeholder="满多少免邮"
            style="width: 100%"
            @change="handleFieldChange('freeDeliveryAmount', $event)"
          />
          <div class="form-tip">设置为0表示不支持免邮</div>
        </el-form-item>

        <!-- 退换货政策 -->
        <el-form-item label="退换货政策" prop="returnPolicy" required>
          <el-select
            v-model="formData.returnPolicy"
            placeholder="请选择退换货政策"
            style="width: 100%"
            @change="handleFieldChange('returnPolicy', $event)"
          >
            <el-option label="7天无理由退货" value="7days" />
            <el-option label="15天无理由退货" value="15days" />
            <el-option label="30天无理由退货" value="30days" />
            <el-option label="不支持退货" value="none" />
            <el-option label="自定义政策" value="custom" />
          </el-select>
        </el-form-item>

        <!-- 自定义退货政策（选择自定义时显示） -->
        <el-form-item 
          v-if="formData.returnPolicy === 'custom'" 
          label="自定义政策" 
          prop="customReturnPolicy"
          required
        >
          <el-input
            v-model="formData.customReturnPolicy"
            type="textarea"
            :rows="3"
            placeholder="请详细描述退换货政策"
            :maxlength="500"
            show-word-limit
            @input="handleFieldChange('customReturnPolicy', $event)"
          />
        </el-form-item>

        <!-- 质保期 -->
        <el-form-item label="质保期" prop="warrantyPeriod">
          <el-select
            v-model="formData.warrantyPeriod"
            placeholder="请选择质保期"
            style="width: 100%"
            @change="handleFieldChange('warrantyPeriod', $event)"
          >
            <el-option label="无质保" value="0" />
            <el-option label="3个月" value="3" />
            <el-option label="6个月" value="6" />
            <el-option label="1年" value="12" />
            <el-option label="2年" value="24" />
            <el-option label="3年" value="36" />
            <el-option label="终身质保" value="lifetime" />
          </el-select>
        </el-form-item>

        <!-- 服务支持 -->
        <el-form-item label="服务支持" prop="serviceSupport">
          <el-checkbox-group 
            v-model="formData.serviceSupport" 
            @change="handleFieldChange('serviceSupport', $event)"
          >
            <el-checkbox label="onlineSupport">在线客服</el-checkbox>
            <el-checkbox label="phoneSupport">电话支持</el-checkbox>
            <el-checkbox label="emailSupport">邮件支持</el-checkbox>
            <el-checkbox label="remoteAssistance">远程协助</el-checkbox>
            <el-checkbox label="onsiteService">上门服务</el-checkbox>
            <el-checkbox label="training">使用培训</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 依赖业务信息的动态配置 -->
        <template v-if="dependencyData.saleType === 'presale'">
          <!-- 预售发货时间 -->
          <el-form-item label="预售发货时间" prop="presaleShipDate" required>
            <el-date-picker
              v-model="formData.presaleShipDate"
              type="date"
              placeholder="选择发货日期"
              style="width: 100%"
              @change="handleFieldChange('presaleShipDate', $event)"
            />
            <div class="form-tip">预售商品的预计发货时间</div>
          </el-form-item>
        </template>

        <template v-if="dependencyData.category && dependencyData.category.includes('electronics')">
          <!-- 电子产品特殊配置 -->
          <el-form-item label="激活方式" prop="activationMethod">
            <el-radio-group 
              v-model="formData.activationMethod" 
              @change="handleFieldChange('activationMethod', $event)"
            >
              <el-radio label="auto">自动激活</el-radio>
              <el-radio label="manual">手动激活</el-radio>
              <el-radio label="none">无需激活</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 授权许可 -->
          <el-form-item label="授权许可" prop="licenseType">
            <el-select
              v-model="formData.licenseType"
              placeholder="请选择授权类型"
              style="width: 100%"
              @change="handleFieldChange('licenseType', $event)"
            >
              <el-option label="单用户许可" value="single" />
              <el-option label="家庭许可" value="family" />
              <el-option label="企业许可" value="enterprise" />
              <el-option label="教育许可" value="education" />
            </el-select>
          </el-form-item>
        </template>

        <!-- 自定义字段 -->
        <el-form-item label="自定义字段">
          <div class="custom-fields">
            <div 
              v-for="(field, index) in formData.customFields" 
              :key="index"
              class="custom-field-item"
            >
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-input
                    v-model="field.label"
                    placeholder="字段名称"
                    @input="handleCustomFieldChange(index, 'label', $event)"
                  />
                </el-col>
                <el-col :span="4">
                  <el-select
                    v-model="field.type"
                    placeholder="类型"
                    @change="handleCustomFieldChange(index, 'type', $event)"
                  >
                    <el-option label="文本" value="text" />
                    <el-option label="数字" value="number" />
                    <el-option label="日期" value="date" />
                    <el-option label="选择" value="select" />
                  </el-select>
                </el-col>
                <el-col :span="10">
                  <el-input
                    v-model="field.value"
                    :placeholder="getFieldPlaceholder(field.type)"
                    @input="handleCustomFieldChange(index, 'value', $event)"
                  />
                </el-col>
                <el-col :span="2">
                  <el-checkbox
                    v-model="field.required"
                    @change="handleCustomFieldChange(index, 'required', $event)"
                  >
                    必填
                  </el-checkbox>
                </el-col>
                <el-col :span="2">
                  <el-button
                    type="danger"
                    size="small"
                    icon="el-icon-delete"
                    @click="removeCustomField(index)"
                  />
                </el-col>
              </el-row>
            </div>
            <el-button
              type="dashed"
              size="small"
              icon="el-icon-plus"
              @click="addCustomField"
              style="width: 100%; margin-top: 10px"
            >
              添加自定义字段
            </el-button>
          </div>
        </el-form-item>

        <!-- 配置说明 -->
        <el-form-item label="配置说明" prop="configDescription">
          <el-input
            v-model="formData.configDescription"
            type="textarea"
            :rows="4"
            placeholder="请输入配置相关的说明信息"
            :maxlength="500"
            show-word-limit
            @input="handleFieldChange('configDescription', $event)"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 配置预览卡片 -->
    <el-card class="config-preview-card" v-if="mode !== 'view'">
      <div slot="header">
        <span>配置预览</span>
      </div>
      <div class="config-preview">
        <div class="config-item">
          <span class="label">配送方式：</span>
          <span class="value">{{ getDeliveryTypeText() }}</span>
        </div>
        <div class="config-item" v-if="formData.deliveryType === 'express'">
          <span class="label">配送费用：</span>
          <span class="value">¥{{ formData.deliveryFee || 0 }}</span>
        </div>
        <div class="config-item">
          <span class="label">退换货：</span>
          <span class="value">{{ getReturnPolicyText() }}</span>
        </div>
        <div class="config-item">
          <span class="label">质保期：</span>
          <span class="value">{{ getWarrantyText() }}</span>
        </div>
        <div class="config-item" v-if="formData.serviceSupport.length > 0">
          <span class="label">服务支持：</span>
          <span class="value">{{ getServiceSupportText() }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { debounce } from 'lodash'

export default {
  name: 'ConfigInfoModule',
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
        deliveryType: 'express',
        deliveryFee: 0,
        freeDeliveryAmount: 0,
        returnPolicy: '7days',
        customReturnPolicy: '',
        warrantyPeriod: '12',
        serviceSupport: ['onlineSupport'],
        presaleShipDate: null,
        activationMethod: 'auto',
        licenseType: 'single',
        customFields: [],
        configDescription: ''
      },
      
      isValid: false,
      validationErrors: [],
      
      formRules: {
        deliveryType: [
          { required: true, message: '请选择配送方式', trigger: 'change' }
        ],
        returnPolicy: [
          { required: true, message: '请选择退换货政策', trigger: 'change' }
        ],
        customReturnPolicy: [
          { 
            validator: this.validateCustomReturnPolicy, 
            trigger: 'change' 
          }
        ],
        presaleShipDate: [
          {
            validator: this.validatePresaleShipDate,
            trigger: 'change'
          }
        ]
      },
      
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
    },
    
    // 监听配送方式变化
    'formData.deliveryType'(newVal, oldVal) {
      if (oldVal && newVal !== oldVal) {
        this.resetDeliveryRelatedFields()
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
          deliveryType: data.deliveryType || 'express',
          deliveryFee: data.deliveryFee || 0,
          freeDeliveryAmount: data.freeDeliveryAmount || 0,
          returnPolicy: data.returnPolicy || '7days',
          customReturnPolicy: data.customReturnPolicy || '',
          warrantyPeriod: data.warrantyPeriod || '12',
          serviceSupport: data.serviceSupport || ['onlineSupport'],
          presaleShipDate: data.presaleShipDate ? new Date(data.presaleShipDate) : null,
          activationMethod: data.activationMethod || 'auto',
          licenseType: data.licenseType || 'single',
          customFields: data.customFields || [],
          configDescription: data.configDescription || ''
        }
        
        this.originalData = JSON.parse(JSON.stringify(this.formData))
        
        this.$nextTick(() => {
          this.validateForm()
        })
      } catch (error) {
        console.error('设置配置信息数据失败:', error)
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
          deliveryType: this.formData.deliveryType,
          deliveryFee: this.formData.deliveryFee,
          freeDeliveryAmount: this.formData.freeDeliveryAmount,
          returnPolicy: this.formData.returnPolicy,
          customReturnPolicy: this.formData.customReturnPolicy.trim(),
          warrantyPeriod: this.formData.warrantyPeriod,
          serviceSupport: this.formData.serviceSupport,
          presaleShipDate: this.formData.presaleShipDate,
          activationMethod: this.formData.activationMethod,
          licenseType: this.formData.licenseType,
          customFields: this.formData.customFields.filter(field => field.label && field.value),
          configDescription: this.formData.configDescription.trim()
        }
      } catch (error) {
        console.error('获取配置信息数据失败:', error)
        throw error
      }
    },
    
    async validateForm() {
      try {
        const isValid = await this.$refs.form.validate()
        const errors = []
        
        // 自定义验证逻辑
        if (this.formData.deliveryType === 'express' && this.formData.deliveryFee < 0) {
          errors.push({ field: 'deliveryFee', message: '配送费用不能小于0' })
        }
        
        if (this.formData.customFields.some(field => field.label && !field.value)) {
          errors.push({ field: 'customFields', message: '自定义字段不能为空' })
        }
        
        const finalValid = isValid && errors.length === 0
        this.isValid = finalValid
        this.validationErrors = errors
        
        this.$emit('validation-change', {
          module: 'configInfo',
          valid: finalValid,
          errors: errors
        })
        
        return { valid: finalValid, errors: errors }
      } catch (error) {
        console.error('配置信息验证失败:', error)
        return { valid: false, errors: [{ field: 'form', message: '验证过程中发生错误' }] }
      }
    },
    
    async resetForm() {
      this.$refs.form.resetFields()
      this.formData = {
        deliveryType: 'express',
        deliveryFee: 0,
        freeDeliveryAmount: 0,
        returnPolicy: '7days',
        customReturnPolicy: '',
        warrantyPeriod: '12',
        serviceSupport: ['onlineSupport'],
        presaleShipDate: null,
        activationMethod: 'auto',
        licenseType: 'single',
        customFields: [],
        configDescription: ''
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
      // 初始化配置数据
    },
    
    handleFieldChange(field, value) {
      const oldValue = this.formData[field]
      this.formData[field] = value
      this.emitDataChange(field, oldValue, value)
    },
    
    emitDataChange(field = null, oldValue = null, newValue = null) {
      this.$emit('data-change', {
        module: 'configInfo',
        data: JSON.parse(JSON.stringify(this.formData)),
        field: field,
        oldValue: oldValue,
        newValue: newValue
      })
    },
    
    handleDependencyChange(dependencyData) {
      // 根据业务信息调整配置选项
      if (dependencyData.saleType === 'digital') {
        this.formData.deliveryType = 'digital'
      }
      
      // 根据产品分类调整配置
      if (dependencyData.category && dependencyData.category.includes('electronics')) {
        // 电子产品默认激活方式
        if (!this.formData.activationMethod) {
          this.formData.activationMethod = 'auto'
        }
      }
    },
    
    handleFormValidate(prop, isValid, message) {
      console.log('字段验证:', prop, isValid, message)
    },
    
    resetDeliveryRelatedFields() {
      if (this.formData.deliveryType !== 'express') {
        this.formData.deliveryFee = 0
        this.formData.freeDeliveryAmount = 0
      }
    },
    
    // ========== 自定义字段相关方法 ==========
    
    addCustomField() {
      this.formData.customFields.push({
        label: '',
        type: 'text',
        value: '',
        required: false
      })
      this.handleFieldChange('customFields', this.formData.customFields)
    },
    
    removeCustomField(index) {
      this.formData.customFields.splice(index, 1)
      this.handleFieldChange('customFields', this.formData.customFields)
    },
    
    handleCustomFieldChange(index, field, value) {
      this.formData.customFields[index][field] = value
      this.handleFieldChange('customFields', this.formData.customFields)
    },
    
    getFieldPlaceholder(type) {
      const placeholders = {
        text: '请输入文本',
        number: '请输入数字',
        date: '请选择日期',
        select: '请输入选项（用逗号分隔）'
      }
      return placeholders[type] || '请输入值'
    },
    
    // ========== 预览相关方法 ==========
    
    getDeliveryTypeText() {
      const texts = {
        express: '快递配送',
        selfPickup: '到店自提',
        digital: '数字交付',
        onsite: '现场服务'
      }
      return texts[this.formData.deliveryType] || '未设置'
    },
    
    getReturnPolicyText() {
      const texts = {
        '7days': '7天无理由退货',
        '15days': '15天无理由退货',
        '30days': '30天无理由退货',
        'none': '不支持退货',
        'custom': '自定义政策'
      }
      return texts[this.formData.returnPolicy] || '未设置'
    },
    
    getWarrantyText() {
      if (this.formData.warrantyPeriod === '0') {
        return '无质保'
      } else if (this.formData.warrantyPeriod === 'lifetime') {
        return '终身质保'
      } else {
        return `${this.formData.warrantyPeriod}个月`
      }
    },
    
    getServiceSupportText() {
      const texts = {
        onlineSupport: '在线客服',
        phoneSupport: '电话支持',
        emailSupport: '邮件支持',
        remoteAssistance: '远程协助',
        onsiteService: '上门服务',
        training: '使用培训'
      }
      return this.formData.serviceSupport.map(item => texts[item]).join('、')
    },
    
    // ========== 验证方法 ==========
    
    validateCustomReturnPolicy(rule, value, callback) {
      if (this.formData.returnPolicy === 'custom' && !value.trim()) {
        callback(new Error('请填写自定义退货政策'))
      } else {
        callback()
      }
    },
    
    validatePresaleShipDate(rule, value, callback) {
      if (this.dependencyData.saleType === 'presale') {
        if (!value) {
          callback(new Error('预售商品必须设置发货时间'))
          return
        }
        
        const shipDate = new Date(value)
        const now = new Date()
        
        if (shipDate <= now) {
          callback(new Error('发货时间必须晚于当前时间'))
          return
        }
      }
      
      callback()
    }
  }
}
</script>

<style scoped>
.config-info-module {
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

.custom-fields {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;
}

.custom-field-item {
  margin-bottom: 12px;
}

.custom-field-item:last-child {
  margin-bottom: 0;
}

.config-preview-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.config-preview {
  padding: 10px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.config-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.config-item .label {
  font-size: 14px;
  color: #666;
  flex: 0 0 100px;
}

.config-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex: 1;
  text-align: right;
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
  
  .config-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .config-item .label {
    flex: none;
  }
  
  .config-item .value {
    text-align: left;
  }
}
</style> 