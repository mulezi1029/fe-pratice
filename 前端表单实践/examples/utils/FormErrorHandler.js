/**
 * 表单错误处理器
 * 负责统一处理表单相关的错误信息
 */
class FormErrorHandler {

  /**
   * 处理表单验证错误
   * @param {Array} errors - 错误列表
   * @param {Object} moduleRef - 模块组件引用
   * @param {Object} context - Vue组件上下文
   */
  static handleValidationError(errors, moduleRef, context = null) {
    if (!Array.isArray(errors) || errors.length === 0) {
      return
    }

    // 显示第一个错误的消息提示
    const firstError = errors[0]
    if (context && context.$message) {
      context.$message.error(firstError.message || '表单验证失败')
    }

    // 为每个错误字段设置错误状态
    errors.forEach(error => {
      this.setFieldError(error, moduleRef)
    })

    // 滚动到第一个错误字段
    this.scrollToFirstError(errors, moduleRef)
  }

  /**
   * 处理提交错误
   * @param {Error|Object} error - 错误对象
   * @param {Object} context - Vue组件上下文
   */
  static handleSubmitError(error, context) {
    console.error('表单提交错误:', error)

    if (!context || !context.$message) {
      console.error('缺少Vue上下文或$message方法')
      return
    }

    // 根据错误类型处理
    if (error.code) {
      switch (error.code) {
        case 'VALIDATION_FAILED':
          this.handleValidationFailedError(error, context)
          break
        
        case 'NETWORK_ERROR':
          this.handleNetworkError(error, context)
          break
        
        case 'PERMISSION_DENIED':
          this.handlePermissionError(error, context)
          break
        
        case 'DATA_CONFLICT':
          this.handleDataConflictError(error, context)
          break
        
        case 'BUSINESS_ERROR':
          this.handleBusinessError(error, context)
          break
        
        default:
          this.handleGenericError(error, context)
      }
    } else if (error.response) {
      // HTTP响应错误
      this.handleHttpError(error, context)
    } else if (error.message) {
      // 普通错误消息
      context.$message.error(error.message)
    } else {
      // 未知错误
      context.$message.error('操作失败，请稍后重试')
    }
  }

  /**
   * 处理验证失败错误
   */
  static handleValidationFailedError(error, context) {
    if (error.details && typeof error.details === 'object') {
      // 分模块显示验证错误
      Object.keys(error.details).forEach(module => {
        const moduleErrors = error.details[module]
        const moduleRef = context.$refs[module]
        
        if (moduleRef && Array.isArray(moduleErrors)) {
          this.handleValidationError(moduleErrors, moduleRef, context)
        }
      })
      
      context.$message.error('表单验证失败，请检查输入信息')
    } else {
      context.$message.error(error.message || '表单验证失败')
    }
  }

  /**
   * 处理网络错误
   */
  static handleNetworkError(error, context) {
    if (error.timeout) {
      context.$message.error('网络连接超时，请检查网络连接')
    } else {
      context.$message.error('网络连接失败，请检查网络设置')
    }
  }

  /**
   * 处理权限错误
   */
  static handlePermissionError(error, context) {
    context.$message.error('您没有执行此操作的权限')
    
    // 可以跳转到登录页面或权限申请页面
    if (context.$router && error.redirectUrl) {
      setTimeout(() => {
        context.$router.push(error.redirectUrl)
      }, 2000)
    }
  }

  /**
   * 处理数据冲突错误
   */
  static handleDataConflictError(error, context) {
    context.$confirm(
      error.message || '数据已被其他用户修改，是否重新加载最新数据？',
      '数据冲突',
      {
        confirmButtonText: '重新加载',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      // 重新加载数据
      if (context.initFormData && typeof context.initFormData === 'function') {
        context.initFormData()
      }
    }).catch(() => {
      // 用户选择取消
    })
  }

