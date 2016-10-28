do ->

  owluilite = (element, options) ->
    @$element = $(element)
    @opts = $.extend(true, {}, @opts, @$element.data(), options)
    # setup animation
    if @opts.hasOwnProperty('animation') and @opts.animation == false
      @opts.animation = {}
      @opts.animation.open = 'show'
      @opts.animation.close = 'hide'
    return

  owluilite.prototype =

    callback: (type) ->
      value = undefined
      args = [].slice.call(arguments).splice(1)
      eventNamespace = @pluginName
      # on element callback
      if typeof @$element != 'undefined'
        value = @fireCallback($._data(@$element[0], 'events'), type, eventNamespace, args)
        if typeof value != 'undefined'
          return value
      # on target callback
      if typeof @$target != 'undefined' and typeof @$target != null
        events = undefined
        if @$target.length == 1
          events = $._data(@$target[0], 'events')
          value = @fireCallback(events, type, eventNamespace, args)
          if typeof value != 'undefined'
            return value
        else
          value = []
          @$target.each $.proxy(((i, s) ->
            events = $._data(s, 'events')
            value.push @fireCallback(events, type, eventNamespace, args)
            return
          ), this)
          return value
      # no callback
      if typeof @opts == 'undefined' or typeof @opts.callbacks == 'undefined' or typeof @opts.callbacks[type] == 'undefined'
        return args
      # opts callback
      callback = @opts.callbacks[type]
      if $.isFunction(callback) then callback.apply(this, args) else args

    fireCallback: (events, type, eventNamespace, args) ->
      if typeof events != 'undefined' and typeof events[type] != 'undefined'
        len = events[type].length
        i = 0
        while i < len
          namespace = events[type][i].namespace
          if namespace == 'callback.' + eventNamespace or namespace == eventNamespace + '.callback'
            return events[type][i].handler.apply(this, args)
          i++
      return

    disableBodyScroll: ->
      $body = $('html')
      windowWidth = window.innerWidth
      if !windowWidth
        documentElementRect = document.documentElement.getBoundingClientRect()
        windowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
      isOverflowing = document.body.clientWidth < windowWidth
      scrollbarWidth = @measureScrollbar()
      $body.css 'overflow', 'hidden'
      if isOverflowing
        $body.css 'padding-right', scrollbarWidth
      return

    measureScrollbar: ->
      $body = $('body')
      scrollDiv = document.createElement('div')
      scrollDiv.className = 'scrollbar-measure'
      $body.append scrollDiv
      scrollbarWidth = scrollDiv.offsetWidth - (scrollDiv.clientWidth)
      $body[0].removeChild scrollDiv
      scrollbarWidth

    enableBodyScroll: ->
      $('html').css
        'overflow': ''
        'padding-right': ''
      return

    appendFields: (data) ->
      if @opts.appendFields == false
        return data
      $fields = $(@opts.appendFields)
      if $fields.length == 0
        data
      else
        str = ''
        $fields.each ->
          str += '&' + $(this).attr('name') + '=' + $(this).val()
          return
        if data == '' then str.replace(/^&/, '') else data + str

    appendFieldsAsData: (data) ->
      if @opts.appendFields == false
        return data
      $fields = $(@opts.appendFields)
      if $fields.length == 0
        data
      else
        $fields.each ->
          data.append $(this).attr('name'), $(this).val()
          return
        data

    appendForms: (data) ->
      if @opts.appendForms == false
        return data
      $forms = $(@opts.appendForms)
      if $forms.length == 0
        data
      else
        str = $forms.serialize()
        if data == '' then str else data + '&' + str

    appendFormsAsData: (data) ->
      if @opts.appendForms == false
        return data
      formsData = $(@opts.appendForms).serializeArray()
      $.each formsData, (z, f) ->
        data.append f.name, f.value
        return
      data

  owlUiLite =
    pluginsByClass: {}
    classByPlugin: {}
    directLoad: 'message': 'open'

    plugin: (name, obj) ->

      klass = ->
        if obj.hasOwnProperty('init')
          obj.init.apply this, arguments
        return

      obj.pluginName = name
      klass.prototype = Object.create(owluilite.prototype)
      klass::constructor = klass
      for key of obj
        klass.prototype[key] = obj[key]
      classname = if obj.hasOwnProperty('classname') then obj.classname else false
      if classname
        owlUiLite.classByPlugin[name] = classname
        owlUiLite.pluginsByClass[classname] = name
      $.fn[name] = owlUiLite.createPlugin(name, klass, classname)
      klass

    createPlugin: (name, obj, classname) ->

      plugin = (options) ->
        val = []
        args = Array::slice.call(arguments, 1)
        if typeof options == 'string'
          @eq(0).each ->
            instance = $.data(this, name)
            if typeof instance != 'undefined' and $.isFunction(instance[options])
              methodVal = instance[options].apply(instance, args)
              if methodVal != undefined and methodVal != instance
                val.push methodVal
            else
              direct = false
              for key of owlUiLite.directLoad
                if name == key and options == owlUiLite.directLoad[key]
                  direct = true
                  owlUiLite.directPluginLoad this, name
              if !direct
                return $.error('No such method "' + options + '" for ' + name)
            return
        else
          @each ->
            $el = $(this)
            # loaded
            if $el.attr('data-component-' + name + '-loaded') == true
              return
            $el.attr 'data-component-' + name + '-loaded', true
            instance = new obj(this, options)
            $.data this, name, {}
            $.data this, name, instance
            # target api
            if typeof instance.$target != 'undefined' and typeof instance.$target != null
              instance.$target.data name, instance
            return
        if val.length == 0 or val.length == 1 then (if val.length == 0 then this else val[0]) else val

      $(window).on 'load.components.' + name, ->
        if classname
          $('.' + classname)[name]()
        $('[data-component="' + name + '"]')[name]()
        return
      plugin

    directPluginLoad: (target, name) ->
      element = document.createElement('span')
      $(element)[name]
        target: target
        show: true
      return

  window.owluilite = owluilite
  window.owlUiLite = owlUiLite
  return

