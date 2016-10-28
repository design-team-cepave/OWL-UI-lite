(function() {
  var owlUiLite, owluilite;
  owluilite = function(element, options) {
    this.$element = $(element);
    this.opts = $.extend(true, {}, this.opts, this.$element.data(), options);
    if (this.opts.hasOwnProperty('animation') && this.opts.animation === false) {
      this.opts.animation = {};
      this.opts.animation.open = 'show';
      this.opts.animation.close = 'hide';
    }
  };
  owluilite.prototype = {
    callback: function(type) {
      var args, callback, eventNamespace, events, value;
      value = void 0;
      args = [].slice.call(arguments).splice(1);
      eventNamespace = this.pluginName;
      if (typeof this.$element !== 'undefined') {
        value = this.fireCallback($._data(this.$element[0], 'events'), type, eventNamespace, args);
        if (typeof value !== 'undefined') {
          return value;
        }
      }
      if (typeof this.$target !== 'undefined' && typeof this.$target !== null) {
        events = void 0;
        if (this.$target.length === 1) {
          events = $._data(this.$target[0], 'events');
          value = this.fireCallback(events, type, eventNamespace, args);
          if (typeof value !== 'undefined') {
            return value;
          }
        } else {
          value = [];
          this.$target.each($.proxy((function(i, s) {
            events = $._data(s, 'events');
            value.push(this.fireCallback(events, type, eventNamespace, args));
          }), this));
          return value;
        }
      }
      if (typeof this.opts === 'undefined' || typeof this.opts.callbacks === 'undefined' || typeof this.opts.callbacks[type] === 'undefined') {
        return args;
      }
      callback = this.opts.callbacks[type];
      if ($.isFunction(callback)) {
        return callback.apply(this, args);
      } else {
        return args;
      }
    },
    fireCallback: function(events, type, eventNamespace, args) {
      var i, len, namespace;
      if (typeof events !== 'undefined' && typeof events[type] !== 'undefined') {
        len = events[type].length;
        i = 0;
        while (i < len) {
          namespace = events[type][i].namespace;
          if (namespace === 'callback.' + eventNamespace || namespace === eventNamespace + '.callback') {
            return events[type][i].handler.apply(this, args);
          }
          i++;
        }
      }
    },
    disableBodyScroll: function() {
      var $body, documentElementRect, isOverflowing, scrollbarWidth, windowWidth;
      $body = $('html');
      windowWidth = window.innerWidth;
      if (!windowWidth) {
        documentElementRect = document.documentElement.getBoundingClientRect();
        windowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
      }
      isOverflowing = document.body.clientWidth < windowWidth;
      scrollbarWidth = this.measureScrollbar();
      $body.css('overflow', 'hidden');
      if (isOverflowing) {
        $body.css('padding-right', scrollbarWidth);
      }
    },
    measureScrollbar: function() {
      var $body, scrollDiv, scrollbarWidth;
      $body = $('body');
      scrollDiv = document.createElement('div');
      scrollDiv.className = 'scrollbar-measure';
      $body.append(scrollDiv);
      scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
      $body[0].removeChild(scrollDiv);
      return scrollbarWidth;
    },
    enableBodyScroll: function() {
      $('html').css({
        'overflow': '',
        'padding-right': ''
      });
    },
    appendFields: function(data) {
      var $fields, str;
      if (this.opts.appendFields === false) {
        return data;
      }
      $fields = $(this.opts.appendFields);
      if ($fields.length === 0) {
        return data;
      } else {
        str = '';
        $fields.each(function() {
          str += '&' + $(this).attr('name') + '=' + $(this).val();
        });
        if (data === '') {
          return str.replace(/^&/, '');
        } else {
          return data + str;
        }
      }
    },
    appendFieldsAsData: function(data) {
      var $fields;
      if (this.opts.appendFields === false) {
        return data;
      }
      $fields = $(this.opts.appendFields);
      if ($fields.length === 0) {
        return data;
      } else {
        $fields.each(function() {
          data.append($(this).attr('name'), $(this).val());
        });
        return data;
      }
    },
    appendForms: function(data) {
      var $forms, str;
      if (this.opts.appendForms === false) {
        return data;
      }
      $forms = $(this.opts.appendForms);
      if ($forms.length === 0) {
        return data;
      } else {
        str = $forms.serialize();
        if (data === '') {
          return str;
        } else {
          return data + '&' + str;
        }
      }
    },
    appendFormsAsData: function(data) {
      var formsData;
      if (this.opts.appendForms === false) {
        return data;
      }
      formsData = $(this.opts.appendForms).serializeArray();
      $.each(formsData, function(z, f) {
        data.append(f.name, f.value);
      });
      return data;
    }
  };
  owlUiLite = {
    pluginsByClass: {},
    classByPlugin: {},
    directLoad: {
      'message': 'open'
    },
    plugin: function(name, obj) {
      var classname, key, klass;
      klass = function() {
        if (obj.hasOwnProperty('init')) {
          obj.init.apply(this, arguments);
        }
      };
      obj.pluginName = name;
      klass.prototype = Object.create(owluilite.prototype);
      klass.prototype.constructor = klass;
      for (key in obj) {
        klass.prototype[key] = obj[key];
      }
      classname = obj.hasOwnProperty('classname') ? obj.classname : false;
      if (classname) {
        owlUiLite.classByPlugin[name] = classname;
        owlUiLite.pluginsByClass[classname] = name;
      }
      $.fn[name] = owlUiLite.createPlugin(name, klass, classname);
      return klass;
    },
    createPlugin: function(name, obj, classname) {
      var plugin;
      plugin = function(options) {
        var args, val;
        val = [];
        args = Array.prototype.slice.call(arguments, 1);
        if (typeof options === 'string') {
          this.eq(0).each(function() {
            var direct, instance, key, methodVal;
            instance = $.data(this, name);
            if (typeof instance !== 'undefined' && $.isFunction(instance[options])) {
              methodVal = instance[options].apply(instance, args);
              if (methodVal !== void 0 && methodVal !== instance) {
                val.push(methodVal);
              }
            } else {
              direct = false;
              for (key in owlUiLite.directLoad) {
                if (name === key && options === owlUiLite.directLoad[key]) {
                  direct = true;
                  owlUiLite.directPluginLoad(this, name);
                }
              }
              if (!direct) {
                return $.error('No such method "' + options + '" for ' + name);
              }
            }
          });
        } else {
          this.each(function() {
            var $el, instance;
            $el = $(this);
            if ($el.attr('data-component-' + name + '-loaded') === true) {
              return;
            }
            $el.attr('data-component-' + name + '-loaded', true);
            instance = new obj(this, options);
            $.data(this, name, {});
            $.data(this, name, instance);
            if (typeof instance.$target !== 'undefined' && typeof instance.$target !== null) {
              instance.$target.data(name, instance);
            }
          });
        }
        if (val.length === 0 || val.length === 1) {
          if (val.length === 0) {
            return this;
          } else {
            return val[0];
          }
        } else {
          return val;
        }
      };
      $(window).on('load.components.' + name, function() {
        if (classname) {
          $('.' + classname)[name]();
        }
        $('[data-component="' + name + '"]')[name]();
      });
      return plugin;
    },
    directPluginLoad: function(target, name) {
      var element;
      element = document.createElement('span');
      $(element)[name]({
        target: target,
        show: true
      });
    }
  };
  window.owluilite = owluilite;
  window.owlUiLite = owlUiLite;
})();

