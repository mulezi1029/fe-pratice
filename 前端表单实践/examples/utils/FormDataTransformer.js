/**
 * 表单数据转换器
 * 负责在接口数据格式和组件数据格式之间进行转换
 */
class FormDataTransformer {
  
  /**
   * 将接口数据转换为组件数据格式
   * @param {Object} apiData - 来自接口的原始数据
   * @param {string} moduleType - 模块类型
   * @returns {Object} 转换后的组件数据
   */
  static toComponentFormat(apiData, moduleType) {
    if (!apiData || typeof apiData !== 'object') {
      return {}
    }

    const transformers = {
      // 基础信息模块转换器
      basicInfo: (data) => {
        return {
          name: data.productName || data.name || '',
          productType: data.productType || data.type || '',
          category: this.transformCategory(data.categoryPath || data.category || []),
          description: data.description || data.desc || '',
          tags: this.transformTags(data.tags || data.tagList || []),
          images: this.transformImages(data.images || data.imageList || []),
          enabled: data.enabled !== undefined ? data.enabled : (data.status === 1),
          remark: data.remark || data.remarks || ''
        }
      },

      // 业务信息模块转换器
      businessInfo: (data) => {
        const saleInfo = data.saleInfo || data.business || {}
        return {
          price: saleInfo.price || saleInfo.salePrice || 0,
          originalPrice: saleInfo.originalPrice || saleInfo.listPrice || 0,
          inventory: saleInfo.inventory || saleInfo.stock || 0,
          saleType: saleInfo.saleType || saleInfo.type || 'normal',
          saleStartTime: this.transformDateTime(saleInfo.saleStartTime),
          saleEndTime: this.transformDateTime(saleInfo.saleEndTime),
          limitPerUser: saleInfo.limitPerUser || saleInfo.userLimit || 0,
          isHot: saleInfo.isHot || saleInfo.hot || false,
          isNew: saleInfo.isNew || saleInfo.new || false,
          isRecommend: saleInfo.isRecommend || saleInfo.recommend || false
        }
      },

      // 配置信息模块转换器
      configInfo: (data) => {
        const configInfo = data.configInfo || data.config || {}
        return {
          deliveryType: configInfo.deliveryType || configInfo.delivery || 'express',
          deliveryFee: configInfo.deliveryFee || configInfo.shippingFee || 0,
          freeDeliveryAmount: configInfo.freeDeliveryAmount || configInfo.freeShipping || 0,
          returnPolicy: configInfo.returnPolicy || configInfo.returns || '',
          warrantyPeriod: configInfo.warrantyPeriod || configInfo.warranty || 0,
          serviceSupport: this.transformServiceSupport(configInfo.serviceSupport || []),
          customFields: this.transformCustomFields(configInfo.customFields || {})
        }
      },

      // 附加信息模块转换器
      additionalInfo: (data) => {
        const additionalInfo = data.additionalInfo || data.additional || {}
        return {
          keywords: this.transformKeywords(additionalInfo.keywords || data.keywords || []),
          metaDescription: additionalInfo.metaDescription || data.metaDesc || '',
          seoTitle: additionalInfo.seoTitle || data.seoTitle || '',
          relatedProducts: this.transformRelatedProducts(additionalInfo.relatedProducts || []),
          accessories: this.transformAccessories(additionalInfo.accessories || []),
          documents: this.transformDocuments(additionalInfo.documents || []),
          faqs: this.transformFaqs(additionalInfo.faqs || [])
        }
      }
    }

    const transformer = transformers[moduleType]
    if (!transformer) {
      console.warn(`未找到模块 ${moduleType} 的转换器`)
      return {}
    }

    try {
      return transformer.call(this, apiData)
    } catch (error) {
      console.error(`转换 ${moduleType} 数据时发生错误:`, error)
      return {}
    }
  }

