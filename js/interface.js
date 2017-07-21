Fliplet().then(function () {
  function multiple(type, value) {
    if (!type || !value) {
      return;
    }

    return _.compact(value.split(',').map(function (val) {
      var pieces = val.trim().match(/(.+)<(.+)>/);
      if (!pieces) {
        pieces = [null, val, val];
      }

      var name = pieces[1].trim().replace(/^"/, '').replace(/"$/, '');
      var email = pieces[2].trim().replace(/'"/g, '');

      if (!email) {
        return;
      }

      var person = {
        type: type,
        email: email
      };

      if (name && name !== email) {
        person.name = name;
      }

      return person;
    }));
  }

  function checkMultipleFieldToggles() {
    if (!$('.data-display [data-display]').length) {
      $('.data-display').remove();
      Fliplet.Widget.autosize();
    }
  }

  var multipleFields = ['to', 'cc', 'bcc'];
  var data = _.omit(Fliplet.Widget.getData(), ['id', 'uuid']);
  var $textarea = $('textarea');

  function showGroup($el) {
    $el.closest('.form-group').removeClass('hidden');
  }

  multipleFields.forEach(function (name) {
    var value = _.filter(data.to, { type: name });
    if (Array.isArray(value) && value.length) {
      showGroup($('[name="' + name + '"]').val(value.map(function (val) {
        if (val.name && val.name !== val.email) {
          return val.name + ' <' + val.email + '>';
        }

        return val.email;
      }).join(', ')));

      $('[data-display="' + name + '"]').remove();
    }
  });

  checkMultipleFieldToggles();

  if (data.headers && data.headers['Reply-To']) {
   showGroup($('[name="replyTo"]').val(data.headers['Reply-To']));
   $('[data-display="replyTo"]').hide();
  }

  $('[data-display]').click(function (event) {
    event.preventDefault();
    showGroup($('input[name="' + $(this).data('display') + '"]'));
    $(this).remove();
    checkMultipleFieldToggles();
    Fliplet.Widget.autosize();
  });

  $('form').submit(function (event) {
    event.preventDefault();

    data.headers = data.headers || {};
    data.to = [];
    data.subject = $('[name="subject"]').val();

    multipleFields.forEach(function (name) {
      var value = $('[name="' + name + '"]').val();
      if (!value) {
        return;
      }

      multiple(name, value).forEach(function (email) {
        if (email) {
          data.to.push(email);
        }
      });
    });

    var replyTo = $('[name="replyTo"]').val();
    if (replyTo) {
      data.headers['Reply-To'] = replyTo;
    }

    // Don't pass back the options
    delete data.options;

    Fliplet.Widget.save(data).then(function () {
      Fliplet.Widget.complete();
    });
  });

  $(window).on('resize', Fliplet.Widget.autosize);

  Fliplet.Widget.onSaveRequest(function () {
    $('form').submit();
  });

  $textarea.tinymce({
    theme: 'modern',
    plugins: [
      'link image charmap hr',
      'searchreplace insertdatetime table textcolor colorpicker code'
    ],
    menubar: false,
    statusbar: true,
    inline: false,
    resize: true,
    min_height: 300,
    toolbar: [
      'formatselect | fontselect fontsizeselect | bold italic underline strikethrough |',
      'alignleft aligncenter alignright alignjustify | link | bullist numlist outdent indent |',
      'blockquote subscript superscript | table hr | removeformat | code'
    ].join(' '),
    setup: function (ed) {
      ed.on('keyup paste', function(e) {
        data.html = ed.getContent();
      });
    }
  });
});