(function($) {
  var Animation;
  Animation = function(element, animation, options, callback) {
    var opts;
    opts = {
      name: 'show',
      duration: 0.5,
      iterate: 1,
      delay: 0,
      prefix: '',
      timing: 'linear'
    };
    if (typeof animation === 'object') {
      callback = options;
      options = animation;
    } else {
      opts.name = animation;
    }
    if (typeof options === 'function') {
      callback = options;
      this.opts = opts;
    } else {
      this.opts = $.extend(opts, options);
    }
    this.slide = this.opts.name === 'slideDown' || this.opts.name === 'slideUp';
    this.$element = $(element);
    this.prefixes = ['', '-moz-', '-o-animation-', '-webkit-'];
    this.queue = [];
    if (this.slide) {
      this.$element.height(this.$element.height());
    }
    this.init(callback);
  };
  $.fn.animation = function(animation, options, callback) {
    return this.each(function() {
      return new Animation(this, animation, options, callback);
    });
  };
  Animation.prototype = {
    init: function(callback) {
      this.queue.push(this.opts.name);
      this.clean();
      if (this.opts.name === 'show') {
        this.$element.removeClass('hide').show();
      } else if (this.opts.name === 'hide') {
        this.$element.hide();
      }
      if (this.opts.name === 'show' || this.opts.name === 'hide') {
        this.opts.timing = 'linear';
        if (typeof callback === 'function') {
          setTimeout(callback, this.opts.duration * 1000);
        }
      } else {
        this.animate(callback);
      }
    },
    animate: function(callback) {
      var _callback;
      this.$element.addClass('animated').css('display', 'block').removeClass('hide');
      this.$element.addClass(this.opts.prefix + this.queue[0]);
      this.set(this.opts.duration + 's', this.opts.delay + 's', this.opts.iterate, this.opts.timing);
      _callback = this.queue.length > 1 ? null : callback;
      this.complete('AnimationEnd', $.proxy(this.makeComplete, this), _callback);
    },
    set: function(duration, delay, iterate, timing) {
      var len;
      len = this.prefixes.length;
      while (len--) {
        this.$element.css(this.prefixes[len] + 'animation-duration', duration);
        this.$element.css(this.prefixes[len] + 'animation-delay', delay);
        this.$element.css(this.prefixes[len] + 'animation-iteration-count', iterate);
        this.$element.css(this.prefixes[len] + 'animation-timing-function', timing);
      }
    },
    clean: function() {
      this.$element.removeClass('animated').removeClass(this.opts.prefix + this.queue[0]);
      this.set('', '', '', '');
    },
    makeComplete: function() {
      if (this.$element.hasClass(this.opts.prefix + this.queue[0])) {
        this.clean();
        this.queue.shift();
        if (this.queue.length) {
          this.animate(callback);
        }
      }
    },
    complete: function(type, make, callback) {
      var event;
      event = type.toLowerCase() + ' webkit' + type + ' o' + type + ' MS' + type;
      this.$element.one(event, $.proxy((function() {
        var effects;
        if (typeof make === 'function') {
          make();
        }
        effects = ['fadeOut', 'slideUp', 'zoomOut', 'slideOutUp', 'slideOutRight', 'slideOutLeft'];
        if ($.inArray(this.opts.name, effects) !== -1) {
          this.$element.css('display', 'none');
        }
        if (this.slide) {
          this.$element.css('height', '');
        }
        if (typeof callback === 'function') {
          callback(this);
        }
        this.$element.off(event);
      }), this));
    }
  };
})(jQuery);

