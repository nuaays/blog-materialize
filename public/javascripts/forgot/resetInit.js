// reset-form
(function() {
  var validator = {
    wrongMessage: {
      'password': 'Invalid password',
      'confirm': 'Passwords are not consistent',
    },
    checkPassword: function(password) {
      return /^[0-9a-zA-Z+\-*/=!?@_]{6,18}$/.test(password);
    },
    checkSame: function(password, confirmPassword) {
      return password == confirmPassword;
    },
    invalidResetForm: function(password, confirm) {
      if (!this.checkPassword(password) || !this.checkPassword(confirm)) {
        Materialize.toast(this.wrongMessage.password, 1000);
        return true;
      } else if (!this.checkSame(password, confirm)) {
        Materialize.toast(this.wrongMessage.confirm, 1000);
        return true;
      }
      return false;
    }
  };

  function resetFormSubmitHandler() {
    var password = $('.reset-form #reset-password').val();
    var confirm = $('.reset-form #reset-confirm').val();

    var postData = {
      password: password,
      confirm: confirm,
    };

    if (!validator.invalidResetForm(password, confirm)) {
      $.post('/users/resetpassword', postData, function(data, status) {
        if (data.success) {
          Materialize.toast('Your password has been revised successfully', 4000);
          // refresh();
          window.location.reload();
        } else {
          Materialize.toast(data.err, 1000);
        }
      });
    }

    return false;
  }

  function refresh() {
    window.location.reload();
  }

  $(function() {
    $('.reset-form .btn').click(resetFormSubmitHandler);
  });
})();