(($) ->
  Animation = (element, animation, options, callback) ->
    # default
    opts =
      name: 'show'
      duration: 0.5
      iterate: 1
      delay: 0
      prefix: ''
      timing: 'linear'
    # animation name or options
    if typeof animation == 'object'
      callback = options
      options = animation
    else
      opts.name = animation
    # options or callback
    if typeof options == 'function'
      callback = options
      @opts = opts
    else
      @opts = $.extend(opts, options)
    @slide = @opts.name == 'slideDown' or @opts.name == 'slideUp'
    @$element = $(element)
    @prefixes = [
      ''
      '-moz-'
      '-o-animation-'
      '-webkit-'
    ]
    @queue = []
    # slide
    if @slide
      @$element.height @$element.height()
    # init
    @init callback
    return
  $.fn.animation = (animation, options, callback) ->
    @each ->
      new Animation(this, animation, options, callback)

  Animation.prototype =
    init: (callback) ->
      @queue.push @opts.name
      @clean()
      if @opts.name == 'show'
        @$element.removeClass('hide').show()
      else if @opts.name == 'hide'
        @$element.hide()
      if @opts.name == 'show' or @opts.name == 'hide'
        @opts.timing = 'linear'
        if typeof callback == 'function'
          setTimeout callback, @opts.duration * 1000
      else
        @animate callback
      return
    animate: (callback) ->
      @$element.addClass('animated').css('display', 'block').removeClass 'hide'
      @$element.addClass @opts.prefix + @queue[0]
      @set @opts.duration + 's', @opts.delay + 's', @opts.iterate, @opts.timing
      _callback = if @queue.length > 1 then null else callback
      @complete 'AnimationEnd', $.proxy(@makeComplete, this), _callback
      return
    set: (duration, delay, iterate, timing) ->
      len = @prefixes.length
      while len--
        @$element.css @prefixes[len] + 'animation-duration', duration
        @$element.css @prefixes[len] + 'animation-delay', delay
        @$element.css @prefixes[len] + 'animation-iteration-count', iterate
        @$element.css @prefixes[len] + 'animation-timing-function', timing
      return
    clean: ->
      @$element.removeClass('animated').removeClass @opts.prefix + @queue[0]
      @set '', '', '', ''
      return
    makeComplete: ->
      if @$element.hasClass(@opts.prefix + @queue[0])
        @clean()
        @queue.shift()
        if @queue.length
          @animate callback
      return
    complete: (type, make, callback) ->
      event = type.toLowerCase() + ' webkit' + type + ' o' + type + ' MS' + type
      @$element.one event, $.proxy((->
        if typeof make == 'function'
          make()
        # hide
        effects = [
          'fadeOut'
          'slideUp'
          'zoomOut'
          'slideOutUp'
          'slideOutRight'
          'slideOutLeft'
        ]
        if $.inArray(@opts.name, effects) != -1
          @$element.css 'display', 'none'
        # slide
        if @slide
          @$element.css 'height', ''
        if typeof callback == 'function'
          callback this
        @$element.off event
        return
      ), this)
      return
  return
) jQuery