  /**
   * 将组件数据转换为接口数据格式
   * @param {Object} componentData - 组件数据集合
   * @returns {Object} 转换后的接口数据
   */
  static toApiFormat(componentData) {
    if (!componentData || typeof componentData !== 'object') {
      return {}
    }

    try {
      const apiData = {}

      // 处理基础信息
      if (componentData.basicInfo) {
        const basic = componentData.basicInfo
        apiData.productName = basic.name
        apiData.productType = basic.productType
        apiData.categoryPath = basic.category
        apiData.description = basic.description
        apiData.tags = basic.tags
        apiData.images = basic.images.map(img => img.url || img.response?.url).filter(Boolean)
        apiData.enabled = basic.enabled
        apiData.remark = basic.remark
      }

      // 处理业务信息
      if (componentData.businessInfo) {
        const business = componentData.businessInfo
        apiData.saleInfo = {
          price: business.price,
          originalPrice: business.originalPrice,
          inventory: business.inventory,
          saleType: business.saleType,
          saleStartTime: this.formatDateTime(business.saleStartTime),
          saleEndTime: this.formatDateTime(business.saleEndTime),
          limitPerUser: business.limitPerUser,
          isHot: business.isHot,
          isNew: business.isNew,
          isRecommend: business.isRecommend
        }
      }

      // 处理配置信息
      if (componentData.configInfo) {
        const config = componentData.configInfo
        apiData.configInfo = {
          deliveryType: config.deliveryType,
          deliveryFee: config.deliveryFee,
          freeDeliveryAmount: config.freeDeliveryAmount,
          returnPolicy: config.returnPolicy,
          warrantyPeriod: config.warrantyPeriod,
          serviceSupport: config.serviceSupport,
          customFields: config.customFields
        }
      }

      // 处理附加信息
      if (componentData.additionalInfo) {
        const additional = componentData.additionalInfo
        apiData.additionalInfo = {
          keywords: additional.keywords,
          metaDescription: additional.metaDescription,
          seoTitle: additional.seoTitle,
          relatedProducts: additional.relatedProducts.map(p => p.id || p.productId),
          accessories: additional.accessories.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price
          })),
          documents: additional.documents.map(d => ({
            name: d.name,
            url: d.url,
            type: d.type
          })),
          faqs: additional.faqs.map(f => ({
            question: f.question,
            answer: f.answer
          }))
        }
      }

      return apiData
    } catch (error) {
      console.error('转换为接口数据格式时发生错误:', error)
      throw new Error('数据转换失败')
    }
  }

  // ========== 私有转换方法 ==========

  /**
   * 转换分类数据
   */
  static transformCategory(categoryData) {
    if (Array.isArray(categoryData)) {
      return categoryData
    }
    if (typeof categoryData === 'string') {
      return categoryData.split(',').filter(Boolean)
    }
    return []
  }

  /**
   * 转换标签数据
   */
  static transformTags(tagsData) {
    if (Array.isArray(tagsData)) {
      return tagsData.map(tag => typeof tag === 'object' ? tag.name || tag.label : String(tag))
    }
    if (typeof tagsData === 'string') {
      return tagsData.split(',').map(tag => tag.trim()).filter(Boolean)
    }
    return []
  }

  /**
   * 转换图片数据
   */
  static transformImages(imagesData) {
    if (!Array.isArray(imagesData)) {
      return []
    }

    return imagesData.map((img, index) => {
      if (typeof img === 'string') {
        return {
          uid: `image-${index}`,
          name: img.split('/').pop() || `image-${index}`,
          url: img,
          status: 'done'
        }
      }
      
      if (typeof img === 'object' && img) {
        return {
          uid: img.uid || img.id || `image-${index}`,
          name: img.name || img.fileName || `image-${index}`,
          url: img.url || img.imageUrl,
          status: img.status || 'done'
        }
      }
      
      return null
    }).filter(Boolean)
  }

  /**
   * 转换日期时间
   */
  static transformDateTime(dateTime) {
    if (!dateTime) return null
    
    if (dateTime instanceof Date) {
      return dateTime
    }
    
    if (typeof dateTime === 'string' || typeof dateTime === 'number') {
      const date = new Date(dateTime)
      return isNaN(date.getTime()) ? null : date
    }
    
    return null
  }

  /**
   * 格式化日期时间为字符串
   */
  static formatDateTime(dateTime) {
    if (!dateTime) return null
    
    const date = dateTime instanceof Date ? dateTime : new Date(dateTime)
    if (isNaN(date.getTime())) return null
    
    return date.toISOString()
  }

  /**
   * 转换服务支持数据
   */
  static transformServiceSupport(serviceSupportData) {
    if (!Array.isArray(serviceSupportData)) {
      return []
    }

    return serviceSupportData.map(service => {
      if (typeof service === 'string') {
        return { type: service, enabled: true }
      }
      return {
        type: service.type || service.name,
        enabled: service.enabled !== undefined ? service.enabled : true,
        description: service.description || ''
      }
    })
  }

  /**
   * 转换自定义字段
   */
  static transformCustomFields(customFieldsData) {
    if (!customFieldsData || typeof customFieldsData !== 'object') {
      return {}
    }

    const result = {}
    Object.keys(customFieldsData).forEach(key => {
      const field = customFieldsData[key]
      if (typeof field === 'object' && field !== null) {
        result[key] = {
          value: field.value,
          type: field.type || 'text',
          label: field.label || key,
          required: field.required || false
        }
      } else {
        result[key] = {
          value: field,
          type: 'text',
          label: key,
          required: false
        }
      }
    })

    return result
  }

  /**
   * 转换关键词数据
   */
  static transformKeywords(keywordsData) {
    if (Array.isArray(keywordsData)) {
      return keywordsData.filter(Boolean)
    }
    if (typeof keywordsData === 'string') {
      return keywordsData.split(',').map(kw => kw.trim()).filter(Boolean)
    }
    return []
  }

  /**
   * 转换关联产品数据
   */
  static transformRelatedProducts(relatedProductsData) {
    if (!Array.isArray(relatedProductsData)) {
      return []
    }

    return relatedProductsData.map(product => {
      if (typeof product === 'object' && product) {
        return {
          id: product.id || product.productId,
          name: product.name || product.productName,
          price: product.price || 0,
          image: product.image || product.imageUrl || '',
          url: product.url || ''
        }
      }
      return null
    }).filter(Boolean)
  }

  /**
   * 转换配件数据
   */
  static transformAccessories(accessoriesData) {
    if (!Array.isArray(accessoriesData)) {
      return []
    }

    return accessoriesData.map(accessory => {
      if (typeof accessory === 'object' && accessory) {
        return {
          id: accessory.id,
          name: accessory.name,
          price: accessory.price || 0,
          required: accessory.required || false,
          image: accessory.image || '',
          description: accessory.description || ''
        }
      }
      return null
    }).filter(Boolean)
  }

  /**
   * 转换文档数据
   */
  static transformDocuments(documentsData) {
    if (!Array.isArray(documentsData)) {
      return []
    }

    return documentsData.map(doc => {
      if (typeof doc === 'object' && doc) {
        return {
          id: doc.id,
          name: doc.name || doc.fileName,
          url: doc.url || doc.fileUrl,
          type: doc.type || doc.fileType || 'pdf',
          size: doc.size || doc.fileSize || 0,
          uploadTime: this.transformDateTime(doc.uploadTime || doc.createTime)
        }
      }
      return null
    }).filter(Boolean)
  }

  /**
   * 转换FAQ数据
   */
  static transformFaqs(faqsData) {
    if (!Array.isArray(faqsData)) {
      return []
    }

    return faqsData.map(faq => {
      if (typeof faq === 'object' && faq) {
        return {
          id: faq.id,
          question: faq.question || faq.q,
          answer: faq.answer || faq.a,
          category: faq.category || 'general',
          order: faq.order || 0
        }
      }
      return null
    }).filter(Boolean)
  }

  /**
   * 深度克隆对象
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item))
    }
    
    const cloned = {}
    Object.keys(obj).forEach(key => {
      cloned[key] = this.deepClone(obj[key])
    })
    
    return cloned
  }

  /**
   * 验证数据结构
   */
  static validateDataStructure(data, schema) {
    // 简单的数据结构验证
    if (!data || !schema) return false
    
    try {
      Object.keys(schema).forEach(key => {
        const expected = schema[key]
        const actual = data[key]
        
        if (expected.required && (actual === undefined || actual === null)) {
          throw new Error(`缺少必需字段: ${key}`)
        }
        
        if (actual !== undefined && expected.type && typeof actual !== expected.type) {
          throw new Error(`字段 ${key} 类型错误，期望 ${expected.type}，实际 ${typeof actual}`)
        }
      })
      
      return true
    } catch (error) {
      console.error('数据结构验证失败:', error.message)
      return false
    }
  }
}

export default FormDataTransformer 