  /**
   * 处理业务错误
   */
  static handleBusinessError(error, context) {
    const message = error.message || '业务处理失败'
    
    if (error.level === 'warning') {
      context.$message.warning(message)
    } else {
      context.$message.error(message)
    }

    // 如果有具体的字段错误，设置字段状态
    if (error.fields && Array.isArray(error.fields)) {
      error.fields.forEach(fieldError => {
        this.setFieldErrorByPath(fieldError, context)
      })
    }
  }

  /**
   * 处理HTTP错误
   */
  static handleHttpError(error, context) {
    const { response } = error
    const status = response?.status
    const data = response?.data

    switch (status) {
      case 400:
        context.$message.error(data?.message || '请求参数错误')
        break
      
      case 401:
        context.$message.error('用户未登录或登录已过期')
        // 跳转到登录页面
        if (context.$router) {
          context.$router.push('/login')
        }
        break
      
      case 403:
        context.$message.error('权限不足，无法执行此操作')
        break
      
      case 404:
        context.$message.error('请求的资源不存在')
        break
      
      case 409:
        context.$message.error('数据冲突，请刷新后重试')
        break
      
      case 422:
        // 表单验证错误
        if (data?.errors) {
          this.handleValidationFailedError({ 
            code: 'VALIDATION_FAILED', 
            details: data.errors 
          }, context)
        } else {
          context.$message.error(data?.message || '数据验证失败')
        }
        break
      
      case 500:
        context.$message.error('服务器内部错误，请稍后重试')
        break
      
      case 502:
      case 503:
      case 504:
        context.$message.error('服务器暂时不可用，请稍后重试')
        break
      
      default:
        context.$message.error(data?.message || '请求失败，请稍后重试')
    }
  }

  /**
   * 处理通用错误
   */
  static handleGenericError(error, context) {
    const message = error.message || '操作失败，请稍后重试'
    context.$message.error(message)
  }

  /**
   * 为字段设置错误状态
   */
  static setFieldError(error, moduleRef) {
    if (!moduleRef || !error.field) {
      return
    }

    try {
      // 尝试通过表单引用设置字段错误
      if (moduleRef.$refs?.form && moduleRef.$refs.form.fields) {
        const field = moduleRef.$refs.form.fields.find(f => f.prop === error.field)
        if (field) {
          field.validateState = 'error'
          field.validateMessage = error.message
        }
      }

      // 尝试直接设置字段错误状态
      if (moduleRef.$refs?.[error.field]) {
        const fieldRef = moduleRef.$refs[error.field]
        if (fieldRef && fieldRef.$el) {
          fieldRef.$el.classList.add('is-error')
        }
      }
    } catch (err) {
      console.warn('设置字段错误状态失败:', err)
    }
  }

  /**
   * 根据路径设置字段错误
   */
  static setFieldErrorByPath(fieldError, context) {
    const { module, field, message } = fieldError
    
    if (module && context.$refs[module]) {
      this.setFieldError({ field, message }, context.$refs[module])
    }
  }

  /**
   * 滚动到第一个错误字段
   */
  static scrollToFirstError(errors, moduleRef) {
    if (!Array.isArray(errors) || errors.length === 0 || !moduleRef) {
      return
    }

    const firstError = errors[0]
    if (!firstError.field) {
      return
    }

    try {
      // 尝试滚动到第一个错误字段
      const fieldElement = this.findFieldElement(firstError.field, moduleRef)
      if (fieldElement) {
        fieldElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
        
        // 聚焦到字段
        const input = fieldElement.querySelector('input, textarea, select')
        if (input) {
          setTimeout(() => {
            input.focus()
          }, 300)
        }
      }
    } catch (err) {
      console.warn('滚动到错误字段失败:', err)
    }
  }