# Direct Load
(($) ->
  $.modalcurrent = null

  $.modalwindow = (options) ->
    if typeof @element == 'undefined'
      @element = document.createElement('span')
    if typeof options == 'string'
      args = Array::slice.call(arguments, 1)
      $(@element).modal options, args[0]
    else
      options.show = true
      $(@element).modal options
    return

  return
) jQuery

do (owluilite) ->
  owluilite.Modal = owlUiLite.plugin('modal',
    opts:
      target: null
      url: false
      header: false
      width: '600px'
      height: false
      maxHeight: false
      position: 'center'
      show: false
      overlay: true
      appendForms: false
      appendFields: false
      animation:
        open:
          name: 'show'
          timing: 'linear'
          duration: 0.25
        close:
          name: 'hide'
          timing: 'linear'
          duration: 0.25
      callbacks: [
        'open'
        'opened'
        'close'
        'closed'
      ]
    init: ->
      owluilite.apply this, arguments
      if @opts.target == null
        return
      @$target = $(@opts.target)
      if @$target.length == 0
        return
      if @opts.show
        @load false
      else
        @$element.on 'mousedown.component.modal', $.proxy(@load, this)
      return
    load: (e) ->
      if e and e.preventDefault
        e.preventDefault()
      if @$element.hasClass('in')
        return
      @buildModal()
      @buildOverlay()
      @buildHeader()
      if @opts.url
        @buildContent()
      else
        @open()
      return
    buildModal: ->
      @$modal = @$target.find('.modal')
      @$header = @$target.find('.modal-header')
      @$close = @$target.find('.close')
      @$body = @$target.find('.modal-body')
      return
    buildOverlay: ->
      if @opts.overlay == false
        return
      if $('#modal-overlay').length != 0
        @$overlay = $('#modal-overlay')
      else
        @$overlay = $('<div id="modal-overlay">').hide()
        $('body').prepend @$overlay
      @$overlay.addClass 'overlay'
      return
    buildHeader: ->
      if @opts.header
        @$header.html @opts.header
      return
    buildContent: ->
      params = ''
      params = @appendForms(params)
      params = @appendFields(params)
      $.ajax
        url: @opts.url + '?' + (new Date).getTime()
        cache: false
        type: 'post'
        data: params
        success: $.proxy(((data) ->
          @$body.html data
          @open()
          return
        ), this)
      return
    buildWidth: ->
      width = @opts.width
      top = '2%'
      bottom = '2%'
      percent = width.match(/%$/)
      if parseInt(@opts.width) > $(window).width() and !percent
        width = '96%'
      else if !percent
        top = '16px'
        bottom = '16px'
      @$modal.css
        'width': width
        'margin-top': top
        'margin-bottom': bottom
      return
    buildPosition: ->
      if @opts.position != 'center'
        return
      windowHeight = $(window).height()
      height = @$modal.outerHeight()
      top = windowHeight / 2 - (height / 2) + 'px'
      # if @isMobile()
      #   top = '2%'
      if height > windowHeight
        top = '16px'
      @$modal.css 'margin-top', top
      return
    buildHeight: ->
      windowHeight = $(window).height()
      if @opts.maxHeight
        padding = parseInt(@$body.css('padding-top')) + parseInt(@$body.css('padding-bottom'))
        margin = parseInt(@$modal.css('margin-top')) + parseInt(@$modal.css('margin-bottom'))
        height = windowHeight - @$header.innerHeight() - padding - margin
        @$body.height height
      else if @opts.height != false
        @$body.css 'height', @opts.height
      modalHeight = @$modal.outerHeight()
      if modalHeight > windowHeight
        @opts.animation.open.name = 'show'
        @opts.animation.close.name = 'hide'
      return
    resize: ->
      @buildWidth()
      @buildPosition()
      @buildHeight()
      return
    enableEvents: ->
      @$close.on 'click.component.modal', $.proxy(@close, this)
      $(document).on 'keyup.component.modal', $.proxy(@handleEscape, this)
      @$target.on 'click.component.modal', $.proxy(@close, this)
      return
    disableEvents: ->
      @$close.off '.component.modal'
      $(document).off '.component.modal'
      @$target.off '.component.modal'
      $(window).off '.component.modal'
      return
    findActions: ->
      @$body.find('[data-action="modal-close"]').on 'mousedown.component.modal', $.proxy(@close, this)
      return
    setHeader: (header) ->
      @$header.html header
      return
    setContent: (content) ->
      @$body.html content
      return
    setWidth: (width) ->
      @opts.width = width
      @resize()
      return
    getModal: ->
      @$modal
    getBody: ->
      @$body
    getHeader: ->
      @$header
    open: ->
      if @isOpened()
        return
      # if @isMobile()
      #   @opts.width = '96%'
      if @opts.overlay
        @$overlay.show()
      @$target.removeClass('hide').show()
      @enableEvents()
      @findActions()
      @resize()
      $(window).on 'resize.component.modal', $.proxy(@resize, this)
      # if @isDesktop()
      @disableBodyScroll()
      # enter
      @$modal.find('input[type=text],input[type=url],input[type=email]').on 'keydown.component.modal', $.proxy(@handleEnter, this)
      @callback 'open'
      @$modal.animation @opts.animation.open, $.proxy(@opened, this)
      return
    opened: ->
      @$modal.addClass 'open'
      @callback 'opened'
      $.modalcurrent = this
      return
    handleEnter: (e) ->
      if e.which == 13
        e.preventDefault()
        @close false
      return
    handleEscape: (e) ->
      if e.which == 27 then @close(false) else true
    close: (e) ->
      if !@$modal or @isClosed()
        return
      if e
        if @shouldNotBeClosed(e.target)
          return
        e.preventDefault()
      @callback 'close'
      @disableEvents()
      @$modal.animation @opts.animation.close, $.proxy(@closed, this)
      if @opts.overlay
        @$overlay.animation @opts.animation.close
      return
    closed: ->
      @callback 'closed'
      @$target.addClass 'hide'
      @$modal.removeClass 'open'
      # if @isDesktop()
      @enableBodyScroll()
      @$body.css 'height', ''
      $.modalcurrent = null
      return
    shouldNotBeClosed: (el) ->
      if $(el).attr('data-action') == 'modal-close' or el == @$close[0]
        return false
      else if $(el).closest('.modal').length == 0
        return false
      true
    isOpened: ->
      @$modal.hasClass 'open'
    isClosed: ->
      !@$modal.hasClass('open')
    destroy: ->
      @$element.off '.component.modal'
      @enableBodyScroll()
      @disableEvents()
      @$body.css 'height', ''
      @$target.addClass 'hide'
      if @opts.overlay
        @$overlay.remove()
      return
  )
  return