(function($) {
  $.modalcurrent = null;
  $.modalwindow = function(options) {
    var args;
    if (typeof this.element === 'undefined') {
      this.element = document.createElement('span');
    }
    if (typeof options === 'string') {
      args = Array.prototype.slice.call(arguments, 1);
      $(this.element).modal(options, args[0]);
    } else {
      options.show = true;
      $(this.element).modal(options);
    }
  };
})(jQuery);

(function(owluilite) {
  owluilite.Modal = owlUiLite.plugin('modal', {
    opts: {
      target: null,
      url: false,
      header: false,
      width: '600px',
      height: false,
      maxHeight: false,
      position: 'center',
      show: false,
      overlay: true,
      appendForms: false,
      appendFields: false,
      animation: {
        open: {
          name: 'show',
          timing: 'linear',
          duration: 0.25
        },
        close: {
          name: 'hide',
          timing: 'linear',
          duration: 0.25
        }
      },
      callbacks: ['open', 'opened', 'close', 'closed']
    },
    init: function() {
      owluilite.apply(this, arguments);
      if (this.opts.target === null) {
        return;
      }
      this.$target = $(this.opts.target);
      if (this.$target.length === 0) {
        return;
      }
      if (this.opts.show) {
        this.load(false);
      } else {
        this.$element.on('mousedown.component.modal', $.proxy(this.load, this));
      }
    },
    load: function(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      if (this.$element.hasClass('in')) {
        return;
      }
      this.buildModal();
      this.buildOverlay();
      this.buildHeader();
      if (this.opts.url) {
        this.buildContent();
      } else {
        this.open();
      }
    },
    buildModal: function() {
      this.$modal = this.$target.find('.modal');
      this.$header = this.$target.find('.modal-header');
      this.$close = this.$target.find('.close');
      this.$body = this.$target.find('.modal-body');
    },
    buildOverlay: function() {
      if (this.opts.overlay === false) {
        return;
      }
      if ($('#modal-overlay').length !== 0) {
        this.$overlay = $('#modal-overlay');
      } else {
        this.$overlay = $('<div id="modal-overlay">').hide();
        $('body').prepend(this.$overlay);
      }
      this.$overlay.addClass('overlay');
    },
    buildHeader: function() {
      if (this.opts.header) {
        this.$header.html(this.opts.header);
      }
    },
    buildContent: function() {
      var params;
      params = '';
      params = this.appendForms(params);
      params = this.appendFields(params);
      $.ajax({
        url: this.opts.url + '?' + (new Date).getTime(),
        cache: false,
        type: 'post',
        data: params,
        success: $.proxy((function(data) {
          this.$body.html(data);
          this.open();
        }), this)
      });
    },
    buildWidth: function() {
      var bottom, percent, top, width;
      width = this.opts.width;
      top = '2%';
      bottom = '2%';
      percent = width.match(/%$/);
      if (parseInt(this.opts.width) > $(window).width() && !percent) {
        width = '96%';
      } else if (!percent) {
        top = '16px';
        bottom = '16px';
      }
      this.$modal.css({
        'width': width,
        'margin-top': top,
        'margin-bottom': bottom
      });
    },
    buildPosition: function() {
      var height, top, windowHeight;
      if (this.opts.position !== 'center') {
        return;
      }
      windowHeight = $(window).height();
      height = this.$modal.outerHeight();
      top = windowHeight / 2 - (height / 2) + 'px';
      if (height > windowHeight) {
        top = '16px';
      }
      this.$modal.css('margin-top', top);
    },
    buildHeight: function() {
      var height, margin, modalHeight, padding, windowHeight;
      windowHeight = $(window).height();
      if (this.opts.maxHeight) {
        padding = parseInt(this.$body.css('padding-top')) + parseInt(this.$body.css('padding-bottom'));
        margin = parseInt(this.$modal.css('margin-top')) + parseInt(this.$modal.css('margin-bottom'));
        height = windowHeight - this.$header.innerHeight() - padding - margin;
        this.$body.height(height);
      } else if (this.opts.height !== false) {
        this.$body.css('height', this.opts.height);
      }
      modalHeight = this.$modal.outerHeight();
      if (modalHeight > windowHeight) {
        this.opts.animation.open.name = 'show';
        this.opts.animation.close.name = 'hide';
      }
    },
    resize: function() {
      this.buildWidth();
      this.buildPosition();
      this.buildHeight();
    },
    enableEvents: function() {
      this.$close.on('click.component.modal', $.proxy(this.close, this));
      $(document).on('keyup.component.modal', $.proxy(this.handleEscape, this));
      this.$target.on('click.component.modal', $.proxy(this.close, this));
    },
    disableEvents: function() {
      this.$close.off('.component.modal');
      $(document).off('.component.modal');
      this.$target.off('.component.modal');
      $(window).off('.component.modal');
    },
    findActions: function() {
      this.$body.find('[data-action="modal-close"]').on('mousedown.component.modal', $.proxy(this.close, this));
    },
    setHeader: function(header) {
      this.$header.html(header);
    },
    setContent: function(content) {
      this.$body.html(content);
    },
    setWidth: function(width) {
      this.opts.width = width;
      this.resize();
    },
    getModal: function() {
      return this.$modal;
    },
    getBody: function() {
      return this.$body;
    },
    getHeader: function() {
      return this.$header;
    },
    open: function() {
      if (this.isOpened()) {
        return;
      }
      if (this.opts.overlay) {
        this.$overlay.show();
      }
      this.$target.removeClass('hide').show();
      this.enableEvents();
      this.findActions();
      this.resize();
      $(window).on('resize.component.modal', $.proxy(this.resize, this));
      this.disableBodyScroll();
      this.$modal.find('input[type=text],input[type=url],input[type=email]').on('keydown.component.modal', $.proxy(this.handleEnter, this));
      this.callback('open');
      this.$modal.animation(this.opts.animation.open, $.proxy(this.opened, this));
    },
    opened: function() {
      this.$modal.addClass('open');
      this.callback('opened');
      $.modalcurrent = this;
    },
    handleEnter: function(e) {
      if (e.which === 13) {
        e.preventDefault();
        this.close(false);
      }
    },
    handleEscape: function(e) {
      if (e.which === 27) {
        return this.close(false);
      } else {
        return true;
      }
    },
    close: function(e) {
      if (!this.$modal || this.isClosed()) {
        return;
      }
      if (e) {
        if (this.shouldNotBeClosed(e.target)) {
          return;
        }
        e.preventDefault();
      }
      this.callback('close');
      this.disableEvents();
      this.$modal.animation(this.opts.animation.close, $.proxy(this.closed, this));
      if (this.opts.overlay) {
        this.$overlay.animation(this.opts.animation.close);
      }
    },
    closed: function() {
      this.callback('closed');
      this.$target.addClass('hide');
      this.$modal.removeClass('open');
      this.enableBodyScroll();
      this.$body.css('height', '');
      $.modalcurrent = null;
    },
    shouldNotBeClosed: function(el) {
      if ($(el).attr('data-action') === 'modal-close' || el === this.$close[0]) {
        return false;
      } else if ($(el).closest('.modal').length === 0) {
        return false;
      }
      return true;
    },
    isOpened: function() {
      return this.$modal.hasClass('open');
    },
    isClosed: function() {
      return !this.$modal.hasClass('open');
    },
    destroy: function() {
      this.$element.off('.component.modal');
      this.enableBodyScroll();
      this.disableEvents();
      this.$body.css('height', '');
      this.$target.addClass('hide');
      if (this.opts.overlay) {
        this.$overlay.remove();
      }
    }
  });
})(owluilite);