  /**
   * 查找字段元素
   */
  static findFieldElement(fieldName, moduleRef) {
    if (!moduleRef || !moduleRef.$el) {
      return null
    }

    // 尝试通过prop属性查找
    let element = moduleRef.$el.querySelector(`[prop="${fieldName}"]`)
    if (element) {
      return element
    }

    // 尝试通过data-field属性查找
    element = moduleRef.$el.querySelector(`[data-field="${fieldName}"]`)
    if (element) {
      return element
    }

    // 尝试通过name属性查找
    element = moduleRef.$el.querySelector(`[name="${fieldName}"]`)
    if (element) {
      return element.closest('.el-form-item')
    }

    // 尝试通过ID查找
    element = moduleRef.$el.querySelector(`#${fieldName}`)
    if (element) {
      return element.closest('.el-form-item')
    }

    return null
  }

  /**
   * 显示错误详情对话框
   */
  static showErrorDetails(error, context) {
    if (!context || !context.$msgbox) {
      return
    }

    const details = this.formatErrorDetails(error)
    
    context.$msgbox({
      title: '错误详情',
      message: details,
      type: 'error',
      showCancelButton: false,
      confirmButtonText: '确定',
      dangerouslyUseHTMLString: true
    })
  }

  /**
   * 格式化错误详情
   */
  static formatErrorDetails(error) {
    let details = '<div class="error-details">'
    
    if (error.message) {
      details += `<p><strong>错误信息：</strong>${error.message}</p>`
    }
    
    if (error.code) {
      details += `<p><strong>错误代码：</strong>${error.code}</p>`
    }
    
    if (error.timestamp) {
      details += `<p><strong>发生时间：</strong>${new Date(error.timestamp).toLocaleString()}</p>`
    }
    
    if (error.details && typeof error.details === 'object') {
      details += '<p><strong>详细信息：</strong></p><ul>'
      Object.keys(error.details).forEach(key => {
        const value = error.details[key]
        if (Array.isArray(value)) {
          details += `<li>${key}: ${value.join(', ')}</li>`
        } else {
          details += `<li>${key}: ${value}</li>`
        }
      })
      details += '</ul>'
    }
    
    details += '</div>'
    
    return details
  }

  /**
   * 收集页面错误信息（用于错误上报）
   */
  static collectErrorInfo(error, context) {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.$store?.state?.user?.id,
      sessionId: context.$store?.state?.sessionId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      formData: this.sanitizeFormData(context.formData)
    }
  }

  /**
   * 清理表单数据（移除敏感信息）
   */
  static sanitizeFormData(formData) {
    if (!formData || typeof formData !== 'object') {
      return null
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']
    const sanitized = JSON.parse(JSON.stringify(formData))

    const removeSensitiveData = (obj) => {
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '***'
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeSensitiveData(obj[key])
        }
      })
    }

    removeSensitiveData(sanitized)
    return sanitized
  }

  /**
   * 上报错误信息
   */
  static async reportError(error, context) {
    try {
      const errorInfo = this.collectErrorInfo(error, context)
      
      // 这里可以调用错误上报接口
      // await context.$httpAxios.post('/api/error-report', errorInfo)
      
      console.log('错误信息已收集:', errorInfo)
    } catch (reportError) {
      console.error('错误上报失败:', reportError)
    }
  }

  /**
   * 创建用户友好的错误消息
   */
  static createUserFriendlyMessage(error) {
    const errorMessages = {
      'NETWORK_ERROR': '网络连接失败，请检查网络设置后重试',
      'VALIDATION_FAILED': '输入信息有误，请检查后重新提交',
      'PERMISSION_DENIED': '您没有执行此操作的权限',
      'DATA_CONFLICT': '数据已被修改，请刷新后重试',
      'SERVER_ERROR': '服务器暂时不可用，请稍后重试',
      'TIMEOUT': '操作超时，请稍后重试',
      'BUSINESS_ERROR': '业务处理失败，请联系管理员'
    }

    return errorMessages[error.code] || error.message || '操作失败，请稍后重试'
  }

  /**
   * 重试机制
   */
  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (i < maxRetries - 1) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }
    
    throw lastError
  }
}

export default FormErrorHandler 